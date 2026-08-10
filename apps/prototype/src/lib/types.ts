export type HouseholdType = "allein" | "paar" | "familie" | "wg";

export type PriorityKind = "termin" | "einkauf" | "haushalt" | "frist" | "essen";

export type Priority = {
  id: string;
  kind: PriorityKind;
  title: string;
  detail: string;
  meta?: string;
  href?: string;
  why?: string;
};

export type ShopOffer = {
  storeId: string;
  storeLabel: string;
  save: string;
  saveValue: number;
  advice: "kaufen" | "warten";
  note: string;
  /** Prototyp: noch keine Live-Prospekt-Daten */
  demo?: boolean;
  /** demo = Katalog, user = selbst aus Prospekt, partner = Feed */
  source?: "demo" | "user" | "partner";
};

export type ShopItem = {
  id: string;
  name: string;
  qty: string;
  checked: boolean;
  offer?: ShopOffer;
  barcode?: string;
  source?: "manual" | "scan" | "pantry" | "meal" | "ai" | "receipt";
  /** Geteilt mit Haushalt oder nur für dich */
  visibility?: "shared" | "private";
  assigneeId?: string;
};

export type NearbyStore = {
  id: string;
  name: string;
  chain: string;
  address: string;
  distanceKm: number;
  walkMin: number;
  /** Nur setzen wenn aus Öffnungszeiten belegt — sonst weglassen (nichts erfinden). */
  openNow?: boolean;
  lat?: number;
  lon?: number;
  source?: "demo" | "osm";
};

export type Routine = {
  id: string;
  title: string;
  cadence: "täglich" | "wöchentlich" | "monatlich" | "jährlich";
  detail: string;
  dueLabel: string;
  done: boolean;
  assignee?: string;
  visibility?: "shared" | "private";
};

export type EventRepeat = "none" | "weekly" | "biweekly" | "monthly";

export type PlanEvent = {
  id: string;
  title: string;
  time: string;
  /** YYYY-MM-DD — bevorzugte Speicherung */
  date?: string;
  /** Relativ zu „heute“; wird aus date abgeleitet / Legacy */
  dayOffset: number;
  kind: "termin" | "routine" | "essen" | "privat";
  detail: string;
  visibility?: "shared" | "private";
  /** Gleiche Serie bei Wiederholung */
  seriesId?: string;
  /** true = Serien-Regel (wird für Anzeige expandiert, unbegrenzt bis beendet) */
  seriesMaster?: boolean;
  repeat?: EventRepeat;
  /** Ende der Serie (inkl.); fehlt = läuft weiter bis beendet */
  repeatUntil?: string;
  /** Einzelne Tage aus der Serie auslassen */
  skipDates?: string[];
};

export type DocumentType =
  | "personalausweis"
  | "reisepass"
  | "fuehrerschein"
  | "krankenkarte"
  | "sonstiges";

export type DocumentDeadline = {
  id: string;
  title: string;
  docType: DocumentType;
  person: string;
  personId?: string;
  expiresOn: string;
  warnMonths: number;
  warnLabel: string;
};

export type PantryItem = {
  id: string;
  name: string;
  estimate: string;
  status: "ok" | "low" | "empty";
  /** Zählbare Menge (Eier, Packungen, …) */
  amount: number;
  /** Unter diesem Wert → „wird knapp“ */
  minAmount: number;
  /** z. B. Stück, Packung, Liter */
  unit: string;
  barcode?: string;
};

export type UserCatalogEntry = {
  barcode: string;
  name: string;
  qty: string;
  learnedAt: string;
  source: "user" | "openfoodfacts" | "demo";
};

export type MealPlanDay = {
  id: string;
  dayLabel: string;
  title: string;
  minutes: number;
  note: string;
  missing: string[];
  recipeId?: string;
};

export type Recipe = {
  id: string;
  title: string;
  time: string;
  servings: string;
  whyToday: string;
  ingredients: {
    name: string;
    amount: string;
    status: "da" | "optional" | "fehlt";
  }[];
  steps: string[];
  tip?: string;
};

export type HouseholdMember = {
  id: string;
  name: string;
  role: "owner" | "adult" | "child";
  color: string;
};

export type AppProfile = {
  onboardingDone: boolean;
  displayName: string;
  householdType: HouseholdType;
  location: string;
  locationLat?: number;
  locationLon?: number;
  preferredStoreIds: string[];
  /** Einladungs-Code für den Haushalt (Demo) */
  inviteCode: string;
};

export type AppState = {
  profile: AppProfile;
  members: HouseholdMember[];
  shoppingList: ShopItem[];
  routines: Routine[];
  events: PlanEvent[];
  documents: DocumentDeadline[];
  pantry: PantryItem[];
  mealPlan: MealPlanDay[];
  userCatalog: UserCatalogEntry[];
  /** Live gefundene Märkte (OSM), gemischt mit Demo */
  discoveredStores: NearbyStore[];
};
