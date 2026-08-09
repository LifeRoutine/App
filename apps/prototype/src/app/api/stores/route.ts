import { NextRequest, NextResponse } from "next/server";
import { fetchNearbyStoresOsm } from "@/lib/osm-stores";

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lon = Number(request.nextUrl.searchParams.get("lon"));
  const radiusKm = Number(request.nextUrl.searchParams.get("radiusKm") ?? "3");

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json(
      { error: "lat/lon erforderlich — Ort im Onboarding/Einstellungen setzen" },
      { status: 400 },
    );
  }

  try {
    const stores = await fetchNearbyStoresOsm(
      lat,
      lon,
      Number.isFinite(radiusKm) ? radiusKm : 3,
    );
    return NextResponse.json({ stores, source: "overpass" });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Marktsuche fehlgeschlagen",
        stores: [],
      },
      { status: 502 },
    );
  }
}
