import { nearbyStoresHechingen } from "@/lib/mock-data";
import { eventsOnDate, localDateISO } from "@/lib/plan-dates";
import type { AppState, NearbyStore, ShopItem } from "@/lib/types";

function allStores(state: AppState): NearbyStore[] {
  const map = new Map<string, NearbyStore>();
  for (const s of nearbyStoresHechingen) map.set(s.id, s);
  for (const s of state.discoveredStores ?? []) map.set(s.id, s);
  return [...map.values()];
}

export type TripStop = {
  store: NearbyStore;
  items: ShopItem[];
  saveTotal: number;
  distanceKm: number;
};

export type ExtrawegAdvice = {
  storeName: string;
  distanceKm: number;
  walkMin: number;
  saveTotal: number;
  worthIt: boolean;
  reason: string;
};

export type DayInsight = {
  id: string;
  title: string;
  detail: string;
  href?: string;
};

/** Geschätzte Minuten, die LifeRoutine heute abnimmt (Demo-Logik). */
export function estimateMinutesSaved(state: AppState): number {
  const openOffers = state.shoppingList.filter(
    (i) =>
      !i.checked &&
      i.offer &&
      state.profile.preferredStoreIds.includes(i.offer.storeId),
  ).length;
  const openRoutines = state.routines.filter((r) => !r.done).length;
  const mealsWithMissing = state.mealPlan.filter((m) => m.missing.length > 0)
    .length;
  return Math.min(45, 8 + openOffers * 3 + openRoutines * 4 + mealsWithMissing * 5);
}

