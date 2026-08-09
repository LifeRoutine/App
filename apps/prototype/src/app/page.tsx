"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { profileSubtitle, useApp } from "@/lib/app-context";
import { kindLabel } from "@/lib/mock-data";

export default function HeutePage() {
  const {
    state,
    weather,
    todayPriorities,
    visibleOffersSavings,
    minutesSaved,
    dayInsights,
    resetDemo,
  } = useApp();

  const weekday = new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <AppShell
      title="Heute"
      subtitle={`${weekday} · ${profileSubtitle(state.profile)}`}
    >
      <div className="mb-3 flex justify-end gap-3">
        <Link
          href="/haushalt"
          className="text-xs font-semibold text-muted hover:text-ink"
        >
          Haushalt
        </Link>
        <Link
          href="/einstellungen#installieren"
          className="text-xs font-semibold text-muted hover:text-ink"
        >
          App installieren
        </Link>
        <Link
          href="/einstellungen"
          className="text-xs font-semibold text-muted hover:text-ink"
        >
          Einstellungen
        </Link>
      </div>
      <section className="hero-heute animate-rise rounded-3xl px-5 py-5">
        <p className="text-sm text-white/90">
          Hallo {state.profile.displayName} — weniger organisieren, mehr erledigt
        </p>
        <p className="mt-2 font-display text-[1.55rem] leading-tight font-semibold">
          {todayPriorities.length} klare Schritte statt langer Listen
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-white/15 px-3 py-2.5">
            <p className="text-[0.65rem] uppercase tracking-wide text-white/75">
              Sichtbar sparen
            </p>
            <p className="font-display text-xl font-semibold">
              {visibleOffersSavings.toFixed(2).replace(".", ",")} €
            </p>
          </div>
          <div className="rounded-2xl bg-white/15 px-3 py-2.5">
            <p className="text-[0.65rem] uppercase tracking-wide text-white/75">
              Zeit zurück
            </p>
            <p className="font-display text-xl font-semibold">
              ~{minutesSaved} Min.
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-white/20 px-3 py-1">
            {weather.location}: {weather.tempC} °C, {weather.condition}
            {weather.source === "demo" ? " · Demo" : ""}
          </span>
          <span className="rounded-full bg-white/20 px-3 py-1">
            Autopilot: Erinnern
          </span>
        </div>
      </section>

      {dayInsights.length > 0 ? (
        <section className="mt-5">
          <h2 className="font-display text-lg font-semibold text-ink">
            LifeRoutine verbindet
          </h2>
          <p className="mt-1 text-sm text-muted">
            Andere Apps speichern Listen. Hier entstehen Entscheidungen aus
            Zusammenhängen.
          </p>
          <div className="mt-3 space-y-2">
            {dayInsights.map((insight) => (
              <Link
                key={insight.id}
                href={insight.href ?? "/"}
                className="block rounded-2xl border border-green/25 bg-mint/60 px-4 py-3"
              >
                <p className="text-xs font-semibold tracking-wide text-save uppercase">
                  {insight.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink">
                  {insight.detail}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-5 space-y-3">
        <h2 className="font-display text-lg font-semibold text-ink">
          Heute priorisiert
        </h2>
        {todayPriorities.map((item, index) => {
          const body = (
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.7rem] font-semibold tracking-wide text-green uppercase">
                  {kindLabel[item.kind]}
                  {item.meta ? ` · ${item.meta}` : ""}
                </p>
                <h3 className="mt-1 font-display text-lg font-semibold text-ink">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {item.detail}
                </p>
                {item.why ? (
                  <p className="mt-2 text-xs leading-relaxed text-navy/80">
                    <span className="font-semibold">Warum: </span>
                    {item.why}
                  </p>
                ) : null}
              </div>
              {item.href ? (
                <span className="shrink-0 rounded-xl bg-mint px-3 py-2 text-xs font-semibold text-ink">
                  {item.kind === "essen" ? "Anleitung" : "Öffnen"}
                </span>
              ) : null}
            </div>
          );
          const className = `block rounded-2xl border border-line bg-white/80 px-4 py-3.5 ${
            index === 0
              ? "animate-rise-delay-1"
              : index === 1
                ? "animate-rise-delay-2"
                : "animate-rise-delay-3"
          }`;
          return item.href ? (
            <Link key={item.id} href={item.href} className={className}>
              {body}
            </Link>
          ) : (
            <article key={item.id} className={className}>
              {body}
            </article>
          );
        })}
      </section>

      <Link
        href="/life-ai"
        className="mt-5 flex items-center justify-between rounded-2xl border border-dashed border-navy/25 bg-white/70 px-4 py-3.5"
      >
        <div>
          <p className="font-display text-lg font-semibold text-ink">
            Frag LifeAI
          </p>
          <p className="text-sm text-muted">
            Ein Satz — Einkauf, Plan und Zuhause reagieren mit.
          </p>
        </div>
        <span className="mic-pulse grid h-11 w-11 place-items-center rounded-full bg-green text-white">
          ●
        </span>
      </Link>

      <button
        type="button"
        onClick={resetDemo}
        className="mt-6 w-full text-center text-xs text-muted underline"
      >
        Demo zurücksetzen
      </button>
    </AppShell>
  );
}
