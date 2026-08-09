"use client";

import { useEffect, useState } from "react";
import {
  clearPin,
  isPinEnabled,
  setPin,
} from "@/lib/pin-lock";

export function PinSettings() {
  const [enabled, setEnabled] = useState(false);
  const [pin, setPinValue] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEnabled(isPinEnabled());
  }, []);

  async function save() {
    setError(null);
    setMessage(null);
    if (pin !== confirm) {
      setError("PINs stimmen nicht überein.");
      return;
    }
    try {
      await setPin(pin);
      setEnabled(true);
      setPinValue("");
      setConfirm("");
      setMessage("PIN aktiv — App sperrt nach ~1 Min. im Hintergrund.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "PIN konnte nicht gesetzt werden.");
    }
  }

  function remove() {
    clearPin();
    setEnabled(false);
    setPinValue("");
    setConfirm("");
    setError(null);
    setMessage("PIN entfernt.");
  }

  return (
    <section className="rounded-2xl border border-line bg-white/80 px-4 py-4">
      <h2 className="font-display text-lg font-semibold text-ink">
        App-PIN
      </h2>
      <p className="mt-1 text-sm text-muted">
        Schützt vor neugierigen Blicken auf dem Gerät. Kein Ersatz für
        echtes Konto-Login.
      </p>
      <p className="mt-2 text-xs font-semibold text-save">
        Status: {enabled ? "aktiv" : "aus"}
      </p>

      <label className="mt-3 block">
        <span className="text-xs font-semibold text-muted">Neue PIN (4–8 Ziffern)</span>
        <input
          type="password"
          inputMode="numeric"
          maxLength={8}
          value={pin}
          onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ""))}
          className="mt-1 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none ring-green/30 focus:ring-2"
        />
      </label>
      <label className="mt-2 block">
        <span className="text-xs font-semibold text-muted">Wiederholen</span>
        <input
          type="password"
          inputMode="numeric"
          maxLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ""))}
          className="mt-1 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none ring-green/30 focus:ring-2"
        />
      </label>

      <button
        type="button"
        onClick={() => void save()}
        disabled={pin.length < 4}
        className="mt-3 w-full rounded-2xl bg-navy px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {enabled ? "PIN ändern" : "PIN setzen"}
      </button>
      {enabled ? (
        <button
          type="button"
          onClick={remove}
          className="mt-2 w-full text-center text-xs font-semibold text-muted underline"
        >
          PIN entfernen
        </button>
      ) : null}
      {error ? (
        <p className="mt-2 text-center text-sm font-semibold text-warn">{error}</p>
      ) : null}
      {message ? (
        <p className="mt-2 text-center text-sm font-semibold text-save">{message}</p>
      ) : null}
    </section>
  );
}
