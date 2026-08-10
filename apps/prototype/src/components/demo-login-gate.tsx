"use client";

import { useState } from "react";
import { AppLoading } from "@/components/app-loading";
import { BrandWordmark } from "@/components/brand-mark";
import { useApp } from "@/lib/app-context";

export function DemoLoginGate({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, loginDemo } = useApp();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!ready) return <AppLoading label="Anmelden vorbereiten…" />;
  if (authenticated) return <>{children}</>;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await loginDemo(username, password);
    setBusy(false);
    if (!result.ok) setError(result.error ?? "Anmeldung fehlgeschlagen.");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto px-4 py-8">
      <BrandWordmark compact />
      <h1 className="mt-4 text-center font-display text-xl font-semibold text-ink">
        Anmelden
      </h1>
      <p className="mt-1 text-center text-sm text-muted">
        Demo-Zugang — Daten werden für deinen Haushalt gespeichert.
      </p>

      <form
        onSubmit={(e) => void submit(e)}
        className="mt-6 space-y-3 rounded-2xl border border-line bg-white/90 px-4 py-4"
      >
        <label className="block">
          <span className="text-xs font-semibold text-muted">Name</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className="mt-1 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none ring-green/30 focus:ring-2"
            placeholder="z. B. irena"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-muted">Passwort</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="mt-1 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none ring-green/30 focus:ring-2"
          />
        </label>
        {error ? (
          <p className="text-sm font-semibold text-warn">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={busy || !username.trim() || !password}
          className="w-full rounded-2xl bg-green px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "…" : "Einloggen"}
        </button>
      </form>
    </div>
  );
}
