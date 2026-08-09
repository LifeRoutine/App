"use client";

import { useEffect, useState } from "react";
import { AppLoading } from "@/components/app-loading";
import { BrandWordmark } from "@/components/brand-mark";
import {
  isPinEnabled,
  isUnlocked,
  markLocked,
  markUnlocked,
  verifyPin,
} from "@/lib/pin-lock";

const BACKGROUND_LOCK_MS = 60_000;

export function PinGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [needsPin, setNeedsPin] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const enabled = isPinEnabled();
    setNeedsPin(enabled && !isUnlocked());
    setReady(true);

    let hideAt: number | null = null;
    let timer: number | undefined;

    function onVisibility() {
      if (!isPinEnabled()) return;
      if (document.visibilityState === "hidden") {
        hideAt = Date.now();
        timer = window.setTimeout(() => {
          markLocked();
        }, BACKGROUND_LOCK_MS);
      } else {
        if (timer) window.clearTimeout(timer);
        if (hideAt != null && Date.now() - hideAt >= BACKGROUND_LOCK_MS) {
          markLocked();
          setNeedsPin(true);
          setPin("");
        }
        hideAt = null;
      }
    }

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  async function unlock() {
    setBusy(true);
    setError(null);
    try {
      const ok = await verifyPin(pin);
      if (!ok) {
        setError("Falsche PIN.");
        setPin("");
        return;
      }
      markUnlocked();
      setNeedsPin(false);
      setPin("");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return <AppLoading />;
  }

  if (needsPin) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-4 py-8">
        <BrandWordmark compact />
        <section className="mt-8 rounded-3xl border border-line bg-white/90 px-5 py-6 shadow-sm">
          <h1 className="font-display text-2xl font-semibold text-ink">
            App gesperrt
          </h1>
          <p className="mt-2 text-sm text-muted">
            PIN eingeben — lokal auf diesem Gerät, kein Cloud-Login.
          </p>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={8}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && pin.length >= 4) void unlock();
            }}
            placeholder="••••"
            className="mt-4 w-full rounded-2xl border border-line bg-white px-4 py-3 text-center text-2xl tracking-[0.4em] outline-none ring-green/30 focus:ring-2"
            aria-label="PIN"
          />
          {error ? (
            <p className="mt-2 text-center text-sm font-semibold text-warn">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            disabled={busy || pin.length < 4}
            onClick={() => void unlock()}
            className="mt-4 w-full rounded-2xl bg-green px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            Entsperren
          </button>
        </section>
      </div>
    );
  }

  return <>{children}</>;
}
