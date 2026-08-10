import { demoWasteEvents } from "@/data/demo-waste-events";
import type {
  AppState,
  DocumentDeadline,
  DocumentType,
  HouseholdMember,
  MealPlanDay,
  NearbyStore,
  PantryItem,
  PlanEvent,
  Recipe,
  Routine,
  ShopItem,
} from "@/lib/types";

/** Nominatim-belegte Märkte (Stand 2026-08-10), Distanz von Landstraße 19, Stein/Hechingen. Keine erfundenen Adressen. */
export const DEFAULT_STORE_IDS = [
  "kaufland-kaullastrasse",
  "lidl-haigerlocher",
  "dm-hechingen",
  "aldi-hechingen",
];

export const nearbyStoresHechingen: NearbyStore[] = [
  {
    id: "kaufland-kaullastrasse",
    name: "Kaufland",
    chain: "Kaufland",
    address: "Kaullastraße 1, Hechingen",
    distanceKm: 1.2,
    walkMin: 14,
    lat: 48.3748565,
    lon: 8.9614123,
    source: "demo",
  },
  {
    id: "lidl-haigerlocher",
    name: "Lidl",
    chain: "Lidl",
    address: "Haigerlocher Straße 38, Hechingen",
    distanceKm: 1.8,
    walkMin: 22,
    lat: 48.3619034,
    lon: 8.9631948,
    source: "demo",
  },
  {
    id: "dm-hechingen",
    name: "dm",
    chain: "dm",
    address: "Haigerlocher Straße 24, Hechingen",
    distanceKm: 1.9,
    walkMin: 23,
    lat: 48.3602403,
    lon: 8.9625031,
    source: "demo",
  },
  {
    id: "edeka-hechingen",
    name: "Edeka Beha",
    chain: "Edeka",
    address: "Haigerlocher Straße 16, Hechingen",
    distanceKm: 2.1,
    walkMin: 25,
    lat: 48.3592418,
    lon: 8.9641984,
    source: "demo",
  },
  {
    id: "aldi-hechingen",
    name: "Aldi Süd",
    chain: "Aldi",
    address: "Eitel-Fritz-Straße 7, Hechingen",
    distanceKm: 2.3,
    walkMin: 28,
    lat: 48.3563677,
    lon: 8.9636486,
    source: "demo",
  },
  {
    id: "kaufland-gammertinger",
    name: "Kaufland",
    chain: "Kaufland",
    address: "Gammertinger Straße 44, Hechingen",
    distanceKm: 3.0,
    walkMin: 36,
    lat: 48.3545327,
    lon: 8.9754127,
    source: "demo",
  },
  {
    id: "rewe-hechingen",
    name: "REWE",
    chain: "REWE",
    address: "Holger-Crafoord-Straße 3, Hechingen",
    distanceKm: 3.3,
    walkMin: 40,
    lat: 48.352127,
    lon: 8.9763959,
    source: "demo",
  },
  {
    id: "lidl-stetten",
    name: "Lidl",
    chain: "Lidl",
    address: "Stettener Halde 13, Hechingen-Stetten",
    distanceKm: 3.3,
    walkMin: 40,
    lat: 48.351242,
    lon: 8.9760768,
    source: "demo",
  },
];

/** Platzhalter — keine Live-Wetter-API; UI muss als Demo kennzeichnen. */
export const todayWeather = {
  tempC: 18,
  condition: "trocken",
  source: "demo" as const,
};

export const defaultShoppingList: ShopItem[] = [
  {
    id: "s1",
    name: "Milch",
    qty: "1 L",
    checked: false,
  },
  {
    id: "s2",
    name: "Kaffee",
    qty: "500 g",
    checked: false,
  },
  {
    id: "s3",
    name: "Waschmittel",
    qty: "1 Pack",
    checked: false,
  },
  {
    id: "s4",
    name: "Tomaten",
    qty: "500 g",
    checked: true,
  },
  {
    id: "s5",
    name: "Nudeln",
    qty: "500 g",
    checked: false,
  },
];

