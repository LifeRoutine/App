import { NextRequest, NextResponse } from "next/server";
import { reversePlace, searchPlaces } from "@/lib/geocode";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mode = searchParams.get("mode") ?? "search";

  try {
    if (mode === "reverse") {
      const lat = Number(searchParams.get("lat"));
      const lon = Number(searchParams.get("lon"));
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return NextResponse.json({ error: "lat/lon ungültig" }, { status: 400 });
      }
      const hit = await reversePlace(lat, lon);
      return NextResponse.json({ hit });
    }

    const q = searchParams.get("q") ?? "";
    const hits = await searchPlaces(q);
    return NextResponse.json({ hits });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Geocoding fehlgeschlagen";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
