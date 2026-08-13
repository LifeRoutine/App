"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { profileSubtitle, useApp } from "@/lib/app-context";
import { agendaKindLabel, buildTodayAgenda } from "@/lib/today-agenda";

export default function HeutePage() {
  const { state, weather } = useApp();

  const weekday = new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const steps = useMemo(() => buildTodayAgenda(state), [state]);
  const meal = steps.find((s) => s.kind === "essen");
  const rest = steps.filter((s) => s.kind !== "essen");

  return (
    <AppShell
      title="Heute"
      subtitle={`${weekday} · ${profileSubtitle(state.profile)}`}
    >
      <div className="mb-3 flex justify-end">
        <Link
          href="/einstellungen"
          className="text-xs font-semibold text-muted hover:text-ink"
        >
          Einstellungen
        </Link>
      </div>

      <section className="hero-heute animate-rise rounded-2xl px-4 py-4">
        <p className="text-sm text-white/90">
          Hallo {state.profile.displayName}
        </p>
        <p className="mt-1 font-display text-xl font-semibold leading-snug">
          {steps.length === 0
            ? "Heute ist nichts Dringendes offen"
            : steps.length === 1
              ? "Ein Punkt für heute"
              : `${steps.length} Punkte für heute`}
        </p>
        <p className="mt-2 text-xs text-white/80">
          {weather.tempC}° · {weather.condition}
          {weather.source === "demo" ? " · Wetter Demo" : ""}
        </p>
      </section>

      {meal ? (
        <Link
          href={meal.href}
          className="mt-3 block rounded-2xl border border-green/25 bg-mint/50 px-3.5 py-3"
        >
          <p className="text-[0.7rem] font-semibold tracking-wide text-save uppercase">
            Was gibt’s heute?
          </p>
          <p className="mt-0.5 font-display text-base font-semibold text-ink">
            {meal.title.replace(/^Heute:\s*/, "")}
          </p>
          <p className="mt-0.5 text-sm leading-snug text-muted">{meal.detail}</p>
        </Link>
      ) : null}

      <section className="mt-4">
        <h2 className="font-display text-lg font-semibold text-ink">
          Als Nächstes
        </h2>
        <div className="mt-2 space-y-2">
          {rest.length === 0 && !meal ? (
            <p className="rounded-2xl border border-dashed border-line bg-white/70 px-4 py-3 text-sm text-muted">
              Nichts Offenes — gut so.
            </p>
          ) : rest.length === 0 ? (
            <p className="text-sm text-muted">Sonst nichts Dringendes.</p>
          ) : (
            rest.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="block rounded-2xl border border-line bg-white/85 px-3.5 py-3"
              >
                <p className="text-[0.7rem] font-semibold tracking-wide text-green uppercase">
                  {agendaKindLabel[item.kind]}
                </p>
                <h3 className="mt-0.5 font-display text-base font-semibold text-ink">
                  {item.title}
                </h3>
                <p className="mt-0.5 text-sm leading-snug text-muted line-clamp-2">
                  {item.detail}
                </p>
              </Link>
            ))
          )}
        </div>
      </section>
    </AppShell>
  );
}
