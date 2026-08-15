"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { profileSubtitle, useApp } from "@/lib/app-context";
import {
  agendaKindLabel,
  buildTodayAgenda,
  lowPantryNotOnList,
} from "@/lib/today-agenda";

export default function HeutePage() {
  const {
    state,
    weather,
    cycleMealSuggestion,
    addShopItems,
    addMissingFromMeal,
  } = useApp();
  const [flash, setFlash] = useState<string | null>(null);

  const weekday = new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const steps = useMemo(() => buildTodayAgenda(state), [state]);
  const mealStep = steps.find((s) => s.kind === "essen");
  const rest = steps.filter((s) => s.kind !== "essen");
  const todayMeal = state.mealPlan.find((m) => m.dayLabel === "Heute");
  const lowPantry = useMemo(() => lowPantryNotOnList(state), [state]);
  const mealMissing = todayMeal?.missing ?? [];

  function flashMsg(text: string) {
    setFlash(text);
    window.setTimeout(() => setFlash(null), 2000);
  }

  function pushLowPantry() {
    if (lowPantry.length === 0) return;
    addShopItems(
      lowPantry.map((p) => p.name),
      { source: "pantry", listId: "einkauf" },
    );
    flashMsg(
      lowPantry.length === 1
        ? `${lowPantry[0]!.name} → Liste`
        : `${lowPantry.length} Dinge → Liste`,
    );
  }

  function pushMealMissing() {
    if (!todayMeal || mealMissing.length === 0) return;
    addMissingFromMeal(todayMeal.id);
    flashMsg(`${mealMissing.join(", ")} → Liste`);
  }

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

      {flash ? (
        <p className="mb-3 rounded-xl bg-mint px-3 py-2 text-center text-sm font-semibold text-save">
          {flash}
        </p>
      ) : null}

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

      {lowPantry.length > 0 || mealMissing.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {lowPantry.length > 0 ? (
            <button
              type="button"
              onClick={pushLowPantry}
              className="rounded-2xl bg-green px-3.5 py-2.5 text-xs font-semibold text-white"
            >
              Knappes auf Liste
              {lowPantry.length > 1 ? ` (${lowPantry.length})` : ""}
            </button>
          ) : null}
          {mealMissing.length > 0 ? (
            <button
              type="button"
              onClick={pushMealMissing}
              className="rounded-2xl border border-line bg-white px-3.5 py-2.5 text-xs font-semibold text-ink"
            >
              Fehlendes vom Essen
            </button>
          ) : null}
        </div>
      ) : null}

      {mealStep && todayMeal ? (
        <div className="mt-3 rounded-2xl border border-green/25 bg-mint/50 px-3.5 py-3">
          <Link href={mealStep.href} className="block">
            <p className="text-[0.7rem] font-semibold tracking-wide text-save uppercase">
              Was gibt’s heute?
            </p>
            <p className="mt-0.5 font-display text-base font-semibold text-ink">
              {todayMeal.title}
            </p>
            <p className="mt-0.5 text-sm leading-snug text-muted">
              {todayMeal.missing.length
                ? `Noch fehlen: ${todayMeal.missing.join(", ")}`
                : todayMeal.note}
            </p>
          </Link>
          <button
            type="button"
            onClick={() => cycleMealSuggestion(todayMeal.id)}
            className="mt-2 text-xs font-semibold text-navy underline"
          >
            Anderer Vorschlag
          </button>
        </div>
      ) : null}

      <section className="mt-4">
        <h2 className="font-display text-lg font-semibold text-ink">
          Als Nächstes
        </h2>
        <div className="mt-2 space-y-2">
          {rest.length === 0 && !mealStep ? (
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

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Link
          href="/einkauf"
          className="rounded-2xl border border-line bg-white/80 px-2 py-3 text-xs font-semibold text-ink"
        >
          Liste
        </Link>
        <Link
          href="/einkauf/vorraete"
          className="rounded-2xl border border-line bg-white/80 px-2 py-3 text-xs font-semibold text-ink"
        >
          Vorräte
        </Link>
        <Link
          href="/plan"
          className="rounded-2xl border border-line bg-white/80 px-2 py-3 text-xs font-semibold text-ink"
        >
          Plan
        </Link>
      </div>
    </AppShell>
  );
}
