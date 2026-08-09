"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useApp } from "@/lib/app-context";

export default function EssensplanPage() {
  const { state, addMissingFromMeal } = useApp();
  const [flash, setFlash] = useState<string | null>(null);

  function pushMissing(mealId: string) {
    const meal = state.mealPlan.find((m) => m.id === mealId);
    if (!meal) return;
    addMissingFromMeal(mealId);
    setFlash(
      meal.missing.length
        ? `${meal.missing.join(", ")} → Einkaufsliste`
        : "Nichts Fehlendes",
    );
    window.setTimeout(() => setFlash(null), 2200);
  }

  return (
    <AppShell title="Einkauf" subtitle="Essensplan · fehlendes auf die Liste">
      {flash ? (
        <p className="mb-3 rounded-xl bg-mint px-3 py-2 text-center text-sm font-semibold text-save">
          {flash}
        </p>
      ) : null}

      <section className="space-y-3">
        {state.mealPlan.map((meal, index) => (
          <article
            key={meal.id}
            className={`rounded-2xl border border-line bg-white/80 px-4 py-3.5 ${
              index === 0 ? "animate-rise" : ""
            }`}
          >
            <p className="text-[0.7rem] font-semibold tracking-wide text-green uppercase">
              {meal.dayLabel} · {meal.minutes} Min.
            </p>
            <h2 className="mt-1 font-display text-lg font-semibold text-ink">
              {meal.title}
            </h2>
            <p className="mt-1 text-sm text-muted">{meal.note}</p>

            {meal.missing.length > 0 ? (
              <p className="mt-2 text-xs font-medium text-warn">
                Fehlt: {meal.missing.join(", ")}
              </p>
            ) : (
              <p className="mt-2 text-xs font-medium text-save">
                Zutaten vorhanden
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {meal.recipeId ? (
                <Link
                  href={`/essen/${meal.recipeId}`}
                  className="rounded-xl bg-mint px-3 py-2 text-xs font-semibold text-ink"
                >
                  Anleitung
                </Link>
              ) : null}
              {meal.missing.length > 0 ? (
                <button
                  type="button"
                  onClick={() => pushMissing(meal.id)}
                  className="rounded-xl bg-green px-3 py-2 text-xs font-semibold text-white"
                >
                  Fehlendes auf Liste
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
