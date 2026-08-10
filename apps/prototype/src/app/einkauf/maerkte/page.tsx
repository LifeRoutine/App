"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { useApp } from "@/lib/app-context";
import { nearbyStoresHechingen } from "@/lib/mock-data";
import type { NearbyStore } from "@/lib/types";
import { prospectusUrlForStore } from "@/lib/prospectus";

export default function MaerktePage() {
  const {
    state,
    allStores,
    togglePreferredStore,
    setDiscoveredStores,
    ready,
  } = useApp();
  const [radiusKm, setRadiusKm] = useState(5);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceLabel, setSourceLabel] = useState<string>("Demo + OSM");

  const hasCoords =
    typeof state.profile.locationLat === "number" &&
    typeof state.profile.locationLon === "number";

  const stores = useMemo(() => {
    const pool = allStores.length > 0 ? allStores : nearbyStoresHechingen;
    return [...pool]
      .filter((s) => s.distanceKm <= radiusKm + 0.05)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [allStores, radiusKm]);

  const findNearby = useCallback(async () => {
    setScanning(true);
    setError(null);

    if (!hasCoords) {
      setError(
        "Kein Standort mit Koordinaten — bitte Ort in den Einstellungen setzen.",
      );
      setScanning(false);
      return;
    }

    try {
      const lat = state.profile.locationLat!;
      const lon = state.profile.locationLon!;
      const res = await fetch(
        `/api/stores?lat=${lat}&lon=${lon}&radiusKm=${radiusKm}`,
      );
      const data = (await res.json()) as {
        stores?: NearbyStore[];
        error?: string;
        source?: string;
      };

      if (!res.ok) {
        setError(data.error ?? "Marktsuche fehlgeschlagen");
        // Fallback: Demo behalten, trotzdem Radius filtern
        setSourceLabel("Demo (OSM fehlgeschlagen)");
      } else {
        const found = data.stores ?? [];
        setDiscoveredStores(found);
        setSourceLabel(
          found.length > 0
            ? `OpenStreetMap (${found.length})`
            : "Keine OSM-Treffer — Demo prüfen",
        );
        if (found.length === 0) {
          setError("Keine Märkte in dem Radius — Radius erhöhen oder Demo nutzen.");
        }
      }
    } catch {
      setError("Netzwerkfehler bei der Marktsuche.");
      setSourceLabel("Demo (offline)");
    } finally {
      setScanning(false);
    }
  }, [
    hasCoords,
    radiusKm,
    setDiscoveredStores,
    state.profile.locationLat,
    state.profile.locationLon,
  ]);

  return (
    <AppShell title="Einkauf" subtitle="Märkte in der Nähe auswählen">
      <section className="hero-heute animate-rise rounded-3xl px-5 py-5">
        <p className="text-sm text-white/90">Standort</p>
        <p className="mt-1 font-display text-2xl font-semibold">
          {state.profile.location}
        </p>
        <p className="mt-2 text-sm text-white/85">
          {hasCoords
            ? "Live-Suche über OpenStreetMap (Overpass)."
            : "Noch keine Koordinaten — Ort in den Einstellungen wählen."}
        </p>
        <p className="mt-1 text-xs text-white/70">Quelle: {sourceLabel}</p>
        <button
          type="button"
          onClick={findNearby}
          disabled={scanning}
          className="mt-4 rounded-xl bg-white/25 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/35 disabled:opacity-70"
        >
          {scanning ? "Suche läuft…" : "Märkte in der Nähe finden"}
        </button>
        {!hasCoords ? (
          <Link
            href="/einstellungen"
            className="mt-3 inline-block text-sm font-semibold text-white underline"
          >
            Ort setzen →
          </Link>
        ) : null}
      </section>

      {error ? (
        <p className="mt-3 rounded-2xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-ink">
          {error}
        </p>
      ) : null}

      <section className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="radius" className="text-sm font-semibold text-ink">
            Radius {radiusKm.toFixed(1).replace(".", ",")} km
          </label>
          <span className="text-xs text-muted">{stores.length} gefunden</span>
        </div>
        <input
          id="radius"
          type="range"
          min={1}
          max={10}
          step={0.5}
          value={radiusKm}
          onChange={(e) => setRadiusKm(Number(e.target.value))}
          className="mt-2 w-full accent-green"
        />
        <p className="mt-1 text-xs text-muted">
          Tipp: Radius erhöhen und erneut „Märkte finden“ — z.&nbsp;B. Lidl
          Stetten liegt von Stein aus bei ca. 3,3&nbsp;km.
        </p>
      </section>

      <section className="mt-4 space-y-3">
        {scanning ? (
          <div className="rounded-2xl border border-dashed border-navy/25 bg-white/60 px-4 py-8 text-center text-sm text-muted">
            Suche Märkte um {state.profile.location}…
          </div>
        ) : (
          stores.map((store) => {
            const selected = state.profile.preferredStoreIds.includes(store.id);
            const prospectus = prospectusUrlForStore(store);
            return (
              <article
                key={store.id}
                className={`rounded-2xl border px-4 py-3.5 ${
                  selected
                    ? "border-green/40 bg-mint/50"
                    : "border-line bg-white/80"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-lg font-semibold text-ink">
                        {store.name}
                      </h2>
                      {store.openNow === true ? (
                        <span className="rounded-md bg-green/15 px-2 py-0.5 text-xs font-semibold text-save">
                          Geöffnet
                        </span>
                      ) : store.openNow === false ? (
                        <span className="rounded-md bg-navy/10 px-2 py-0.5 text-xs font-semibold text-muted">
                          Geschlossen
                        </span>
                      ) : null}
                      {store.source === "osm" ? (
                        <span className="rounded-md bg-navy/10 px-2 py-0.5 text-[0.65rem] font-semibold text-muted">
                          OSM
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted">{store.address}</p>
                    <p className="mt-1 text-xs font-medium text-ink">
                      {store.distanceKm.toFixed(1).replace(".", ",")} km · ca.{" "}
                      {store.walkMin} Min. zu Fuß
                    </p>
                    {prospectus ? (
                      <a
                        href={prospectus}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex text-xs font-semibold text-save underline"
                      >
                        Online-Prospekt öffnen ↗
                      </a>
                    ) : (
                      <p className="mt-2 text-[0.65rem] text-muted">
                        Kein Prospekt-Link für diese Kette hinterlegt.
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={!ready}
                    onClick={() => togglePreferredStore(store.id)}
                    className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold ${
                      selected
                        ? "bg-navy text-white"
                        : "bg-white text-ink ring-1 ring-navy/20"
                    }`}
                  >
                    {selected ? "Gewählt" : "Wählen"}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>

      <Link
        href="/einkauf/angebote"
        className="mt-6 block rounded-2xl border border-line bg-white/80 px-4 py-3 text-sm font-semibold text-ink"
      >
        Woher kommen die Angebote? →
      </Link>
    </AppShell>
  );
}
