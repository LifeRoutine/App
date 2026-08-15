"use client";

import { useCallback, useEffect, useState } from "react";
import { formatLastActiveDe } from "@/lib/demo-activity-format";

type Row = {
  username: string;
  displayName: string;
  lastActiveAt: string | null;
};

/** Zeigt, wann Irena / Saskia die App zuletzt geöffnet haben. */
export function DemoActivityPanel() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/demo/activity", { credentials: "include" });
      if (res.status === 401) {
        setRows(null);
        return;
      }
      if (!res.ok) {
        setError("Aktivität gerade nicht lesbar.");
        return;
      }
      const data = (await res.json()) as { activity?: Row[] };
      setRows(data.activity ?? []);
    } catch {
      setError("Keine Verbindung.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <section className="rounded-2xl border border-line bg-white/80 px-4 py-4">
        <h2 className="font-display text-lg font-semibold text-ink">
          Wer war zuletzt da?
        </h2>
        <p className="mt-1 text-sm text-muted">{error}</p>
      </section>
    );
  }

  if (!rows) return null;

  return (
    <section className="rounded-2xl border border-line bg-white/80 px-4 py-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">
            Wer war zuletzt da?
          </h2>
          <p className="mt-1 text-sm text-muted">
            Demo-Zugänge — wann die App geöffnet wurde.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="shrink-0 text-xs font-semibold text-navy underline"
        >
          Neu laden
        </button>
      </div>
      <ul className="mt-3 space-y-2">
        {rows.map((r) => (
          <li
            key={r.username}
            className="flex items-baseline justify-between gap-3 rounded-xl bg-sand/60 px-3 py-2.5"
          >
            <span className="font-semibold text-ink">{r.displayName}</span>
            <span className="text-sm text-muted">
              {formatLastActiveDe(r.lastActiveAt)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
