"use client";

import { useState } from "react";
import type { NearbyStore, ShopOffer } from "@/lib/types";

type Props = {
  preferredStores: NearbyStore[];
  current?: ShopOffer | null;
  onSave: (input: {
    storeId: string;
    saveValue: number;
    advice: ShopOffer["advice"];
  }) => void;
  onClear: () => void;
};

export function OfferMarkForm({
  preferredStores,
  current,
  onSave,
  onClear,
}: Props) {
  const [open, setOpen] = useState(false);
  const [storeId, setStoreId] = useState(
    current?.storeId || preferredStores[0]?.id || "",
  );
  const [saveEuro, setSaveEuro] = useState(
    current?.saveValue?.toString().replace(".", ",") || "1,00",
  );
  const [advice, setAdvice] = useState<ShopOffer["advice"]>(
    current?.advice || "kaufen",
  );

  if (preferredStores.length === 0) {
    return (
      <p className="mt-2 text-[0.65rem] text-muted">
        Erst Märkte wählen, dann Angebot aus dem Prospekt markieren.
      </p>
    );
  }

  function submit() {
    const saveValue = Number(saveEuro.replace(",", ".").replace(/[^\d.]/g, ""));
    if (!storeId || !Number.isFinite(saveValue) || saveValue <= 0) return;
    onSave({ storeId, saveValue, advice });
    setOpen(false);
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[0.65rem] font-semibold text-save underline"
      >
        {open
          ? "Schließen"
          : current?.source === "user"
            ? "Angebot ändern"
            : "Aus Prospekt markieren"}
      </button>
      {open ? (
        <div className="mt-2 space-y-2 rounded-xl border border-line bg-white px-3 py-2.5">
          <p className="text-[0.65rem] text-muted">
            Angebot aus dem Online-Prospekt selbst eintragen (kein Scraping).
          </p>
          <label className="block text-[0.65rem] font-semibold text-muted">
            Markt
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line px-2 py-1.5 text-xs text-ink"
            >
              {preferredStores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[0.65rem] font-semibold text-muted">
            Ersparnis (€)
            <input
              value={saveEuro}
              onChange={(e) => setSaveEuro(e.target.value)}
              inputMode="decimal"
              className="mt-1 w-full rounded-lg border border-line px-2 py-1.5 text-xs text-ink"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAdvice("kaufen")}
              className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold ${
                advice === "kaufen"
                  ? "bg-green/15 text-save"
                  : "bg-sand text-muted"
              }`}
            >
              Kaufen
            </button>
            <button
              type="button"
              onClick={() => setAdvice("warten")}
              className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold ${
                advice === "warten"
                  ? "bg-warn/15 text-warn"
                  : "bg-sand text-muted"
              }`}
            >
              Warten
            </button>
          </div>
          <button
            type="button"
            onClick={submit}
            className="w-full rounded-lg bg-navy px-2 py-2 text-xs font-semibold text-white"
          >
            Speichern
          </button>
          {current ? (
            <button
              type="button"
              onClick={() => {
                onClear();
                setOpen(false);
              }}
              className="w-full text-center text-[0.65rem] text-muted underline"
            >
              Angebot entfernen
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
