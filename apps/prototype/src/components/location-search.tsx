"use client";

import { useEffect, useId, useState } from "react";
import type { GeocodeHit } from "@/lib/geocode";

type Props = {
  value: string;
  onChange: (next: {
    label: string;
    city: string;
    lat?: number;
    lon?: number;
  }) => void;
};

export function LocationSearch({ value, onChange }: Props) {
  const listId = useId();
  const [query, setQuery] = useState(value);
  const [hits, setHits] = useState<GeocodeHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }

    const handle = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/geocode?mode=search&q=${encodeURIComponent(q)}`,
        );
        const data = (await res.json()) as {
          hits?: GeocodeHit[];
          error?: string;
        };
        if (!res.ok) throw new Error(data.error || "Suche fehlgeschlagen");
        setHits(data.hits ?? []);
        setOpen(true);
      } catch (e) {
        setHits([]);
        setError(e instanceof Error ? e.message : "Suche fehlgeschlagen");
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(handle);
  }, [query]);

  function pick(hit: GeocodeHit) {
    setQuery(hit.city);
    setOpen(false);
    setHits([]);
    onChange({
      label: hit.label,
      city: hit.city,
      lat: hit.lat,
      lon: hit.lon,
    });
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Standort ist in diesem Browser nicht verfügbar.");
      return;
    }
    setGeoLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `/api/geocode?mode=reverse&lat=${latitude}&lon=${longitude}`,
          );
          const data = (await res.json()) as {
            hit?: GeocodeHit | null;
            error?: string;
          };
          if (!res.ok) throw new Error(data.error || "Auflösung fehlgeschlagen");
          if (!data.hit) throw new Error("Kein Ort gefunden");
          pick(data.hit);
        } catch (e) {
          setError(
            e instanceof Error ? e.message : "Standort konnte nicht gelesen werden",
          );
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        setGeoLoading(false);
        setError("Standortzugriff abgelehnt oder fehlgeschlagen.");
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <label htmlFor={listId} className="sr-only">
          Ort suchen
        </label>
        <input
          id={listId}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange({ label: e.target.value, city: e.target.value });
          }}
          onFocus={() => hits.length > 0 && setOpen(true)}
          autoComplete="off"
          placeholder="Stadt oder PLZ suchen…"
          className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-ink outline-none ring-green/30 focus:ring-2"
        />
        {loading ? (
          <p className="mt-2 text-xs text-muted">Suche…</p>
        ) : null}
        {open && hits.length > 0 ? (
          <ul className="absolute z-10 mt-2 max-h-56 w-full overflow-auto rounded-2xl border border-line bg-white shadow-sm">
            {hits.map((hit) => (
              <li key={hit.id}>
                <button
                  type="button"
                  onClick={() => pick(hit)}
                  className="block w-full px-4 py-3 text-left text-sm hover:bg-mint"
                >
                  <span className="font-semibold text-ink">{hit.city}</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {hit.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <button
        type="button"
        onClick={useCurrentLocation}
        disabled={geoLoading}
        className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink disabled:opacity-60"
      >
        {geoLoading ? "Standort wird ermittelt…" : "Aktuellen Standort verwenden"}
      </button>

      {error ? <p className="text-sm text-warn">{error}</p> : null}
      <p className="text-xs text-muted">
        Ortssuche über OpenStreetMap (Nominatim). Opt-in für GPS-Standort.
      </p>
    </div>
  );
}
