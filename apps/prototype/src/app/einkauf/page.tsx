"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { OfferMarkForm } from "@/components/offer-mark-form";
import { ProductCapture } from "@/components/product-capture";
import { useApp } from "@/lib/app-context";
import { resolveOffer } from "@/lib/offers";
import { offerBadgeLabel } from "@/lib/offers/types";

export default function EinkaufPage() {
  const {
    state,
    allStores,
    preferredStoreLabels,
    preferredStores,
    visibleOffersSavings,
    shoppingTrip,
    extraweg,
    toggleShopItem,
    addShopItems,
    clearCheckedToPantry,
    toggleShopVisibility,
    setShopOffer,
    clearShopOffer,
  } = useApp();

  return (
    <AppShell title="Einkauf" subtitle="Liste · Märkte · Vorräte · Essen">
      <section className="hero-einkauf animate-rise rounded-3xl px-5 py-5">
        <p className="text-sm text-mint/95">Deine Liste</p>
        <p className="mt-1 font-display text-2xl font-semibold">
          Heute bis zu{" "}
          {visibleOffersSavings.toFixed(2).replace(".", ",")} € sparen
        </p>
        <p className="mt-2 text-sm text-white/85">
          Deine Märkte: {preferredStoreLabels}
        </p>
        <p className="mt-1 text-xs text-white/75">
          Angebot selbst aus dem Prospekt eintragen — oder ohne Preis weiter.
        </p>
        <Link
          href="/einkauf/maerkte"
          className="mt-3 inline-flex rounded-xl bg-white/20 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/30"
        >
          Märkte / Prospekte ({preferredStores.length})
        </Link>
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-white/80 px-4 py-3">
        <p className="text-sm font-semibold text-ink">Liste erweitern so:</p>
        <p className="mt-1 text-xs text-muted">
          Tippen · bekannte Produkte antippen · Barcode · Vorräte · Essen ·
          Helfer
        </p>
        <p className="mt-1 text-xs text-muted">
          Beleg nach dem Einkauf: unter{" "}
          <Link href="/einkauf/vorraete" className="font-semibold text-save">
            Vorräte
          </Link>
          .
        </p>
      </section>

      <div className="mt-3 space-y-3">
        <ProductCapture
          title="Zur Einkaufsliste"
          onProduct={(p) => {
            addShopItems([p.name], {
              barcode: p.barcode || undefined,
              qty: p.qty,
              source: p.source === "scan" ? "scan" : "manual",
            });
          }}
        />
      </div>
      {shoppingTrip.length > 0 ? (
        <section className="mt-4 rounded-2xl border border-line bg-white/80 px-4 py-4">
          <h2 className="font-display text-lg font-semibold text-ink">
            Reihenfolge der Märkte
          </h2>
          <p className="mt-1 text-sm text-muted">
            Wohin zuerst — mit dem, was dort draufsteht.
          </p>
          <ol className="mt-3 space-y-2">
            {shoppingTrip.map((stop, i) => (
              <li
                key={stop.store.id}
                className="flex items-start gap-3 rounded-xl bg-sand/70 px-3 py-2.5"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mint text-xs font-bold text-save">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-ink">{stop.store.name}</p>
                  <p className="text-xs text-muted">
                    {stop.items.map((x) => x.name).join(", ")} · −
                    {stop.saveTotal.toFixed(2).replace(".", ",")} € ·{" "}
                    {stop.distanceKm.toFixed(1).replace(".", ",")} km
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {extraweg.length > 0 ? (
        <section className="mt-4 space-y-2">
          <h2 className="font-display text-lg font-semibold text-ink">
            Lohnt sich der Umweg?
          </h2>
          {extraweg.map((a) => (
            <article
              key={a.storeName}
              className={`rounded-2xl border px-4 py-3 ${
                a.worthIt
                  ? "border-green/30 bg-mint/50"
                  : "border-line bg-white/80"
              }`}
            >
              <p className="text-xs font-semibold tracking-wide uppercase text-save">
                {a.worthIt ? "Ja, lohnt sich" : "Nur wenn du ohnehin da bist"} ·{" "}
                {a.storeName}
              </p>
              <p className="mt-1 text-sm text-ink">{a.reason}</p>
            </article>
          ))}
        </section>
      ) : null}

      <section className="mt-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-ink">
            Einkaufsliste
          </h2>
          {state.shoppingList.some((i) => i.checked) ? (
            <button
              type="button"
              onClick={() => clearCheckedToPantry()}
              className="text-xs font-semibold text-save"
            >
              Erledigt → Vorrat
            </button>
          ) : null}
        </div>
        {[...state.shoppingList]
          .sort((a, b) => Number(a.checked) - Number(b.checked))
          .map((item) => {
          const offer = resolveOffer(item.offer, {
            productName: item.name,
            preferredStoreIds: state.profile.preferredStoreIds,
            stores: allStores,
          });
          const offerVisible =
            offer &&
            state.profile.preferredStoreIds.includes(offer.storeId);
          return (
            <article
              key={item.id}
              className={`rounded-2xl border border-line bg-white/80 px-4 py-3.5 ${
                item.checked ? "opacity-55" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  aria-label={`${item.name} abhaken`}
                  onClick={() => toggleShopItem(item.id)}
                  className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border ${
                    item.checked
                      ? "border-green bg-green text-white"
                      : "border-navy/30 bg-white"
                  }`}
                >
                  {item.checked ? "✓" : ""}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h2
                      className={`font-display text-lg font-semibold text-ink ${
                        item.checked ? "line-through" : ""
                      }`}
                    >
                      {item.name}
                    </h2>
                    <span className="text-sm text-muted">{item.qty}</span>
                  </div>
                  {item.source ? (
                    <p className="text-[0.65rem] text-muted">
                      Quelle:{" "}
                      {item.source === "scan"
                        ? "Scan"
                        : item.source === "pantry"
                          ? "Vorrat"
                          : item.source === "meal"
                            ? "Essensplan"
                            : item.source === "ai"
                              ? "Helfer"
                              : item.source === "receipt"
                                ? "Beleg"
                                : "Tipp"}
                      {item.barcode ? ` · EAN ${item.barcode}` : ""}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => toggleShopVisibility(item.id)}
                    className="mt-1 text-[0.65rem] font-semibold text-navy underline"
                  >
                    {(item.visibility ?? "shared") === "private"
                      ? "Nur ich · tippen → für alle"
                      : "Für alle · tippen → nur ich"}
                  </button>
                  {offerVisible && offer ? (
                    <div className="mt-2 rounded-xl bg-sand/80 px-3 py-2.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                        <span className="rounded-md bg-navy/10 px-2 py-0.5 text-[0.65rem] text-muted">
                          {offerBadgeLabel(offer)}
                        </span>
                        <span className="text-ink">{offer.storeLabel}</span>
                        <span className="text-save">−{offer.save}</span>
                        <span
                          className={`rounded-md px-2 py-0.5 ${
                            offer.advice === "warten"
                              ? "bg-warn/15 text-warn"
                              : "bg-green/15 text-save"
                          }`}
                        >
                          {offer.advice === "warten" ? "Warten" : "Kaufen"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted">{offer.note}</p>
                    </div>
                  ) : offer ? (
                    <p className="mt-2 text-xs text-muted">
                      {offerBadgeLabel(offer)} bei {offer.storeLabel} — Markt
                      nicht gewählt.
                    </p>
                  ) : null}
                  {!item.checked ? (
                    <OfferMarkForm
                      preferredStores={preferredStores}
                      current={item.offer}
                      onSave={(input) => setShopOffer(item.id, input)}
                      onClear={() => clearShopOffer(item.id)}
                    />
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </AppShell>
  );
}
