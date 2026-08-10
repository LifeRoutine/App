/** Deutsche Bundesländer für Schulferien (ferien-api.de / ISO-3166-2:DE). */
export const BUNDESLAENDER = [
  { code: "BW", name: "Baden-Württemberg" },
  { code: "BY", name: "Bayern" },
  { code: "BE", name: "Berlin" },
  { code: "BB", name: "Brandenburg" },
  { code: "HB", name: "Bremen" },
  { code: "HH", name: "Hamburg" },
  { code: "HE", name: "Hessen" },
  { code: "MV", name: "Mecklenburg-Vorpommern" },
  { code: "NI", name: "Niedersachsen" },
  { code: "NW", name: "Nordrhein-Westfalen" },
  { code: "RP", name: "Rheinland-Pfalz" },
  { code: "SL", name: "Saarland" },
  { code: "SN", name: "Sachsen" },
  { code: "ST", name: "Sachsen-Anhalt" },
  { code: "SH", name: "Schleswig-Holstein" },
  { code: "TH", name: "Thüringen" },
] as const;

export type BundeslandCode = (typeof BUNDESLAENDER)[number]["code"];

export type SchoolHolidayPeriod = {
  start: string;
  end: string;
  year: number;
  stateCode: string;
  name: string;
  slug: string;
};

/** Farbe für Schulferien-Balken (Familienkalender-Stil). */
export const SCHOOL_HOLIDAY_COLOR = "#c4a35a";

export function bundeslandName(code: string): string {
  return BUNDESLAENDER.find((b) => b.code === code)?.name ?? code;
}

/** API liefert z. B. „osterferien baden-württemberg 2026“ → „Osterferien“. */
export function formatSchoolHolidayTitle(raw: string): string {
  const first = (raw.trim().split(/\s+/)[0] ?? raw).toLowerCase();
  if (!first) return "Schulferien";
  return first.charAt(0).toUpperCase() + first.slice(1);
}
