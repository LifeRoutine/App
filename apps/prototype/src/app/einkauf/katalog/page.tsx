"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { useApp } from "@/lib/app-context";

export default function KatalogPage() {
  const { state, removeCatalogEntry } = useApp();
  const entries = [...state.userCatalog].sort((a, b) =>
    a.name.localeCompare(b.name, "de"),
  );

  return (
    <AppShell
      title="Einkauf"
      subtitle="Haushaltskatalog — wächst mit jedem Scan"
    >
      <section className="panel-soft animate-rise rounded-3xl px-5 py-5">
        <p className="panel-kicker text-sm">Gemeinsam aufbauen</p>
        <p className="mt-1 font-display text-xl font-semibold text-ink">
          {entries.length} gelernte Produkte
        </p>
        <p className="mt-2 text-sm text-muted">
          Unbekannte Codes benennst du einmal — danach erkennt LifeRoutine sie
          sofort. Lookup-Reihenfolge: dein Katalog → Open Food Facts → manuell
          merken.
        </p>
      </section>

      {entries.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-line bg-white/60 px-4 py-6 text-center">
          <p className="text-sm text-muted">
            Noch leer. Unter Liste oder Vorräte scannen/tippen — bei unbekanntem
            Code den Namen speichern.
          </p>
          <Link
            href="/einkauf/vorraete"
            className="mt-3 inline-block text-sm font-semibold text-save"
          >
            Zu Vorräten →
          </Link>
        </div>
      ) : (
        <section className="mt-4 space-y-2">
          {entries.map((e) => (
            <article
              key={e.barcode}
              className="rounded-2xl border border-line bg-white/80 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{e.name}</p>
                  <p className="text-xs text-muted">
                    EAN {e.barcode} · {e.qty} ·{" "}
                    {e.source === "user"
                      ? "von dir gelernt"
                      : e.source === "openfoodfacts"
                        ? "Open Food Facts"
                        : "Demo"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeCatalogEntry(e.barcode)}
                  className="text-xs font-semibold text-muted hover:text-warn"
                >
                  Entfernen
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </AppShell>
  );
}
