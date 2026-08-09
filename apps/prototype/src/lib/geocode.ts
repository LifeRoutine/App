export type GeocodeHit = {
  id: string;
  label: string;
  city: string;
  lat: number;
  lon: number;
};

type NominatimItem = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    country?: string;
    road?: string;
    street?: string;
    house_number?: string;
    suburb?: string;
    neighbourhood?: string;
    quarter?: string;
  };
};

function formatHit(item: NominatimItem): GeocodeHit {
  const a = item.address ?? {};
  const city =
    a.city || a.town || a.village || a.municipality || a.county || "Ort";
  const street = [a.road || a.street, a.house_number].filter(Boolean).join(" ");
  const suburb = a.suburb || a.neighbourhood || a.quarter;
  const labelParts = [street, suburb, city, a.state].filter(Boolean);
  return {
    id: String(item.place_id),
    label: labelParts.join(", ") || item.display_name,
    city: suburb ? `${city}-${suburb}` : city,
    lat: Number(item.lat),
    lon: Number(item.lon),
  };
}

const headers = {
  Accept: "application/json",
  "User-Agent": "LifeRoutine/0.1 (local prototype; contact@liferoutine.local)",
};

export async function searchPlaces(query: string): Promise<GeocodeHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "6");
  url.searchParams.set("countrycodes", "de,at,ch");
  url.searchParams.set("accept-language", "de");

  const res = await fetch(url.toString(), {
    headers,
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error("Ortssuche fehlgeschlagen");
  const data = (await res.json()) as NominatimItem[];
  return data.map(formatHit);
}

export async function reversePlace(
  lat: number,
  lon: number,
): Promise<GeocodeHit | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "de");

  const res = await fetch(url.toString(), {
    headers,
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error("Standortauflösung fehlgeschlagen");
  const data = (await res.json()) as NominatimItem & { error?: string };
  if (data.error) return null;
  return formatHit(data);
}
