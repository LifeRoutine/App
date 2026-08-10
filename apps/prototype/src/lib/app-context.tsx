"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createDefaultState,
  householdTypeLabel,
  nearbyStoresHechingen,
  todayWeather,
} from "@/lib/mock-data";
import {
  buildDayInsights,
  buildShoppingTrip,
  estimateMinutesSaved,
  extrawegAdvice,
  whyForPriority,
  type DayInsight,
  type ExtrawegAdvice,
  type TripStop,
} from "@/lib/insights";
import type {
  AppProfile,
  AppState,
  DocumentDeadline,
  DocumentType,
  HouseholdMember,
  HouseholdType,
  NearbyStore,
  PantryItem,
  PlanEvent,
  Priority,
  ShopItem,
  ShopOffer,
  UserCatalogEntry,
} from "@/lib/types";
import { resolveOffer } from "@/lib/offers";
import { formatSave } from "@/lib/offers/types";
import { ensureNamesInCatalog, rememberInCatalog } from "@/lib/catalog-memory";
import {
  estimateFromAmount,
  guessDefaultMin,
  guessDefaultUnit,
  parseQtyHint,
  statusFromAmount,
} from "@/lib/pantry";
import {
  dayOffsetFromDate,
  eventDateISO,
  eventsOnDate,
  localDateISO,
  normalizePlanEvent,
} from "@/lib/plan-dates";
import { hydrateAppState } from "@/lib/backup";
import { makeInviteCode, warnLabelForMonths } from "@/lib/mock-data";

const STORAGE_KEY = "liferoutine.app.v1";
const GUEST_KEY = "liferoutine.guest.v1";

type DemoUser = {
  username: string;
  displayName: string;
  householdId: string;
};

function modeFromStore(
  store?: string,
): "server" | "local-file" | "memory" | "browser" {
  if (store === "redis") return "server";
  if (store === "local") return "local-file";
  if (store === "memory") return "memory";
  return "browser";
}

function readGuestFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(GUEST_KEY) === "1";
  } catch {
    return false;
  }
}

function writeGuestFlag(on: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (on) window.sessionStorage.setItem(GUEST_KEY, "1");
    else window.sessionStorage.removeItem(GUEST_KEY);
  } catch {
    /* ignore */
  }
}

type AppContextValue = {
  ready: boolean;
  authenticated: boolean;
  /** Ohne Konto — nur dieses Gerät / Browser */
  isGuest: boolean;
  demoUser: DemoUser | null;
  storageMode: "server" | "local-file" | "memory" | "browser";
  loginDemo: (
    username: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  continueAsGuest: () => void;
  logoutDemo: () => Promise<void>;
  state: AppState;
  allStores: NearbyStore[];
  preferredStores: NearbyStore[];
  preferredStoreLabels: string;
  weather: {
    location: string;
    tempC: number;
    condition: string;
    source: "demo";
  };
  todayPriorities: Priority[];
  visibleOffersSavings: number;
  minutesSaved: number;
  dayInsights: DayInsight[];
  shoppingTrip: TripStop[];
  extraweg: ExtrawegAdvice[];
  completeOnboarding: (input: {
    displayName: string;
    householdType: HouseholdType;
    location: string;
    locationLat?: number;
    locationLon?: number;
    preferredStoreIds: string[];
  }) => void;
  togglePreferredStore: (id: string) => void;
  setDiscoveredStores: (stores: NearbyStore[]) => void;
  toggleShopItem: (id: string) => void;
  toggleShopVisibility: (id: string) => void;
  setShopOffer: (
    id: string,
    input: {
      storeId: string;
      saveValue: number;
      advice: ShopOffer["advice"];
      note?: string;
    },
  ) => void;
  clearShopOffer: (id: string) => void;
  addShopItems: (
    names: string[],
    meta?: { barcode?: string; source?: ShopItem["source"]; qty?: string },
  ) => void;
  addPantryItem: (input: {
    name: string;
    barcode?: string;
    status?: PantryItem["status"];
    amount?: number;
    unit?: string;
    qty?: string;
  }) => void;
  adjustPantryAmount: (id: string, delta: number) => void;
  setPantryUnit: (id: string, unit: string) => void;
  setPantryMinAmount: (id: string, minAmount: number) => void;
  teachCatalog: (input: {
    barcode: string;
    name: string;
    qty?: string;
    source?: UserCatalogEntry["source"];
  }) => void;
  lookupUserCatalog: (barcode: string) => UserCatalogEntry | null;
  clearCheckedToPantry: () => number;
  removeCatalogEntry: (barcode: string) => void;
  addRoutine: (title: string) => void;
  addMissingFromMeal: (mealId: string) => number;
  toggleRoutine: (id: string) => void;
  cyclePantryStatus: (id: string) => void;
  addMember: (name: string, role?: HouseholdMember["role"]) => void;
  removeMember: (id: string) => void;
  regenerateInvite: () => void;
  joinWithInvite: (code: string, name: string) => boolean;
  addDocument: (input: {
    title: string;
    docType: DocumentType;
    person: string;
    personId?: string;
    expiresOn: string;
    warnMonths: number;
  }) => void;
  removeDocument: (id: string) => void;
  addEvent: (input: {
    title: string;
    date: string;
    time: string;
    kind?: PlanEvent["kind"];
    detail?: string;
    visibility?: PlanEvent["visibility"];
    repeat?: PlanEvent["repeat"];
    repeatUntil?: string;
    endDate?: string;
    memberId?: string;
    source?: PlanEvent["source"];
  }) => void;
  /** Eigenen Urlaub (Mehrtages, Farbe der Person) */
  addVacation: (input: {
    memberId: string;
    startDate: string;
    endDate: string;
    title?: string;
  }) => void;
  removeEvent: (id: string) => void;
  /** Serie komplett löschen */
  removeEventSeries: (seriesId: string) => void;
  /** Serie beenden (keine weiteren Termine nach dem Datum) */
  endEventSeries: (seriesId: string, lastDateInclusive: string) => void;
  /** Einzelnen Serientermin auslassen */
  skipSeriesOccurrence: (seriesId: string, dateISO: string) => void;
  /** Müllkalender (.ics) importieren — ersetzt vorherige Müll-ICS-Termine */
  importIcsEvents: (events: PlanEvent[]) => number;
  /** Schulferien laden — ersetzt vorherige Schulferien-Einträge */
  importSchoolHolidays: (events: PlanEvent[], stateCode: string) => number;
  resetDemo: () => Promise<void>;
  importBackup: (next: AppState) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

function loadState(): AppState {
  if (typeof window === "undefined") return createDefaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = createDefaultState();
      return {
        ...fresh,
        userCatalog: ensureNamesInCatalog(fresh.userCatalog, [
          ...fresh.shoppingList.map((i) => i.name),
          ...fresh.pantry.map((p) => p.name),
        ]),
      };
    }
    return hydrateAppState(JSON.parse(raw));
  } catch {
    return createDefaultState();
  }
}

