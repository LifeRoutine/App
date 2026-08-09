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
  Priority,
  ShopItem,
  ShopOffer,
  UserCatalogEntry,
} from "@/lib/types";
import { resolveOffer } from "@/lib/offers";
import { formatSave } from "@/lib/offers/types";
import {
  estimateFromAmount,
  guessDefaultMin,
  guessDefaultUnit,
  parseQtyHint,
  statusFromAmount,
} from "@/lib/pantry";
import { hydrateAppState } from "@/lib/backup";
import { makeInviteCode, warnLabelForMonths } from "@/lib/mock-data";

const STORAGE_KEY = "liferoutine.app.v1";

type AppContextValue = {
  ready: boolean;
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
  resetDemo: () => void;
  importBackup: (next: AppState) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

function loadState(): AppState {
  if (typeof window === "undefined") return createDefaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
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

  useEffect(() => {
    setState(loadState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveState(state);
  }, [ready, state]);

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
    const todayEvents = state.events.filter((e) => e.dayOffset === 0);
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

    return list.slice(0, 6);
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
      update((prev) => {
        const rest = prev.userCatalog.filter((e) => e.barcode !== barcode);
        const entry: UserCatalogEntry = {
          barcode,
          name: input.name.trim(),
          qty: input.qty?.trim() || "1×",
          learnedAt: new Date().toISOString(),
          source: input.source ?? "user",
        };
        return { ...prev, userCatalog: [entry, ...rest] };
      });
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

  const resetDemo = useCallback(() => {
    const fresh = createDefaultState();
    setState(fresh);
    saveState(fresh);
  }, []);

  const importBackup = useCallback((next: AppState) => {
    const hydrated = hydrateAppState(next);
    setState(hydrated);
    saveState(hydrated);
  }, []);

  const value: AppContextValue = {
    ready,
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
