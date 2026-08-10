"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { isNameCatalogKey } from "@/lib/catalog-memory";
import { useApp } from "@/lib/app-context";

export default function KatalogPage() {
  const { state, removeCatalogEntry } = useApp();
  const entries = [...state.userCatalog].sort((a, b) =>
    a.name.localeCompare(b.name, "de"),
  );

  return (
    <AppShell
      title="Einkauf"
      subtitle="Bekannte Produkte — aus Liste und Scan"
    >
      <section className="panel-soft animate-rise rounded-3xl px-5 py-5">
        <p className="panel-kicker text-sm">Immer wieder da</p>
        <p className="mt-1 font-display text-xl font-semibold text-ink">
          {entries.length} gemerkte Produkte
        </p>
        <p className="mt-2 text-sm text-muted">
          Was du auf die Liste setzt, merkt sich LifeRoutine im Hintergrund.
          Beim nächsten Mal tippst du nur noch an — statt neu zu tippen.
        </p>
      </section>

      {entries.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-line bg-white/60 px-4 py-6 text-center">
          <p className="text-sm text-muted">
            Noch leer. Unter Liste etwas hinzufügen — dann erscheint es hier und
            zum Antippen.
          </p>
          <Link
            href="/einkauf"
            className="mt-3 inline-block text-sm font-semibold text-save"
          >
            Zur Einkaufsliste →
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
                    {isNameCatalogKey(e.barcode)
                      ? "von der Liste"
                      : `Code ${e.barcode}`}
                    {" · "}
                    {e.source === "openfoodfacts"
                      ? "Open Food Facts"
                      : e.source === "demo"
                        ? "Demo"
                        : e.source === "list"
                          ? "automatisch gemerkt"
                          : "von dir"}
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