function saveState(state: AppState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function mergeShopNames(
  prev: ShopItem[],
  names: string[],
  meta?: { barcode?: string; source?: ShopItem["source"]; qty?: string },
): ShopItem[] {
  const existing = new Set(prev.map((i) => i.name.toLowerCase()));
  const additions: ShopItem[] = names
    .filter((n) => !existing.has(n.toLowerCase()))
    .map((name, index) => ({
      id: `add-${Date.now()}-${index}`,
      name,
      qty: meta?.qty ?? "1×",
      checked: false,
      barcode: meta?.barcode,
      source: meta?.source ?? "manual",
      visibility: "shared" as const,
    }));
  const revived = prev.map((item) =>
    names.some((n) => n.toLowerCase() === item.name.toLowerCase())
      ? {
          ...item,
          checked: false,
          qty: meta?.qty ?? item.qty,
          barcode: meta?.barcode ?? item.barcode,
          source: meta?.source ?? item.source,
        }
      : item,
  );
  return [...revived, ...additions];
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(createDefaultState);
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);
  const [storageMode, setStorageMode] = useState<
    "server" | "local-file" | "memory" | "browser"
  >("browser");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/demo/session", { credentials: "include" });
        const data = (await res.json()) as {
          authenticated?: boolean;
          user?: DemoUser;
          state?: AppState;
          store?: string;
        };
        if (cancelled) return;
        if (data.authenticated && data.user && data.state) {
          writeGuestFlag(false);
          setDemoUser(data.user);
          setState(hydrateAppState(data.state));
          setAuthenticated(true);
          setIsGuest(false);
          setStorageMode(modeFromStore(data.store));
        } else if (readGuestFlag()) {
          setAuthenticated(false);
          setDemoUser(null);
          setIsGuest(true);
          setState(loadState());
          setStorageMode("browser");
        } else {
          setAuthenticated(false);
          setDemoUser(null);
          setIsGuest(false);
        }
      } catch {
        if (!cancelled) {
          if (readGuestFlag()) {
            setIsGuest(true);
            setState(loadState());
            setStorageMode("browser");
          }
          setAuthenticated(false);
          setDemoUser(null);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (authenticated) {
      saveState(state);
      const t = window.setTimeout(() => {
        void fetch("/api/demo/state", {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state }),
        }).catch(() => {
          /* offline — lokal bleibt Cache */
        });
      }, 600);
      return () => window.clearTimeout(t);
    }
    if (isGuest) {
      saveState(state);
    }
  }, [ready, authenticated, isGuest, state]);

  const loginDemo = useCallback(async (username: string, password: string) => {
    try {
      const res = await fetch("/api/demo/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json()) as {
        error?: string;
        user?: DemoUser;
        state?: AppState;
        store?: string;
      };
      if (!res.ok || !data.user || !data.state) {
        return {
          ok: false as const,
          error: data.error || "Anmeldung fehlgeschlagen.",
        };
      }
      writeGuestFlag(false);
      setIsGuest(false);
      setDemoUser(data.user);
      setState(hydrateAppState(data.state));
      setAuthenticated(true);
      setStorageMode(modeFromStore(data.store));
      return { ok: true as const };
    } catch {
      return {
        ok: false as const,
        error: "Keine Verbindung zum Server.",
      };
    }
  }, []);

  const continueAsGuest = useCallback(() => {
    writeGuestFlag(true);
    setIsGuest(true);
    setAuthenticated(false);
    setDemoUser(null);
    setState(loadState());
    setStorageMode("browser");
  }, []);

  const logoutDemo = useCallback(async () => {
    try {
      await fetch("/api/demo/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* ignore */
    }
    writeGuestFlag(false);
    setIsGuest(false);
    setAuthenticated(false);
    setDemoUser(null);
    setState(createDefaultState());
    setStorageMode("browser");
  }, []);
  const update = useCallback((fn: (prev: AppState) => AppState) => {
    setState(fn);
  }, []);

  const allStores = useMemo(() => {
    const map = new Map<string, NearbyStore>();
    for (const s of nearbyStoresHechingen) map.set(s.id, s);
    for (const s of state.discoveredStores) map.set(s.id, s);
    return [...map.values()];
  }, [state.discoveredStores]);

  const preferredStores = useMemo(
    () =>
      allStores.filter((s) => state.profile.preferredStoreIds.includes(s.id)),
    [allStores, state.profile.preferredStoreIds],
  );

  const preferredStoreLabels =
    preferredStores.length > 0
      ? preferredStores.map((s) => s.chain).join(" · ")
      : "Keine Märkte gewählt";

  const visibleOffersSavings = useMemo(() => {
    return state.shoppingList
      .filter((i) => !i.checked)
      .map((i) =>
        resolveOffer(i.offer, {
          productName: i.name,
          preferredStoreIds: state.profile.preferredStoreIds,
          stores: allStores,
        }),
      )
      .filter(
        (o): o is ShopOffer =>
          o != null &&
          o.advice === "kaufen" &&
          state.profile.preferredStoreIds.includes(o.storeId),
      )
      .reduce((sum, o) => sum + (o.saveValue ?? 0), 0);
  }, [state.shoppingList, state.profile.preferredStoreIds, allStores]);

  const todayPriorities = useMemo((): Priority[] => {
    const openOffers = state.shoppingList
      .filter((i) => !i.checked)
      .map((i) => ({
        item: i,
        offer: resolveOffer(i.offer, {
          productName: i.name,
          preferredStoreIds: state.profile.preferredStoreIds,
          stores: allStores,
        }),
      }))
      .filter(
        (x): x is { item: ShopItem; offer: ShopOffer } =>
          x.offer != null &&
          state.profile.preferredStoreIds.includes(x.offer.storeId),
      );
    const waitOffer = openOffers.find((x) => x.offer.advice === "warten");
    const buyOffer = openOffers.find((x) => x.offer.advice === "kaufen");
    const openRoutine = state.routines.find((r) => !r.done);
    const today = localDateISO();
    const todayEvents = eventsOnDate(state.events, today, today);
    const doc = state.documents[0];
    const list: Priority[] = [];

    if (waitOffer) {
      list.push({
        id: `shop-${waitOffer.item.id}`,
        kind: "einkauf",
        title: `${waitOffer.item.name} erst später kaufen`,
        detail: `Bei ${waitOffer.offer.storeLabel} −${waitOffer.offer.save}. ${waitOffer.offer.note}`,
        meta: "Sparen",
        href: "/einkauf",
        why: whyForPriority(
          "einkauf",
          `${waitOffer.item.name} erst später kaufen`,
          state,
        ),
      });
    } else if (buyOffer) {
      list.push({
        id: `shop-${buyOffer.item.id}`,
        kind: "einkauf",
        title: `${buyOffer.item.name} heute mitnehmen`,
        detail: `Bei ${buyOffer.offer.storeLabel} −${buyOffer.offer.save}.`,
        meta: "Angebot",
        href: "/einkauf",
        why: whyForPriority("einkauf", buyOffer.item.name, state),
      });
    }

    for (const ev of todayEvents.filter((e) => e.kind === "termin")) {
      list.push({
        id: ev.id,
        kind: "termin",
        title: `${ev.title} ${ev.time}`,
        detail: ev.detail,
        meta: "Heute",
        href: "/plan",
        why: whyForPriority("termin", ev.title, state),
      });
    }

    for (const ev of todayEvents.filter((e) => e.kind === "essen")) {
      list.push({
        id: ev.id,
        kind: "essen",
        title: ev.title,
        detail: ev.detail,
        meta: `${ev.time} · Anleitung`,
        href: "/essen/pasta-aglio",
        why: whyForPriority("essen", ev.title, state),
      });
    }

    if (openRoutine) {
      list.push({
        id: openRoutine.id,
        kind: "haushalt",
        title: openRoutine.title,
        detail: openRoutine.assignee
          ? `${openRoutine.detail} ${openRoutine.assignee} erinnert.`
          : openRoutine.detail,
        meta: openRoutine.dueLabel,
        href: "/zuhause",
        why: whyForPriority("haushalt", openRoutine.title, state),
      });
    }

    if (doc) {
      list.push({
        id: doc.id,
        kind: "frist",
        title: `${doc.title} — Vorwarnung`,
        detail: `Läuft ${new Date(doc.expiresOn).toLocaleDateString("de-DE", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}. ${doc.warnLabel}.`,
        meta: "Frist",
        href: "/plan",
        why: whyForPriority("frist", doc.title, state),
      });
    }

    return list.slice(0, 4);
  }, [state, allStores]);

  const minutesSaved = useMemo(() => estimateMinutesSaved(state), [state]);
  const dayInsights = useMemo(() => buildDayInsights(state), [state]);
  const shoppingTrip = useMemo(() => buildShoppingTrip(state), [state]);
  const extraweg = useMemo(() => extrawegAdvice(state), [state]);

  const completeOnboarding = useCallback(
    (input: {
      displayName: string;
      householdType: HouseholdType;
      location: string;
      locationLat?: number;
      locationLon?: number;
      preferredStoreIds: string[];
    }) => {
      update((prev) => ({
        ...prev,
        profile: { ...prev.profile, ...input, onboardingDone: true },
      }));
    },
    [update],
  );

  const togglePreferredStore = useCallback(
    (id: string) => {
      update((prev) => {
        const has = prev.profile.preferredStoreIds.includes(id);
        return {
          ...prev,
          profile: {
            ...prev.profile,
            preferredStoreIds: has
              ? prev.profile.preferredStoreIds.filter((x) => x !== id)
              : [...prev.profile.preferredStoreIds, id],
          },
        };
      });
    },
    [update],
  );

  const toggleShopItem = useCallback(
    (id: string) => {
      update((prev) => ({
        ...prev,
        shoppingList: prev.shoppingList.map((item) =>
          item.id === id ? { ...item, checked: !item.checked } : item,
        ),
      }));
    },
    [update],
  );

  const addShopItems = useCallback(
    (
      names: string[],
      meta?: { barcode?: string; source?: ShopItem["source"]; qty?: string },
    ) => {
      update((prev) => ({
        ...prev,
        shoppingList: mergeShopNames(prev.shoppingList, names, meta),
        userCatalog: rememberInCatalog(prev.userCatalog, names, {
          barcode: meta?.barcode,
          qty: meta?.qty,
          source: meta?.barcode ? "user" : "list",
        }),
      }));
    },
    [update],
  );

  const addPantryItem = useCallback(
    (input: {
      name: string;
      barcode?: string;
      status?: PantryItem["status"];
      amount?: number;
      unit?: string;
      qty?: string;
    }) => {
      const fromQty = parseQtyHint(input.qty);
      const addAmount = Math.max(
        1,
        Math.round(input.amount ?? fromQty?.amount ?? 1),
      );
      const unit = input.unit ?? fromQty?.unit ?? guessDefaultUnit(input.name);

      update((prev) => {
        const existing = prev.pantry.find(
          (p) => p.name.toLowerCase() === input.name.toLowerCase(),
        );
        if (existing) {
          const amount = existing.amount + addAmount;
          const minAmount = existing.minAmount;
          const status =
            input.status ?? statusFromAmount(amount, minAmount);
          return {
            ...prev,
            pantry: prev.pantry.map((p) =>
              p.id === existing.id
                ? {
                    ...p,
                    amount,
                    unit: input.unit ?? existing.unit,
                    status,
                    estimate: estimateFromAmount(
                      amount,
                      input.unit ?? existing.unit,
                      minAmount,
                    ),
                    barcode: input.barcode ?? p.barcode,
                  }
                : p,
            ),
          };
        }
        const amount = addAmount;
        const minAmount = guessDefaultMin(input.name, unit);
        const status = input.status ?? statusFromAmount(amount, minAmount);
        const item: PantryItem = {
          id: `pantry-${Date.now()}`,
          name: input.name,
          amount,
          minAmount,
          unit,
          estimate: estimateFromAmount(amount, unit, minAmount),
          status,
          barcode: input.barcode,
        };
        return { ...prev, pantry: [item, ...prev.pantry] };
      });
    },
    [update],
  );

  const adjustPantryAmount = useCallback(
    (id: string, delta: number) => {
      update((prev) => ({
        ...prev,
        pantry: prev.pantry.map((p) => {
          if (p.id !== id) return p;
          const amount = Math.max(0, p.amount + delta);
          return {
            ...p,
            amount,
            status: statusFromAmount(amount, p.minAmount),
            estimate: estimateFromAmount(amount, p.unit, p.minAmount),
          };
        }),
      }));
    },
    [update],
  );

  const setPantryUnit = useCallback(
    (id: string, unit: string) => {
      update((prev) => ({
        ...prev,
        pantry: prev.pantry.map((p) => {
          if (p.id !== id) return p;
          return {
            ...p,
            unit,
            estimate: estimateFromAmount(p.amount, unit, p.minAmount),
            status: statusFromAmount(p.amount, p.minAmount),
          };
        }),
      }));
    },
    [update],
  );

  const setPantryMinAmount = useCallback(
    (id: string, minAmount: number) => {
      update((prev) => ({
        ...prev,
        pantry: prev.pantry.map((p) => {
          if (p.id !== id) return p;
          const nextMin = Math.max(1, Math.round(minAmount));
          return {
            ...p,
            minAmount: nextMin,
            status: statusFromAmount(p.amount, nextMin),
            estimate: estimateFromAmount(p.amount, p.unit, nextMin),
          };
        }),
      }));
    },
    [update],
  );

  const teachCatalog = useCallback(
    (input: {
      barcode: string;
      name: string;
      qty?: string;
      source?: UserCatalogEntry["source"];
    }) => {
      const barcode = input.barcode.replace(/\s/g, "");
      if (!barcode || !input.name.trim()) return;
      update((prev) => ({
        ...prev,
        userCatalog: rememberInCatalog(prev.userCatalog, [input.name], {
          barcode,
          qty: input.qty,
          source: input.source ?? "user",
        }),
      }));
    },
    [update],
  );

  const lookupUserCatalog = useCallback(
    (barcode: string) => {
      const code = barcode.replace(/\s/g, "");
      return (
        state.userCatalog.find((e) => e.barcode === code) ??
        state.userCatalog.find((e) => e.barcode.endsWith(code)) ??
        null
      );
    },
    [state.userCatalog],
  );

  const clearCheckedToPantry = useCallback(() => {
    let count = 0;
    update((prev) => {
      const checked = prev.shoppingList.filter((i) => i.checked);
      count = checked.length;
      if (count === 0) return prev;

      let pantry = [...prev.pantry];
      for (const item of checked) {
        const fromQty = parseQtyHint(item.qty);
        const addAmount = fromQty?.amount ?? 1;
        const unitHint = fromQty?.unit;
        const existing = pantry.find(
          (p) => p.name.toLowerCase() === item.name.toLowerCase(),
        );
        if (existing) {
          const amount = existing.amount + addAmount;
          pantry = pantry.map((p) =>
            p.id === existing.id
              ? {
                  ...p,
                  amount,
                  unit: unitHint ?? p.unit,
                  status: statusFromAmount(amount, p.minAmount),
                  estimate: estimateFromAmount(
                    amount,
                    unitHint ?? p.unit,
                    p.minAmount,
                  ),
                  barcode: item.barcode ?? p.barcode,
                }
              : p,
          );
        } else {
          const amount = addAmount;
          const unit = unitHint ?? guessDefaultUnit(item.name);
          const minAmount = guessDefaultMin(item.name, unit);
          pantry = [
            {
              id: `pantry-${Date.now()}-${item.id}`,
              name: item.name,
              amount,
              minAmount,
              unit,
              estimate: estimateFromAmount(amount, unit, minAmount),
              status: statusFromAmount(amount, minAmount),
              barcode: item.barcode,
            },
            ...pantry,
          ];
        }
      }

      return {
        ...prev,
        pantry,
        shoppingList: prev.shoppingList.filter((i) => !i.checked),
      };
    });
    return count;
  }, [update]);

  const removeCatalogEntry = useCallback(
    (barcode: string) => {
      update((prev) => ({
        ...prev,
        userCatalog: prev.userCatalog.filter((e) => e.barcode !== barcode),
      }));
    },
    [update],
  );

  const addRoutine = useCallback(
    (title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      update((prev) => ({
        ...prev,
        routines: [
          {
            id: `r-${Date.now()}`,
            title: trimmed,
            cadence: "wöchentlich",
            detail: "Selbst hinzugefügt.",
            dueLabel: "Heute",
            done: false,
          },
          ...prev.routines,
        ],
      }));
    },
    [update],
  );

  const addMissingFromMeal = useCallback(
    (mealId: string) => {
      let added = 0;
      update((prev) => {
        const meal = prev.mealPlan.find((m) => m.id === mealId);
        if (!meal || meal.missing.length === 0) return prev;
        const before = prev.shoppingList.length;
        const shoppingList = mergeShopNames(prev.shoppingList, meal.missing, {
          source: "meal",
        });
        added = shoppingList.length - before + meal.missing.filter((n) =>
          prev.shoppingList.some(
            (i) => i.name.toLowerCase() === n.toLowerCase() && i.checked,
          ),
        ).length;
        return { ...prev, shoppingList };
      });
      return added;
    },
    [update],
  );

  const toggleRoutine = useCallback(
    (id: string) => {
      update((prev) => ({
        ...prev,
        routines: prev.routines.map((r) =>
          r.id === id ? { ...r, done: !r.done } : r,
        ),
      }));
    },
    [update],
  );

  const cyclePantryStatus = useCallback(
    (id: string) => {
      const order = ["ok", "low", "empty"] as const;
      update((prev) => ({
        ...prev,
        pantry: prev.pantry.map((p) => {
          if (p.id !== id) return p;
          const next = order[(order.indexOf(p.status) + 1) % order.length];
          const amount =
            next === "empty"
              ? 0
              : next === "low"
                ? Math.max(1, Math.min(p.amount || 1, p.minAmount - 1 || 1))
                : Math.max(p.amount, p.minAmount);
          return {
            ...p,
            status: statusFromAmount(amount, p.minAmount),
            amount,
            estimate: estimateFromAmount(amount, p.unit, p.minAmount),
          };
        }),
      }));
    },
    [update],
  );

  const setDiscoveredStores = useCallback(
    (stores: NearbyStore[]) => {
      update((prev) => ({ ...prev, discoveredStores: stores }));
    },
    [update],
  );

  const toggleShopVisibility = useCallback(
    (id: string) => {
      update((prev) => ({
        ...prev,
        shoppingList: prev.shoppingList.map((item) =>
          item.id === id
            ? {
                ...item,
                visibility:
                  item.visibility === "private" ? "shared" : "private",
              }
            : item,
        ),
      }));
    },
    [update],
  );

  const setShopOffer = useCallback(
    (
      id: string,
      input: {
        storeId: string;
        saveValue: number;
        advice: ShopOffer["advice"];
        note?: string;
      },
    ) => {
      update((prev) => {
        const store =
          nearbyStoresHechingen.find((s) => s.id === input.storeId) ||
          prev.discoveredStores.find((s) => s.id === input.storeId);
        const saveValue = Math.max(0, Number(input.saveValue) || 0);
        const offer: ShopOffer = {
          storeId: input.storeId,
          storeLabel: store?.name ?? store?.chain ?? "Markt",
          save: formatSave(saveValue),
          saveValue,
          advice: input.advice,
          note:
            input.note?.trim() ||
            "Aus dem Online-Prospekt von dir übernommen.",
          demo: false,
          source: "user",
        };
        return {
          ...prev,
          shoppingList: prev.shoppingList.map((item) =>
            item.id === id ? { ...item, offer } : item,
          ),
        };
      });
    },
    [update],
  );

  const clearShopOffer = useCallback(
    (id: string) => {
      update((prev) => ({
        ...prev,
        shoppingList: prev.shoppingList.map((item) =>
          item.id === id ? { ...item, offer: undefined } : item,
        ),
      }));
    },
    [update],
  );

  const addMember = useCallback(
    (name: string, role: HouseholdMember["role"] = "adult") => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const colors = ["#4a6f8c", "#5a9a7a", "#8bbfa5", "#9ebfd0", "#6b7c88"];
      update((prev) => ({
        ...prev,
        members: [
          ...prev.members,
          {
            id: `m-${Date.now()}`,
            name: trimmed,
            role,
            color: colors[prev.members.length % colors.length],
          },
        ],
      }));
    },
    [update],
  );

  const removeMember = useCallback(
    (id: string) => {
      update((prev) => ({
        ...prev,
        members: prev.members.filter(
          (m) => m.id !== id || m.role === "owner",
        ),
      }));
    },
    [update],
  );

  const regenerateInvite = useCallback(() => {
    update((prev) => ({
      ...prev,
      profile: { ...prev.profile, inviteCode: makeInviteCode() },
    }));
  }, [update]);

  const joinWithInvite = useCallback(
    (code: string, name: string) => {
      const normalized = code.trim().toUpperCase();
      if (!normalized || normalized !== state.profile.inviteCode.toUpperCase()) {
        return false;
      }
      addMember(name || "Neu", "adult");
      return true;
    },
    [addMember, state.profile.inviteCode],
  );

  const addDocument = useCallback(
    (input: {
      title: string;
      docType: DocumentType;
      person: string;
      personId?: string;
      expiresOn: string;
      warnMonths: number;
    }) => {
      const doc: DocumentDeadline = {
        id: `doc-${Date.now()}`,
        title: input.title.trim() || input.docType,
        docType: input.docType,
        person: input.person.trim() || "Ich",
        personId: input.personId,
        expiresOn: input.expiresOn,
        warnMonths: input.warnMonths,
        warnLabel: warnLabelForMonths(input.warnMonths),
      };
      update((prev) => ({
        ...prev,
        documents: [doc, ...prev.documents],
      }));
    },
    [update],
  );

  const removeDocument = useCallback(
    (id: string) => {
      update((prev) => ({
        ...prev,
        documents: prev.documents.filter((d) => d.id !== id),
      }));
    },
    [update],
  );

  const addEvent = useCallback(
    (input: {
      title: string;
      date: string;
      time: string;
      kind?: PlanEvent["kind"];
      detail?: string;
      visibility?: PlanEvent["visibility"];
      repeat?: PlanEvent["repeat"];
      repeatUntil?: string;
      endDate?: string;
      memberId?: string;
      source?: PlanEvent["source"];
    }) => {
      const title = input.title.trim();
      if (!title || !input.date) return;
      const today = localDateISO();
      const repeat = input.repeat ?? "none";
      const baseDetail = input.detail?.trim() || "";
      const visibility = input.visibility ?? "shared";
      const kind = input.kind ?? "termin";
      const endDate =
        input.endDate && input.endDate >= input.date
          ? input.endDate
          : undefined;

      if (repeat === "none") {
        const ev = normalizePlanEvent(
          {
            id: `ev-${Date.now()}`,
            title,
            time: input.time || "12:00",
            date: input.date,
            endDate,
            dayOffset: dayOffsetFromDate(input.date, today),
            kind,
            detail: baseDetail || "Selbst eingetragen.",
            visibility,
            repeat: "none",
            memberId: input.memberId,
            source: input.source ?? "manual",
          },
          today,
        );
        update((prev) => ({
          ...prev,
          events: [...prev.events, ev],
        }));
        return;
      }

      const seriesId = `series-${Date.now()}`;
      const master = normalizePlanEvent(
        {
          id: seriesId,
          title,
          time: input.time || "12:00",
          date: input.date,
          dayOffset: dayOffsetFromDate(input.date, today),
          kind,
          detail: baseDetail || "Selbst eingetragen.",
          visibility,
          seriesId,
          seriesMaster: true,
          repeat,
          repeatUntil: input.repeatUntil || undefined,
          skipDates: [],
          memberId: input.memberId,
          source: input.source ?? "manual",
        },
        today,
      );
      update((prev) => ({
        ...prev,
        events: [...prev.events, master],
      }));
    },
    [update],
  );

  const addVacation = useCallback(
    (input: {
      memberId: string;
      startDate: string;
      endDate: string;
      title?: string;
    }) => {
      if (!input.memberId || !input.startDate || !input.endDate) return;
      if (input.endDate < input.startDate) return;
      update((prev) => {
        const member = prev.members.find((m) => m.id === input.memberId);
        if (!member) return prev;
        const today = localDateISO();
        const title =
          input.title?.trim() || `Urlaub ${member.name}`;
        const ev = normalizePlanEvent(
          {
            id: `vac-${Date.now()}`,
            title,
            time: "00:00",
            date: input.startDate,
            endDate: input.endDate,
            dayOffset: dayOffsetFromDate(input.startDate, today),
            kind: "privat",
            detail: `Urlaub · ${member.name}`,
            visibility: "shared",
            memberId: member.id,
            source: "vacation",
            repeat: "none",
          },
          today,
        );
        return { ...prev, events: [...prev.events, ev] };
      });
    },
    [update],
  );

  const removeEvent = useCallback(
    (id: string) => {
      update((prev) => ({
        ...prev,
        events: prev.events.filter((e) => e.id !== id),
      }));
    },
    [update],
  );

  const removeEventSeries = useCallback(
    (seriesId: string) => {
      update((prev) => ({
        ...prev,
        events: prev.events.filter((e) => e.seriesId !== seriesId && e.id !== seriesId),
      }));
    },
    [update],
  );

  const endEventSeries = useCallback(
    (seriesId: string, lastDateInclusive: string) => {
      update((prev) => ({
        ...prev,
        events: prev.events.flatMap((e) => {
          if (e.seriesMaster && (e.seriesId === seriesId || e.id === seriesId)) {
            return [{ ...e, repeatUntil: lastDateInclusive }];
          }
          if (e.seriesId === seriesId && !e.seriesMaster) {
            return eventDateISO(e) > lastDateInclusive ? [] : [e];
          }
          return [e];
        }),
      }));
    },
    [update],
  );

  const skipSeriesOccurrence = useCallback(
    (seriesId: string, dateISO: string) => {
      update((prev) => ({
        ...prev,
        events: prev.events.flatMap((e) => {
          if (e.seriesMaster && e.seriesId === seriesId) {
            const skip = new Set(e.skipDates ?? []);
            skip.add(dateISO);
            return [{ ...e, skipDates: [...skip].sort() }];
          }
          // Legacy-Instanz an diesem Tag entfernen
          if (e.seriesId === seriesId && eventDateISO(e) === dateISO && !e.seriesMaster) {
            return [];
          }
          return [e];
        }),
      }));
    },
    [update],
  );

  const importIcsEvents = useCallback(
    (incoming: PlanEvent[]) => {
      const today = localDateISO();
      const normalized = incoming.map((e) => normalizePlanEvent(e, today));
      update((prev) => ({
        ...prev,
        events: [
          ...prev.events.filter((e) => e.source !== "ics"),
          ...normalized,
        ],
      }));
      return normalized.length;
    },
    [update],
  );

  const importSchoolHolidays = useCallback(
    (incoming: PlanEvent[], stateCode: string) => {
      const today = localDateISO();
      const normalized = incoming.map((e) => normalizePlanEvent(e, today));
      update((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          schoolHolidayState: stateCode,
        },
        events: [
          ...prev.events.filter((e) => e.source !== "school"),
          ...normalized,
        ],
      }));
      return normalized.length;
    },
    [update],
  );

  const resetDemo = useCallback(async () => {
    try {
      const res = await fetch("/api/demo/reset", {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as {
        state?: AppState;
        store?: string;
      };
      if (res.ok && data.state) {
        const hydrated = hydrateAppState(data.state);
        setState(hydrated);
        saveState(hydrated);
        setStorageMode(modeFromStore(data.store));
        return;
      }
    } catch {
      /* offline — lokal zurücksetzen */
    }
    const name = demoUser?.displayName ?? "Irena";
    const fresh = createDefaultState();
    const seeded: AppState = {
      ...fresh,
      profile: {
        ...fresh.profile,
        onboardingDone: true,
        displayName: name,
        householdType: "paar",
        location: "Hechingen",
      },
      members: [
        {
          id: "m1",
          name,
          role: "owner",
          color: "#4a6f8c",
        },
      ],
    };
    setState(seeded);
    saveState(seeded);
  }, [demoUser?.displayName]);

  const importBackup = useCallback((next: AppState) => {
    const hydrated = hydrateAppState(next);
    setState(hydrated);
    saveState(hydrated);
  }, []);

  const value: AppContextValue = {
    ready,
    authenticated,
    isGuest,
    demoUser,
    storageMode,
    loginDemo,
    continueAsGuest,
    logoutDemo,
    state,
    allStores,
    preferredStores,
    preferredStoreLabels,
    weather: {
      location: state.profile.location,
      tempC: todayWeather.tempC,
      condition: todayWeather.condition,
      source: todayWeather.source,
    },
    todayPriorities,
    visibleOffersSavings,
    minutesSaved,
    dayInsights,
    shoppingTrip,
    extraweg,
    completeOnboarding,
    togglePreferredStore,
    setDiscoveredStores,
    toggleShopItem,
    toggleShopVisibility,
    setShopOffer,
    clearShopOffer,
    addShopItems,
    addPantryItem,
    adjustPantryAmount,
    setPantryUnit,
    setPantryMinAmount,
    teachCatalog,
    lookupUserCatalog,
    clearCheckedToPantry,
    removeCatalogEntry,
    addRoutine,
    addMissingFromMeal,
    toggleRoutine,
    cyclePantryStatus,
    addMember,
    removeMember,
    regenerateInvite,
    joinWithInvite,
    addDocument,
    removeDocument,
    addEvent,
    addVacation,
    removeEvent,
    removeEventSeries,
    endEventSeries,
    skipSeriesOccurrence,
    importIcsEvents,
    importSchoolHolidays,
    resetDemo,
    importBackup,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp muss innerhalb von AppProvider genutzt werden");
  }
  return ctx;
}

export function profileSubtitle(profile: AppProfile) {
  return `${profile.location} · ${householdTypeLabel[profile.householdType] ?? profile.householdType}`;
}
