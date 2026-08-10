import { NextResponse } from "next/server";
import {
  BUNDESLAENDER,
  type SchoolHolidayPeriod,
} from "@/lib/school-holidays";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const state = (url.searchParams.get("state") || "").toUpperCase();
  const allowed = new Set(BUNDESLAENDER.map((b) => b.code));
  if (!allowed.has(state as (typeof BUNDESLAENDER)[number]["code"])) {
    return NextResponse.json(
      { error: "Bundesland wählen (z. B. BW)." },
      { status: 400 },
    );
  }

  const yearNow = new Date().getFullYear();
  const years = [yearNow, yearNow + 1];
  const periods: SchoolHolidayPeriod[] = [];

  try {
    for (const year of years) {
      const res = await fetch(
        `https://ferien-api.de/api/v1/holidays/${state}/${year}`,
        {
          headers: { Accept: "application/json" },
          next: { revalidate: 86_400 },
        },
      );
      if (!res.ok) {
        return NextResponse.json(
          {
            error: `Ferien-Daten für ${state}/${year} gerade nicht erreichbar.`,
          },
          { status: 502 },
        );
      }
      const data = (await res.json()) as SchoolHolidayPeriod[];
      if (Array.isArray(data)) periods.push(...data);
    }
  } catch {
    return NextResponse.json(
      { error: "Keine Verbindung zur Ferien-Quelle." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    state,
    source: "ferien-api.de",
    periods,
  });
}
