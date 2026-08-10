"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { profileSubtitle, useApp } from "@/lib/app-context";
import { kindLabel } from "@/lib/mock-data";

const MAX_STEPS = 3;

export default function HeutePage() {
  const {
    state,
    weather,
    todayPriorities,
    visibleOffersSavings,
    minutesSaved,
    dayInsights,
  } = useApp();

  const weekday = new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const steps = todayPriorities.slice(0, MAX_STEPS);
  const tip = dayInsights[0];

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
            : `${steps.length} klare Schritte`}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-lg bg-white/20 px-2.5 py-1.5 font-semibold">
            {visibleOffersSavings.toFixed(2).replace(".", ",")} € Angebote
          </span>
          <span className="rounded-lg bg-white/20 px-2.5 py-1.5 font-semibold">
            ~{minutesSaved} Min.
          </span>
          <span className="rounded-lg bg-white/15 px-2.5 py-1.5 text-white/90">
            {weather.tempC}° · {weather.condition}
            {weather.source === "demo" ? " · Demo" : ""}
          </span>
        </div>
      </section>

      {tip ? (
        <Link
          href={tip.href ?? "/"}
          className="mt-3 block rounded-2xl border border-green/25 bg-mint/50 px-3.5 py-2.5"
        >
          <p className="text-[0.7rem] font-semibold tracking-wide text-save uppercase">
            Hinweis
          </p>
          <p className="mt-0.5 text-sm leading-snug text-ink line-clamp-2">
            {tip.detail}
          </p>
        </Link>
      ) : null}

      <section className="mt-4">
        <h2 className="font-display text-lg font-semibold text-ink">
          Als Nächstes
        </h2>
        <div className="mt-2 space-y-2">
          {steps.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line bg-white/70 px-4 py-3 text-sm text-muted">
              Nichts Offenes — gut so.
            </p>
          ) : (
            steps.map((item) => {
              const body = (
                <>
                  <p className="text-[0.7rem] font-semibold tracking-wide text-green uppercase">
                    {kindLabel[item.kind]}
                    {item.meta ? ` · ${item.meta}` : ""}
                  </p>
                  <h3 className="mt-0.5 font-display text-base font-semibold text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-0.5 text-sm leading-snug text-muted line-clamp-2">
                    {item.detail}
                  </p>
                </>
              );
              const className =
                "block rounded-2xl border border-line bg-white/85 px-3.5 py-3";
              return item.href ? (
                <Link key={item.id} href={item.href} className={className}>
                  {body}
                </Link>
              ) : (
                <article key={item.id} className={className}>
                  {body}
                </article>
              );
            })
          )}
        </div>
      </section>
    </AppShell>
  );
}
