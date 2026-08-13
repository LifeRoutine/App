import type { MealPlanDay, PantryItem } from "@/lib/types";

/** Feste Vorschläge zum Durchwechseln — Alltagsküche, kein erfundenes Lokal. */
export type MealSuggestion = {
  key: string;
  title: string;
  minutes: number;
  note: string;
  /** Zutaten, die wir gegen den Vorrat prüfen */
  needs: string[];
  recipeId?: string;
};

export const MEAL_SUGGESTIONS: MealSuggestion[] = [
  {
    key: "pasta-aglio",
    title: "Pasta Aglio e Olio",
    minutes: 18,
    note: "Schnell und wenig Aufwand.",
    needs: ["Spaghetti", "Olivenöl"],
    recipeId: "pasta-aglio",
  },
  {
    key: "ruehrei",
    title: "Rührei mit Toast",
    minutes: 12,
    note: "Leicht und schnell.",
    needs: ["Eier", "Toastbrot"],
  },
  {
    key: "bowl",
    title: "Resteverwertung Bowl",
    minutes: 20,
    note: "Was noch im Kühlschrank liegt.",
    needs: [],
  },
  {
    key: "kartoffel",
    title: "Bratkartoffeln mit Salat",
    minutes: 25,
    note: "Satt und einfach.",
    needs: ["Kartoffeln", "Salat"],
  },
  {
    key: "suppe",
    title: "Gemüsesuppe",
    minutes: 30,
    note: "Gut vorzubereiten.",
    needs: ["Gemüsebrühe", "Gemüse"],
  },
  {
    key: "wraps",
    title: "Gemüse-Wraps",
    minutes: 15,
    note: "Wenig Abwasch.",
    needs: ["Wraps", "Gemüse"],
  },
  {
    key: "nudeln-tomate",
    title: "Nudeln mit Tomatensoße",
    minutes: 20,
    note: "Klassiker für unter der Woche.",
    needs: ["Nudeln", "Tomatensoße"],
  },
  {
    key: "grillen",
    title: "Grillen / Grillteller",
    minutes: 45,
    note: "Wenn Gäste kommen oder Wochenende.",
    needs: ["Würstchen", "Salate", "Getränke"],
  },
];

function pantryHas(pantry: PantryItem[], name: string): boolean {
  const hit = pantry.find(
    (p) => p.name.toLowerCase() === name.toLowerCase(),
  );
  if (!hit) return false;
  return hit.status !== "empty" && hit.amount > 0;
}

export function missingAgainstPantry(
  needs: string[],
  pantry: PantryItem[],
): string[] {
  return needs.filter((n) => !pantryHas(pantry, n));
}

function suggestionIndexForMeal(meal: MealPlanDay): number {
  const byRecipe = MEAL_SUGGESTIONS.findIndex(
    (s) => s.recipeId && s.recipeId === meal.recipeId,
  );
  if (byRecipe >= 0) return byRecipe;
  const byTitle = MEAL_SUGGESTIONS.findIndex(
    (s) => s.title.toLowerCase() === meal.title.toLowerCase(),
  );
  return byTitle >= 0 ? byTitle : -1;
}

/** Nächster Vorschlag für diesen Tag — Vorrat entscheidet, was fehlt. */
export function nextMealForDay(
  meal: MealPlanDay,
  pantry: PantryItem[],
): MealPlanDay {
  const cur = suggestionIndexForMeal(meal);
  const next =
    MEAL_SUGGESTIONS[(cur + 1 + MEAL_SUGGESTIONS.length) % MEAL_SUGGESTIONS.length]!;
  return {
    ...meal,
    title: next.title,
    minutes: next.minutes,
    note: next.note,
    missing: missingAgainstPantry(next.needs, pantry),
    recipeId: next.recipeId,
  };
}
