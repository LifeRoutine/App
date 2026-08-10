"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { useApp } from "@/lib/app-context";

export default function DatenschutzPage() {
  const { resetDemo } = useApp();

  return (
    <AppShell title="Datenschutz" subtitle="Lokal zuerst · keine Werbeprofile">
      <section className="hero-heute animate-rise rounded-3xl px-5 py-5">
        <p className="text-sm text-white/90">Prinzip</p>
        <p className="mt-1 font-display text-2xl font-semibold">
          Deine Alltagsdaten bleiben bei dir
        </p>
        <p className="mt-2 text-sm text-white/85">
          Dieser Prototyp speichert auf dem Gerät. Keine Cloud-Sync, keine
          Werbung, keine Werbeprofile.
        </p>
      </section>

      <section className="mt-5 rounded-2xl border border-line bg-white/80 px-4 py-4">
        <h2 className="font-display text-lg font-semibold text-ink">
          Was wir speichern
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li>· Profil (Name, Haushaltstyp, Ort inkl. Koordinaten)</li>
          <li>· Mitglieder & Einladungs-Code (Demo)</li>
          <li>· Einkaufsliste, Vorräte, Katalog, Routinen, Termine</li>
          <li>· Dokument-Fristen: nur Typ, Person, Ablauf — keine Nummern</li>
          <li>· Gewählte Märkte (inkl. OSM-Treffer lokal)</li>
        </ul>
        <p className="mt-3 text-xs text-muted">
          Technisch: Browser-<code className="text-ink">localStorage</code>{" "}
          Schlüssel <code className="text-ink">liferoutine.app.v1</code>
        </p>
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-white/80 px-4 py-4">
        <h2 className="font-display text-lg font-semibold text-ink">
          Was wir nicht speichern
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li>
            · <strong className="text-ink">Keine</strong> Ausweis-, Pass- oder
            Kartennummern
          </li>
          <li>· Keine Dokument-Scans / keine Nummern-OCR</li>
          <li>· Keine Werbe-IDs, Tracking-Pixel oder Verkauf von Profilen</li>
          <li>· Kein serverseitiges Nutzerkonto in diesem Prototyp</li>
        </ul>
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-white/80 px-4 py-4">
        <h2 className="font-display text-lg font-semibold text-ink">
          Externe Aufrufe (nur bei Nutzung)
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li>
            · <strong className="text-ink">Ortssuche:</strong> OpenStreetMap
            Nominatim (Suchbegriff / Koordinaten)
          </li>
          <li>
            · <strong className="text-ink">Märkte:</strong> Overpass-API
            (Umkreis um deinen Ort)
          </li>
          <li>
            · <strong className="text-ink">Barcode:</strong> Open Food Facts
            (nur die gescannte Nummer)
          </li>
          <li>
            · <strong className="text-ink">Beleg-OCR:</strong> läuft im Browser
            (Tesseract) — Bild geht nicht an unseren Server
          </li>
        </ul>
        <p className="mt-3 text-xs text-muted">
          Spätere Cloud-Features nur opt-in und mit klarer Erklärung.
        </p>
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-white/80 px-4 py-4">
        <h2 className="font-display text-lg font-semibold text-ink">
          App-PIN
        </h2>
        <p className="mt-2 text-sm text-muted">
          Optionaler Geräte-Schutz (4–8 Ziffern). Hash + Salt lokal in{" "}
          <code className="text-ink">liferoutine.lock.v1</code> — kein Cloud-Login.
          Sperrt erneut nach ca. 1 Minute im Hintergrund.
        </p>
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-white/80 px-4 py-4">
        <h2 className="font-display text-lg font-semibold text-ink">
          Sicherungskopie
        </h2>
        <p className="mt-2 text-sm text-muted">
          Unter Einstellungen kannst du Liste, Termine und Vorräte als Datei
          speichern und wieder laden. Die Datei bleibt bei dir — kein Upload an
          uns. Die optionale App-PIN steckt nicht in der Datei.
        </p>
      </section>

      <section className="mt-4 rounded-2xl border border-dashed border-navy/25 bg-sand/50 px-4 py-4">
        <h2 className="font-display text-lg font-semibold text-ink">
          Daten löschen
        </h2>
        <p className="mt-2 text-sm text-muted">
          „Alles zurücksetzen“ löscht den Stand auf diesem Gerät und startet neu.
          Vorher ggf. eine Sicherungskopie speichern. Du kannst auch den
          Website-Speicher im Browser leeren.
        </p>
        <button
          type="button"
          onClick={resetDemo}
          className="mt-3 w-full rounded-2xl bg-navy px-4 py-3 text-sm font-semibold text-white"
        >
          Alles auf diesem Gerät löschen
        </button>
      </section>

      <Link
        href="/einstellungen"
        className="mt-4 block text-center text-sm font-semibold text-muted underline"
      >
        Zurück zu Einstellungen
      </Link>
    </AppShell>
  );
}
