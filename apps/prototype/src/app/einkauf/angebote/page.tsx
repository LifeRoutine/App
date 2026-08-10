"use client";

import { AppShell } from "@/components/app-shell";

const sources = [
  {
    name: "Online-Prospekte (Link)",
    status: "live im Prototyp",
    use: "Pro Markt unter Märkte → Prospekt öffnen",
    note: "Kein Scraping — Nutzer sieht Angebote beim Händler.",
  },
  {
    name: "OpenStreetMap / Overpass",
    status: "live im Prototyp",
    use: "Märkte & Adressen am Standort",
    note: "Kostenlos, Rate-Limits, keine Preise.",
  },
  {
    name: "Händler-APIs (REWE, etc.)",
    status: "Recherche",
    use: "Filial-Angebote, ggf. Preise",
    note: "Partner-/ToS-Klärung nötig; oft kein freier Consumer-Zugriff.",
  },
  {
    name: "Marktguru / Angebots-Aggregator",
    status: "prüfen",
    use: "Prospekt-Angebote über Ketten",
    note: "Lizenz / Scraping-Risiko — nur mit API oder Partnerschaft.",
  },
  {
    name: "Community / Beleg-OCR",
    status: "teilweise live",
    use: "Preise aus eigenen Belegen lernen",
    note: "Datenschutz: lokal zuerst; Aggregation nur opt-in.",
  },
  {
    name: "Demo-Angebote (Mock)",
    status: "aktiv",
    use: "Route, Extraweg, €-Insights im UI",
    note: "Bis echte Quellen da sind — klar als Demo kennzeichnen.",
  },
];

export default function AngeboteStubPage() {
  return (
    <AppShell title="Angebote" subtitle="Woher Preise kommen können">
      <section className="rounded-2xl border border-line bg-white/80 px-4 py-4">
        <h2 className="font-display text-lg font-semibold text-ink">
          Kurz erklärt
        </h2>
        <p className="mt-2 text-sm text-muted">
          Damit du Ersparnis siehst, brauchen wir echte Angebote vom Markt — nicht
          geratene Preise. Märkte (Adresse) und Preise sind getrennt. Preise kommen
          später über Händler, Prospekte oder deine eigenen Belege.
        </p>
      </section>

      <section className="mt-4 space-y-3">
        {sources.map((s) => (
          <article
            key={s.name}
            className="rounded-2xl border border-line bg-white/80 px-4 py-3.5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-ink">{s.name}</h3>
              <span className="rounded-md bg-mint px-2 py-0.5 text-[0.65rem] font-semibold text-save">
                {s.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink">{s.use}</p>
            <p className="mt-1 text-xs text-muted">{s.note}</p>
          </article>
        ))}
      </section>

      <section className="mt-4 rounded-2xl border border-dashed border-navy/25 bg-sand/50 px-4 py-4">
        <h2 className="font-display text-lg font-semibold text-ink">
          Nächster Schritt
        </h2>
        <p className="mt-2 text-sm text-muted">
          Als Nächstes: ein bis zwei saubere Quellen aussuchen und an deinen Ort
          und deine gewählten Märkte koppeln. Die Oberfläche dafür ist schon da.
        </p>
      </section>
    </AppShell>
  );
}
