"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useApp } from "@/lib/app-context";

export default function ZuhausePage() {
  const { state, toggleRoutine, addRoutine } = useApp();
  const [draft, setDraft] = useState("");
  const open = state.routines.filter((r) => !r.done).length;

  return (
    <AppShell title="Zuhause" subtitle="Routinen — wenige, die heute zählen">
      <section className="panel-soft animate-rise rounded-3xl px-5 py-5">
        <p className="panel-kicker text-sm">Haushalt</p>
        <p className="mt-1 font-display text-xl font-semibold text-ink">
          {open} offene Routinen
        </p>
        <p className="mt-2 text-sm text-muted">
          Abhaken speichert lokal. Vorräte & Essen liegen unter Einkauf.
        </p>
      </section>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const t = draft.trim();
          if (!t) return;
          addRoutine(t);
          setDraft("");
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Neue Routine…"
          className="flex-1 rounded-2xl border border-line bg-white px-3 py-2.5 text-sm outline-none ring-green/30 focus:ring-2"
        />
        <button
          type="submit"
          className="rounded-2xl bg-green px-4 py-2.5 text-sm font-semibold text-white"
        >
          Hinzu
        </button>
      </form>

      <section className="mt-4 space-y-3">
        {state.routines.map((routine) => (
          <article
            key={routine.id}
            className={`rounded-2xl border border-line bg-white/80 px-4 py-3.5 ${
              routine.done ? "opacity-55" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <button
                type="button"
                aria-label={`${routine.title} erledigt`}
                onClick={() => toggleRoutine(routine.id)}
                className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border ${
                  routine.done
                    ? "border-green bg-green text-white"
                    : "border-navy/30 bg-white"
                }`}
              >
                {routine.done ? "✓" : ""}
              </button>
              <div>
                <p className="text-[0.7rem] font-semibold tracking-wide text-green uppercase">
                  {routine.cadence} · {routine.dueLabel}
                  {routine.assignee ? ` · ${routine.assignee}` : ""}
                </p>
                <h2
                  className={`mt-1 font-display text-lg font-semibold text-ink ${
                    routine.done ? "line-through" : ""
                  }`}
                >
                  {routine.title}
                </h2>
                <p className="mt-1 text-sm text-muted">{routine.detail}</p>
              </div>
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
