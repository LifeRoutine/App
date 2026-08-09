"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandWordmark } from "@/components/brand-mark";
import { LocationSearch } from "@/components/location-search";
import { useApp } from "@/lib/app-context";
import { DEFAULT_STORE_IDS, nearbyStoresHechingen } from "@/lib/mock-data";
import type { HouseholdType } from "@/lib/types";

const types: { id: HouseholdType; label: string; hint: string }[] = [
  { id: "allein", label: "Allein", hint: "Dein Alltag, klar priorisiert" },
  { id: "paar", label: "Paar", hint: "Abstimmung ohne Chat-Chaos" },
  { id: "familie", label: "Familie", hint: "Mental Load teilen" },
  { id: "wg", label: "WG", hint: "Gemeinsame Listen & Aufgaben" },
];

export default function OnboardingPage() {
  const { completeOnboarding, state } = useApp();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState(state.profile.displayName);
  const [householdType, setHouseholdType] = useState<HouseholdType>(
    state.profile.householdType,
  );
  const [location, setLocation] = useState(state.profile.location);
  const [locationLat, setLocationLat] = useState<number | undefined>(
    state.profile.locationLat,
  );
  const [locationLon, setLocationLon] = useState<number | undefined>(
    state.profile.locationLon,
  );
  const [storeIds, setStoreIds] = useState<string[]>(
    state.profile.preferredStoreIds.length
      ? state.profile.preferredStoreIds
      : DEFAULT_STORE_IDS,
  );

  function toggleStore(id: string) {
    setStoreIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function finish() {
    completeOnboarding({
      displayName: displayName.trim() || "Stefan",
      householdType,
      location: location.trim() || "Hechingen",
      locationLat,
      locationLon,
      preferredStoreIds: storeIds,
    });
    router.replace("/");
  }

  const canContinueFromLocation = location.trim().length >= 2;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 py-6">
      <BrandWordmark />
      <p className="mt-4 text-center text-sm text-muted">
        In unter einer Minute startklar
      </p>

      <div className="mt-6 flex-1">
        {step === 0 ? (
          <section className="animate-rise space-y-4">
            <h1 className="font-display text-center text-2xl font-semibold text-ink">
              Wie heißt du?
            </h1>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-ink outline-none ring-green/30 focus:ring-2"
              placeholder="Dein Name"
            />
            <h2 className="pt-2 font-display text-xl font-semibold text-ink">
              Haushaltstyp
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {types.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setHouseholdType(t.id)}
                  className={`rounded-2xl border px-3 py-3 text-left ${
                    householdType === t.id
                      ? "border-green bg-mint"
                      : "border-line bg-white"
                  }`}
                >
                  <p className="font-semibold text-ink">{t.label}</p>
                  <p className="mt-1 text-xs text-muted">{t.hint}</p>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {step === 1 ? (
          <section className="animate-rise space-y-4">
            <h1 className="font-display text-center text-2xl font-semibold text-ink">
              Wo wohnst du?
            </h1>
            <p className="text-center text-sm text-muted">
              Für Wetter, Märkte in der Nähe und passende Tipps.
            </p>
            <LocationSearch
              value={location}
              onChange={(next) => {
                setLocation(next.city || next.label);
                setLocationLat(next.lat);
                setLocationLon(next.lon);
              }}
            />
            {locationLat != null && locationLon != null ? (
              <p className="text-center text-xs text-save">
                Koordinaten gespeichert — Märkte können später exakt gesucht
                werden.
              </p>
            ) : null}
          </section>
        ) : null}

        {step === 2 ? (
          <section className="animate-rise space-y-4">
            <h1 className="font-display text-center text-2xl font-semibold text-ink">
              Deine Märkte
            </h1>
            <p className="text-center text-sm text-muted">
              Vorschläge für {location || "deinen Ort"} (Demo-Liste — Live-Suche
              folgt).
            </p>
            <div className="space-y-2">
              {nearbyStoresHechingen.slice(0, 5).map((store) => {
                const selected = storeIds.includes(store.id);
                return (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => toggleStore(store.id)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left ${
                      selected ? "border-green bg-mint" : "border-line bg-white"
                    }`}
                  >
                    <span>
                      <span className="block font-semibold text-ink">
                        {store.name}
                      </span>
                      <span className="text-xs text-muted">
                        {store.distanceKm.toFixed(1).replace(".", ",")} km
                      </span>
                    </span>
                    <span className="text-xs font-semibold text-save">
                      {selected ? "Gewählt" : "Wählen"}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>

      <div className="mt-6 flex gap-2">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink"
          >
            Zurück
          </button>
        ) : null}
        {step < 2 ? (
          <button
            type="button"
            disabled={step === 1 && !canContinueFromLocation}
            onClick={() => setStep((s) => s + 1)}
            className="flex-1 rounded-2xl bg-green px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            Weiter
          </button>
        ) : (
          <button
            type="button"
            onClick={finish}
            className="flex-1 rounded-2xl bg-green px-4 py-3 text-sm font-semibold text-white"
          >
            Heute starten
          </button>
        )}
      </div>
    </div>
  );
}
