"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useApp } from "@/lib/app-context";

export default function ZuhausePage() {
  const { state, toggleRoutine, addRoutine } = useApp();
  const [draft, setDraft] = useState("");
  const [memberId, setMemberId] = useState("");
  const open = state.routines.filter((r) => !r.done).length;

  function memberFor(routine: (typeof state.routines)[number]) {
    if (routine.memberId) {
      return state.members.find((m) => m.id === routine.memberId) ?? null;
    }
    if (routine.assignee) {
      return (
        state.members.find(
          (m) => m.name.toLowerCase() === routine.assignee!.toLowerCase(),
        ) ?? null
      );
    }
    return null;
  }

  return (
    <AppShell title="Zuhause" subtitle="Was im Haushalt noch ansteht">
      <section className="panel-soft animate-rise rounded-3xl px-5 py-5">
        <p className="panel-kicker text-sm">Haushalt</p>
        <p className="mt-1 font-display text-xl font-semibold text-ink">
          {open} offene Aufgaben
        </p>
        <p className="mt-2 text-sm text-muted">
          Abhaken genügt. Farbe zeigt, wer dran ist — wie im Plan.
        </p>
      </section>

      <form
        className="mt-4 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          const t = draft.trim();
          if (!t) return;
          addRoutine(t, memberId || undefined);
          setDraft("");
        }}
      >
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="z. B. Bad putzen…"
            className="min-w-0 flex-1 rounded-2xl border border-line bg-white px-3 py-2.5 text-sm outline-none ring-green/30 focus:ring-2"
          />
          <button
            type="submit"
            className="shrink-0 rounded-2xl bg-green px-4 py-2.5 text-sm font-semibold text-white"
          >
            Hinzu
          </button>
        </div>
        {state.members.length > 0 ? (
          <label className="block">
            <span className="text-xs font-semibold text-muted">Wer macht’s?</span>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-line bg-white px-3 py-2.5 text-sm"
            >
              <option value="">Egal / alle</option>
              {state.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </form>

      <section className="mt-4 space-y-3">
        {state.routines.map((routine) => {
          const person = memberFor(routine);
          const label = person?.name ?? routine.assignee;
          return (
            <article
              key={routine.id}
              className={`rounded-2xl border border-line bg-white/80 px-4 py-3.5 ${
                routine.done ? "opacity-55" : ""
              }`}
              style={
                person
                  ? {
                      borderLeftWidth: 4,
                      borderLeftColor: person.color,
                      backgroundColor: `${person.color}14`,
                    }
                  : undefined
              }
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
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-1.5 text-[0.7rem] font-semibold tracking-wide text-green uppercase">
                    {person ? (
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: person.color }}
                        aria-hidden
                      />
                    ) : null}
                    <span>
                      {routine.cadence} · {routine.dueLabel}
                      {label ? ` · ${label}` : ""}
                    </span>
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
          );
        })}
      </section>
    </AppShell>
  );
}
