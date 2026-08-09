import type { NearbyStore } from "@/lib/types";

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function guessChain(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("rewe")) return "REWE";
  if (n.includes("aldi")) return "Aldi";
  if (n.includes("lidl")) return "Lidl";
  if (n.includes("edeka") || n.includes("marktkauf")) return "Edeka";
  if (n.includes("netto")) return "Netto";
  if (n.includes("dm ")) return "dm";
  if (n.includes("rossmann")) return "Rossmann";
  if (n.includes("penny")) return "Penny";
  return name.split(/\s|-/ )[0] || name;
}

type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

export async function fetchNearbyStoresOsm(
  lat: number,
  lon: number,
  radiusKm: number,
): Promise<NearbyStore[]> {
  const radiusM = Math.round(radiusKm * 1000);
  const query = `
[out:json][timeout:25];
(
  node["shop"~"supermarket|convenience|chemist|bakery|beverages"](around:${radiusM},${lat},${lon});
  way["shop"~"supermarket|convenience|chemist|bakery|beverages"](around:${radiusM},${lat},${lon});
);
out center tags;
`.trim();

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      Accept: "application/json",
      "User-Agent": "LifeRoutine/0.1 (local prototype)",
    },
    body: `data=${encodeURIComponent(query)}`,
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Overpass ${res.status}`);
  }

  const data = (await res.json()) as { elements?: OverpassElement[] };
  const stores: NearbyStore[] = [];

  for (const el of data.elements ?? []) {
    const tags = el.tags ?? {};
    const name = tags.name || tags.brand || tags.shop || "Markt";
    const plat = el.lat ?? el.center?.lat;
    const plon = el.lon ?? el.center?.lon;
    if (plat == null || plon == null) continue;

    const distanceKm = haversineKm(lat, lon, plat, plon);
    const walkMin = Math.max(3, Math.round((distanceKm / 4.5) * 60));
    const address = [tags["addr:street"], tags["addr:housenumber"], tags["addr:city"]]
      .filter(Boolean)
      .join(" ");

    stores.push({
      id: `osm-${el.type}-${el.id}`,
      name,
      chain: guessChain(tags.brand || name),
      address: address || `${distanceKm.toFixed(1)} km entfernt`,
      distanceKm: Math.round(distanceKm * 10) / 10,
      walkMin,
      lat: plat,
      lon: plon,
      source: "osm",
    });
  }

  return stores
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 40);
}
