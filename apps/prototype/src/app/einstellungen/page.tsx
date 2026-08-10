"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { BackupControls } from "@/components/backup-controls";
import { InstallHint } from "@/components/install-hint";
import { LocationSearch } from "@/components/location-search";
import { PinSettings } from "@/components/pin-settings";
import { useApp } from "@/lib/app-context";
import { householdTypeLabel } from "@/lib/mock-data";
import type { HouseholdType } from "@/lib/types";

const types: HouseholdType[] = ["allein", "paar", "familie", "wg"];

export default function EinstellungenPage() {
  const {
    state,
    completeOnboarding,
    resetDemo,
    demoUser,
    storageMode,
    logoutDemo,
  } = useApp();
  const [name, setName] = useState(state.profile.displayName);
  const [type, setType] = useState(state.profile.householdType);
  const [location, setLocation] = useState(state.profile.location);
  const [lat, setLat] = useState(state.profile.locationLat);
  const [lon, setLon] = useState(state.profile.locationLon);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(state.profile.displayName);
    setType(state.profile.householdType);
    setLocation(state.profile.location);
    setLat(state.profile.locationLat);
    setLon(state.profile.locationLon);
  }, [
    state.profile.displayName,
    state.profile.householdType,
    state.profile.location,
    state.profile.locationLat,
    state.profile.locationLon,
  ]);

  useEffect(() => {
    if (window.location.hash !== "#installieren") return;
    window.setTimeout(() => {
      document.getElementById("installieren")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }, []);

  function save() {
    completeOnboarding({
      displayName: name.trim() || state.profile.displayName,
      householdType: type,
      location: location.trim() || state.profile.location,
      locationLat: lat,
      locationLon: lon,
      preferredStoreIds: state.profile.preferredStoreIds,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <AppShell title="Einstellungen" subtitle="Name, Ort, App aufs Handy">
      <section className="space-y-4">
        <InstallHint />

        <label className="block">
          <span className="text-sm font-semibold text-ink">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none ring-green/30 focus:ring-2"
          />
        </label>

        <div>
          <p className="text-sm font-semibold text-ink">Haushaltstyp</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {types.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                  type === t ? "border-green bg-mint text-save" : "border-line bg-white text-ink"
                }`}
              >
                {householdTypeLabel[t]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Wohnort</p>
          <LocationSearch
            value={location}
            onChange={(next) => {
              setLocation(next.city || next.label);
              setLat(next.lat);
              setLon(next.lon);
            }}
          />
        </div>

        <button
          type="button"
          onClick={save}
          className="w-full rounded-2xl bg-green px-4 py-3 text-sm font-semibold text-white"
        >
          Speichern
        </button>
        {saved ? (
          <p className="text-center text-sm font-semibold text-save">Gespeichert.</p>
        ) : null}

        <BackupControls />

        <section className="rounded-2xl border border-line bg-white/80 px-4 py-4">
          <h2 className="font-display text-lg font-semibold text-ink">
            Anmeldung
          </h2>
          <p className="mt-1 text-sm text-muted">
            {demoUser
              ? `Angemeldet als ${demoUser.displayName} (${demoUser.username}).`
              : "Nicht angemeldet."}
          </p>
          <p className="mt-1 text-xs text-muted">
            Speicherung:{" "}
            {storageMode === "server"
              ? "Server (dauerhaft)"
              : storageMode === "local-file"
                ? "Server-Datei (lokal/Dev)"
                : storageMode === "memory"
                  ? "nur kurz (Upstash fehlt)"
                  : "nur Browser"}
          </p>
          <button
            type="button"
            onClick={() => void logoutDemo()}
            className="mt-3 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink"
          >
            Abmelden
          </button>
        </section>

        <PinSettings />

        <Link
          href="/haushalt"
          className="block rounded-2xl border border-line bg-white/80 px-4 py-3 text-sm font-semibold text-ink"
        >
          Haushalt: wer wohnt mit? ({state.members.length}) →
        </Link>
        <Link
          href="/einkauf/maerkte"
          className="block rounded-2xl border border-line bg-white/80 px-4 py-3 text-sm font-semibold text-ink"
        >
          Meine Märkte wählen →
        </Link>
        <Link
          href="/einkauf/angebote"
          className="block rounded-2xl border border-line bg-white/80 px-4 py-3 text-sm font-semibold text-ink"
        >
          Angebote (Infos) →
        </Link>
        <Link
          href="/einkauf/katalog"
          className="block rounded-2xl border border-line bg-white/80 px-4 py-3 text-sm font-semibold text-ink"
        >
          Gespeicherte Produkte ({state.userCatalog.length}) →
        </Link>

        <Link
          href="/datenschutz"
          className="block rounded-2xl border border-line bg-white/80 px-4 py-3 text-sm font-semibold text-ink"
        >
          Datenschutz →
        </Link>

        <button
          type="button"
          onClick={() => {
            if (
              !window.confirm(
                "Wirklich alles löschen und von vorne beginnen? (Liste, Plan, Vorräte …)",
              )
            ) {
              return;
            }
            void resetDemo();
          }}
          className="w-full text-center text-xs text-muted underline"
        >
          Alles löschen und von vorne beginnen
        </button>
      </section>
    </AppShell>
  );
}
