"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ProductCapture } from "@/components/product-capture";
import { ReceiptCapture } from "@/components/receipt-capture";
import { useApp } from "@/lib/app-context";
import { offerForPantryItem } from "@/lib/offers-bridge";
import { PANTRY_UNITS, pluralLabel } from "@/lib/pantry";

const statusLabel = {
  ok: "Passt / habe ich",
  low: "Wird knapp",
  empty: "Leer",
} as const;

export default function VorraetePage() {
  const {
    state,
    cyclePantryStatus,
    adjustPantryAmount,
    setPantryUnit,
    setPantryMinAmount,
    addShopItems,
    addPantryItem,
  } = useApp();
  const lowOrEmpty = state.pantry.filter((p) => p.status !== "ok");

  return (
    <AppShell title="Einkauf" subtitle="Vorräte — ohne Inventur-Zwang">
      <section className="panel-soft animate-rise rounded-3xl px-5 py-5">
        <p className="panel-kicker text-sm">So gibst du Vorrat an</p>
        <p className="mt-1 font-display text-xl font-semibold text-ink">
          Zahl zählen — Einheit wählen
        </p>
        <ul className="mt-2 space-y-1 text-sm text-muted">
          <li>
            · <strong>10 Eier</strong> = 10 Stück (nicht „10 Packungen“)
          </li>
          <li>· Einheit ist nur die Beschriftung, keine Umrechnung</li>
          <li>
            · <strong>Mindestvorrat</strong>: darunter wird’s automatisch knapp
          </li>
        </ul>
        {lowOrEmpty.length > 0 ? (
          <button
            type="button"
            onClick={() =>
              addShopItems(
                lowOrEmpty.map((p) => p.name),
                { source: "pantry" },
              )
            }
            className="mt-4 rounded-xl bg-green px-4 py-2.5 text-sm font-semibold text-white"
          >
            Knappes auf die Einkaufsliste ({lowOrEmpty.length})
          </button>
        ) : null}
      </section>

      <div className="mt-4 space-y-3">
        <ProductCapture
          title="Vorrat ergänzen"
          onProduct={(p) => {
            addPantryItem({
              name: p.name,
              barcode: p.barcode || undefined,
              qty: p.qty,
              status: "ok",
            });
          }}
        />
        <ReceiptCapture
          title="Beleg → Vorrat"
          onConfirm={(lines) => {
            for (const line of lines) {
              addPantryItem({ name: line.name, qty: line.qty, status: "ok" });
            }
          }}
        />
      </div>

      <section className="mt-4 space-y-3">
        {state.pantry.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-line bg-white/80 px-4 py-3.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg font-semibold text-ink">
                  {item.name}
                </h2>
                {item.barcode ? (
                  <p className="text-[0.65rem] text-muted">EAN {item.barcode}</p>
                ) : null}

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Menge verringern"
                    onClick={() => adjustPantryAmount(item.id, -1)}
                    className="grid h-10 w-10 place-items-center rounded-xl bg-sand text-lg font-bold text-ink ring-1 ring-navy/15"
                  >
                    −
                  </button>
                  <p className="min-w-[6.5rem] text-center font-display text-xl font-semibold text-ink">
                    {item.amount}{" "}
                    <span className="text-base font-semibold text-muted">
                      {pluralLabel(item.amount, item.unit)}
                    </span>
                  </p>
                  <button
                    type="button"
                    aria-label="Menge erhöhen"
                    onClick={() => adjustPantryAmount(item.id, 1)}
                    className="grid h-10 w-10 place-items-center rounded-xl bg-mint text-lg font-bold text-save ring-1 ring-green/25"
                  >
                    +
                  </button>
                </div>

                <label className="mt-2 flex items-center gap-2 text-xs text-muted">
                  <span className="shrink-0 font-semibold">gezählt als</span>
                  <select
                    value={
                      (PANTRY_UNITS as readonly string[]).includes(item.unit)
                        ? item.unit
                        : "Stück"
                    }
                    onChange={(e) => setPantryUnit(item.id, e.target.value)}
                    className="rounded-xl border border-line bg-white px-2 py-1.5 text-xs font-semibold text-ink"
                  >
                    {PANTRY_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted">
                    Mindestvorrat
                  </span>
                  <button
                    type="button"
                    aria-label="Mindestvorrat verringern"
                    onClick={() =>
                      setPantryMinAmount(item.id, item.minAmount - 1)
                    }
                    className="grid h-8 w-8 place-items-center rounded-lg bg-sand text-sm font-bold text-ink ring-1 ring-navy/15"
                  >
                    −
                  </button>
                  <span className="min-w-[2rem] text-center text-sm font-semibold text-ink">
                    {item.minAmount}
                  </span>
                  <button
                    type="button"
                    aria-label="Mindestvorrat erhöhen"
                    onClick={() =>
                      setPantryMinAmount(item.id, item.minAmount + 1)
                    }
                    className="grid h-8 w-8 place-items-center rounded-lg bg-mint text-sm font-bold text-save ring-1 ring-green/25"
                  >
                    +
                  </button>
                  <span className="text-xs text-muted">
                    {pluralLabel(item.minAmount, item.unit)}
                  </span>
                </div>
                {item.amount > 0 && item.amount < item.minAmount ? (
                  <p className="mt-1 text-xs font-semibold text-warn">
                    Unter Mindestvorrat — nachkaufen
                  </p>
                ) : null}
                {(() => {
                  const offer = offerForPantryItem(state, item);
                  if (!offer || item.amount >= item.minAmount) return null;
                  if (offer.advice !== "kaufen") return null;
                  return (
                    <p className="mt-2 rounded-xl bg-mint/70 px-3 py-2 text-xs font-semibold text-save">
                      Nachkaufen lohnt: −{offer.save} bei {offer.storeLabel}
                      {offer.demo !== false ? " · Demo-Angebot" : ""}
                    </p>
                  );
                })()}
              </div>
              <button
                type="button"
                onClick={() => cyclePantryStatus(item.id)}
                className={`max-w-[7.5rem] shrink-0 rounded-xl px-3 py-2 text-xs font-semibold leading-tight ${
                  item.status === "ok"
                    ? "bg-green/15 text-save"
                    : item.status === "low"
                      ? "bg-warn/15 text-warn"
                      : "bg-navy/10 text-ink"
                }`}
              >
                {statusLabel[item.status]}
              </button>
            </div>
            {item.status !== "ok" ? (
              <button
                type="button"
                onClick={() =>
                  addShopItems([item.name], {
                    source: "pantry",
                    barcode: item.barcode,
                    qty:
                      item.amount > 0
                        ? `${item.amount} ${pluralLabel(item.amount, item.unit)}`
                        : "1×",
                  })
                }
                className="mt-2 text-xs font-semibold text-save"
              >
                Auf Einkaufsliste setzen
              </button>
            ) : null}
          </article>
        ))}
      </section>

      <Link
        href="/einkauf"
        className="mt-5 block text-center text-sm font-semibold text-save"
      >
        Zur Einkaufsliste →
      </Link>
    </AppShell>
  );
}