/** Einkaufsroute: nur gewählte Märkte, die für offene Angebotsartikel relevant sind. */
export function buildShoppingTrip(state: AppState): TripStop[] {
  const open = state.shoppingList.filter(
    (i) =>
      !i.checked &&
      i.offer &&
      state.profile.preferredStoreIds.includes(i.offer.storeId),
  );

  const byStore = new Map<string, ShopItem[]>();
  for (const item of open) {
    const id = item.offer!.storeId;
    const list = byStore.get(id) ?? [];
    list.push(item);
    byStore.set(id, list);
  }

  const stops: TripStop[] = [];
  for (const [storeId, items] of byStore) {
    const store = allStores(state).find((s) => s.id === storeId);
    if (!store) continue;
    stops.push({
      store,
      items,
      saveTotal: items.reduce((s, i) => s + (i.offer?.saveValue ?? 0), 0),
      distanceKm: store.distanceKm,
    });
  }

  return stops.sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * „Lohnt sich der Extraweg?“ — einfache Heuristik:
 * Ersparnis in € vs. Distanz/Zeit (Demo: unter 1 €/km oder unter 0,08 €/Min oft nicht lohnenswert).
 */
export function extrawegAdvice(state: AppState): ExtrawegAdvice[] {
  return buildShoppingTrip(state).map((stop) => {
    const perKm = stop.saveTotal / Math.max(stop.distanceKm, 0.1);
    const perMin = stop.saveTotal / Math.max(stop.store.walkMin, 1);
    const worthIt = perKm >= 0.9 || perMin >= 0.08 || stop.saveTotal >= 1.5;
    return {
      storeName: stop.store.name,
      distanceKm: stop.distanceKm,
      walkMin: stop.store.walkMin,
      saveTotal: stop.saveTotal,
      worthIt,
      reason: worthIt
        ? `−${stop.saveTotal.toFixed(2).replace(".", ",")} € bei ${stop.distanceKm.toFixed(1).replace(".", ",")} km — Extraweg lohnt sich.`
        : `Nur −${stop.saveTotal.toFixed(2).replace(".", ",")} € bei ${stop.store.walkMin} Min. — eher mitnehmen, wenn du ohnehin vorbei kommst.`,
    };
  });
}

/** Verbundene Alltagssignale — der eigentliche LifeRoutine-Unterschied. */
export function buildDayInsights(state: AppState): DayInsight[] {
  const insights: DayInsight[] = [];
  const zahnarzt = eventsOnDate(state.events, localDateISO()).find((e) =>
    e.title.toLowerCase().includes("zahnarzt"),
  );
  const pasta = state.mealPlan.find((m) => m.dayLabel === "Heute");
  if (zahnarzt && pasta) {
    insights.push({
      id: "link-zahnarzt-essen",
      title: "Termin → Essen verbunden",
      detail: `${zahnarzt.title} um ${zahnarzt.time} → ${pasta.title} (${pasta.minutes} Min.). Wenig Zeit eingeplant, keine Extra-Einkäufe nötig.`,
      href: pasta.recipeId ? `/essen/${pasta.recipeId}` : "/einkauf/essensplan",
    });
  }

  const waitCoffee = state.shoppingList.find(
    (i) =>
      !i.checked &&
      i.offer?.advice === "warten" &&
      state.profile.preferredStoreIds.includes(i.offer.storeId),
  );
  if (waitCoffee?.offer) {
    insights.push({
      id: "link-warten",
      title: "Sparen statt Sofortkauf",
      detail: `${waitCoffee.name}: ${waitCoffee.offer.note}`,
      href: "/einkauf",
    });
  }

  const lowPantry = state.pantry.filter((p) => p.status !== "ok");
  const mealMissing = state.mealPlan.flatMap((m) => m.missing);
  const overlap = lowPantry.filter((p) =>
    mealMissing.some((m) => m.toLowerCase() === p.name.toLowerCase()),
  );
  if (overlap.length > 0) {
    const names = overlap.map((p) => p.name).join(", ");
    insights.push({
      id: "link-vorrat-plan",
      title: "Fehlende Zutaten für das Essen",
      detail: `${names}: im Vorrat knapp und im Essensplan als fehlend. Unter Essensplan auf die Einkaufsliste setzen.`,
      href: "/einkauf/essensplan",
    });
  }

  const preferred = new Set(state.profile.preferredStoreIds);
  const pantryDeal = state.pantry.find((p) => {
    if (p.amount >= p.minAmount) return false;
    const listHit = state.shoppingList.find(
      (s) =>
        s.name.toLowerCase() === p.name.toLowerCase() &&
        s.offer?.advice === "kaufen" &&
        preferred.has(s.offer.storeId),
    );
    return Boolean(listHit?.offer);
  });
  if (pantryDeal) {
    const offer = state.shoppingList.find(
      (s) => s.name.toLowerCase() === pantryDeal.name.toLowerCase(),
    )?.offer;
    if (offer) {
      insights.push({
        id: "link-vorrat-angebot",
        title: "Mindestvorrat + Angebot",
        detail: `${pantryDeal.name} unter Mindestvorrat — Nachkaufen lohnt (−${offer.save} bei ${offer.storeLabel}${offer.demo !== false ? ", Demo" : ""}).`,
        href: "/einkauf/vorraete",
      });
    }
  }

  const guests = state.mealPlan.find((m) =>
    m.title.toLowerCase().includes("gäste"),
  );
  if (guests) {
    insights.push({
      id: "link-gaeste",
      title: "Ein Satz, viele Folgen",
      detail: `„${guests.title}“ → Mengen, Einkauf (${guests.missing.join(", ") || "Liste prüfen"}) und Timing sind verknüpft.`,
      href: "/einkauf/essensplan",
    });
  }

  return insights.slice(0, 3);
}

export function whyForPriority(
  kind: string,
  title: string,
  state: AppState,
): string {
  if (kind === "einkauf" && title.toLowerCase().includes("später")) {
    return "Aus Angebot + Vorratsschätzung: jetzt kaufen würde Geld kosten, ohne Not.";
  }
  if (kind === "einkauf") {
    return "Abgleich Liste ↔ deine gewählten Märkte ↔ aktuelle Angebote.";
  }
  if (kind === "termin") {
    return "Aus dem Plan — beeinflusst Essen und verfügbare Zeit heute.";
  }
  if (kind === "essen") {
    const event = eventsOnDate(state.events, localDateISO()).find(
      (e) => e.kind === "termin",
    );
    return event
      ? `Kalender sagt wenig Zeit nach ${event.title} → schnelles Gericht priorisiert.`
      : "Essensplan + Vorrat: Zutaten passen, Aufwand gering.";
  }
  if (kind === "haushalt") {
    return "Routine fällig und Tag noch nicht voll — deshalb heute sichtbar.";
  }
  if (kind === "frist") {
    return "Dokumentfrist mit Vorlauf — nur Metadaten, keine unnötigen Scans.";
  }
  return "Aus verbundenen Alltagssignalen priorisiert.";
}