export const defaultRoutines: Routine[] = [
  {
    id: "r1",
    title: "Müll rausstellen",
    cadence: "wöchentlich",
    detail: "Abholung morgen früh.",
    dueLabel: "Heute Abend",
    done: false,
    assignee: "Tom",
  },
  {
    id: "r2",
    title: "Spülmaschine ausräumen",
    cadence: "täglich",
    detail: "Vor dem Abendessen.",
    dueLabel: "Heute",
    done: false,
  },
  {
    id: "r3",
    title: "Pflanzen gießen",
    cadence: "wöchentlich",
    detail: "Wohnzimmer + Balkon.",
    dueLabel: "Morgen",
    done: false,
  },
  {
    id: "r4",
    title: "Kühlschrank checken",
    cadence: "monatlich",
    detail: "Abgelaufenes entsorgen, Liste ergänzen.",
    dueLabel: "Diese Woche",
    done: false,
  },
  {
    id: "r5",
    title: "Rauchmelder prüfen",
    cadence: "jährlich",
    detail: "Batterie und Piepton testen.",
    dueLabel: "März",
    done: false,
  },
];

export const defaultEvents: PlanEvent[] = [
  {
    id: "e1",
    title: "Zahnarzt",
    time: "15:30",
    dayOffset: 0,
    kind: "termin",
    detail: "Dr. Keller — danach wenig Zeit zum Kochen.",
  },
  {
    id: "e2",
    title: "Abendessen: Pasta Aglio",
    time: "18:45",
    dayOffset: 0,
    kind: "essen",
    detail: "Unter 20 Minuten — Anleitung in der App.",
  },
  {
    id: "e3",
    title: "Müll rausstellen",
    time: "20:00",
    dayOffset: 0,
    kind: "routine",
    detail: "Abholung morgen früh.",
  },
  {
    id: "e4",
    title: "Wocheneinkauf",
    time: "10:00",
    dayOffset: 1,
    kind: "termin",
    detail: "Mit gewählten Märkten abgleichen.",
  },
  {
    id: "e5",
    title: "Elternabend Schule",
    time: "19:00",
    dayOffset: 2,
    kind: "privat",
    detail: "Optional — nur sichtbar für Erwachsene.",
  },
];

export const defaultDocuments: DocumentDeadline[] = [
  {
    id: "d1",
    title: "Personalausweis",
    docType: "personalausweis",
    person: "Stefan",
    personId: "m1",
    expiresOn: "2028-03-14",
    warnMonths: 6,
    warnLabel: "Erste Erinnerung in 6 Monaten",
  },
];

export function makeInviteCode(): string {
  return `LR-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export const defaultMembers: HouseholdMember[] = [
  { id: "m1", name: "Stefan", role: "owner", color: "#4a6f8c" },
  { id: "m2", name: "Tom", role: "adult", color: "#5a9a7a" },
];

export const docTypeLabel: Record<DocumentType, string> = {
  personalausweis: "Personalausweis",
  reisepass: "Reisepass",
  fuehrerschein: "Führerschein",
  krankenkarte: "Krankenkassenkarte",
  sonstiges: "Sonstiges",
};

export function warnLabelForMonths(months: number): string {
  if (months <= 1) return "Erinnerung 4 Wochen vorher";
  if (months <= 3) return "Erinnerung 3 Monate vorher";
  return `Erinnerung ${months} Monate vorher`;
}

export const defaultPantry: PantryItem[] = [
  {
    id: "p1",
    name: "Milch",
    amount: 1,
    minAmount: 2,
    unit: "Liter",
    estimate: "1 Liter · unter Mindestvorrat (2)",
    status: "low",
  },
  {
    id: "p2",
    name: "Kaffee",
    amount: 2,
    minAmount: 2,
    unit: "Packung",
    estimate: "2 Packungen",
    status: "ok",
  },
  {
    id: "p3",
    name: "Nudeln",
    amount: 3,
    minAmount: 2,
    unit: "Packung",
    estimate: "3 Packungen",
    status: "ok",
  },
  {
    id: "p4",
    name: "Olivenöl",
    amount: 1,
    minAmount: 1,
    unit: "Flasche",
    estimate: "1 Flasche",
    status: "ok",
  },
  {
    id: "p5",
    name: "Eier",
    amount: 4,
    minAmount: 6,
    unit: "Stück",
    estimate: "4 Stück · unter Mindestvorrat (6)",
    status: "low",
  },
  {
    id: "p6",
    name: "Waschmittel",
    amount: 1,
    minAmount: 1,
    unit: "Flasche",
    estimate: "1 Flasche",
    status: "ok",
  },
];

export const defaultMealPlan: MealPlanDay[] = [
  {
    id: "m0",
    dayLabel: "Heute",
    title: "Pasta Aglio e Olio",
    minutes: 18,
    note: "Schnell nach dem Zahnarzt.",
    missing: [],
    recipeId: "pasta-aglio",
  },
  {
    id: "m1",
    dayLabel: "Morgen",
    title: "Rührei mit Toast",
    minutes: 12,
    note: "Eier fehlen im Vorrat.",
    missing: ["Eier", "Toastbrot"],
  },
  {
    id: "m2",
    dayLabel: "Mittwoch",
    title: "Resteverwertung Bowl",
    minutes: 20,
    note: "Nutzt Gemüse aus dem Kühlschrank.",
    missing: [],
  },
  {
    id: "m3",
    dayLabel: "Freitag",
    title: "Gäste-Grillen",
    minutes: 45,
    note: "4 Personen — Mengen hochrechnen.",
    missing: ["Würstchen", "Salate", "Getränke"],
  },
];

export const lifeAiSuggestions = [
  "Setz Milch, Kaffee und Waschmittel auf die Liste.",
  "Plane fünf Abendessen. Dienstag schnell, Freitag Gäste.",
  "Was kann ich heute noch erledigen?",
  "Mein Personalausweis läuft am 14. März 2028 ab.",
  "Müll ist erledigt.",
];

export const kindLabel = {
  termin: "Termin",
  einkauf: "Einkauf",
  haushalt: "Zuhause",
  frist: "Frist",
  essen: "Essen",
} as const;

export const recipes: Record<string, Recipe> = {
  "pasta-aglio": {
    id: "pasta-aglio",
    title: "Pasta Aglio e Olio",
    time: "ca. 18 Min.",
    servings: "2 Personen",
    whyToday:
      "Zahnarzt erst um 15:30 — danach wenig Zeit. Dieses Gericht bleibt unter 20 Minuten und braucht kaum Vorrat.",
    ingredients: [
      { name: "Spaghetti", amount: "250 g", status: "da" },
      { name: "Knoblauch", amount: "3 Zehen", status: "optional" },
      { name: "Olivenöl", amount: "4 EL", status: "da" },
      { name: "Chiliflocken", amount: "1 TL", status: "da" },
      { name: "Petersilie", amount: "1 Handvoll", status: "da" },
      { name: "Salz", amount: "nach Geschmack", status: "da" },
    ],
    steps: [
      "Reichlich Wasser aufsetzen, salzen. Spaghetti nach Packung al dente kochen.",
      "Währenddessen Knoblauch in feine Scheiben schneiden.",
      "In einer großen Pfanne Olivenöl auf mittlerer Hitze erwärmen, Knoblauch und Chili darin goldgelb anschwitzen — nicht braun werden lassen.",
      "Eine Kelle Nudelwasser in die Pfanne geben, kurz emulgieren.",
      "Abgegossene Pasta dazugeben, schwenken, Petersilie unterheben. Abschmecken und sofort servieren.",
    ],
    tip: "Knoblauch ist optional nachkaufbar — ohne geht’s auch, dann etwas mehr Chili und Petersilie.",
  },
};

export function createDefaultState(): AppState {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const todayISO = `${y}-${m}-${d}`;
  const withDates = defaultEvents.map((ev) => {
    const dt = new Date(`${todayISO}T12:00:00`);
    dt.setDate(dt.getDate() + ev.dayOffset);
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return { ...ev, date: `${yy}-${mm}-${dd}` };
  });
  return {
    profile: {
      onboardingDone: false,
      displayName: "Stefan",
      householdType: "paar",
      location: "Hechingen",
      preferredStoreIds: [...DEFAULT_STORE_IDS],
      inviteCode: makeInviteCode(),
    },
    members: structuredClone(defaultMembers),
    shoppingList: structuredClone(
      defaultShoppingList.map((i) => ({ ...i, visibility: "shared" as const })),
    ),
    routines: structuredClone(
      defaultRoutines.map((r) => ({ ...r, visibility: "shared" as const })),
    ),
    events: structuredClone([...withDates, ...demoWasteEvents]),
    documents: structuredClone(defaultDocuments),
    pantry: structuredClone(defaultPantry),
    mealPlan: structuredClone(defaultMealPlan),
    userCatalog: [],
    discoveredStores: [],
  };
}

export const householdTypeLabel: Record<string, string> = {
  allein: "Allein",
  paar: "Paar",
  familie: "Familie",
  wg: "WG",
};
