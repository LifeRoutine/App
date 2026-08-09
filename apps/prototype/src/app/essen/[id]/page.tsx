import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { recipes } from "@/lib/mock-data";

const statusLabel = {
  da: "Vorhanden",
  optional: "Optional",
  fehlt: "Fehlt",
} as const;

export default async function EssenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = recipes[id];
  if (!recipe) notFound();

  return (
    <AppShell title="Essen" subtitle="Anleitung · Zutaten · Kontext">
      <article className="animate-rise space-y-4">
        <header className="panel-soft rounded-3xl px-5 py-5">
          <p className="panel-kicker text-sm">Heute Abend</p>
          <h2 className="mt-1 font-display text-[1.7rem] leading-tight font-semibold text-ink">
            {recipe.title}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-sand px-3 py-1 text-muted">{recipe.time}</span>
            <span className="rounded-full bg-sand px-3 py-1 text-muted">
              {recipe.servings}
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            {recipe.whyToday}
          </p>
        </header>

        <section className="animate-rise-delay-1 rounded-2xl border border-line bg-white/75 px-4 py-4">
          <h3 className="font-display text-lg font-semibold text-navy">
            Zutaten
          </h3>
          <ul className="mt-3 space-y-2">
            {recipe.ingredients.map((ing) => (
              <li
                key={ing.name}
                className="flex items-center justify-between gap-3 border-b border-line/60 py-2 text-sm last:border-0"
              >
                <span className="text-ink">
                  <span className="font-medium">{ing.name}</span>
                  <span className="text-muted"> · {ing.amount}</span>
                </span>
                <span
                  className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${
                    ing.status === "da"
                      ? "bg-green/15 text-save"
                      : ing.status === "optional"
                        ? "bg-warn/15 text-warn"
                        : "bg-navy/10 text-navy"
                  }`}
                >
                  {statusLabel[ing.status]}
                </span>
              </li>
            ))}
          </ul>
          {recipe.tip ? (
            <p className="mt-3 text-sm text-muted">{recipe.tip}</p>
          ) : null}
        </section>

        <section className="animate-rise-delay-2 rounded-2xl border border-line bg-white/75 px-4 py-4">
          <h3 className="font-display text-lg font-semibold text-navy">
            So geht’s
          </h3>
          <ol className="mt-3 space-y-3">
            {recipe.steps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm leading-relaxed">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-mint text-xs font-bold text-navy">
                  {index + 1}
                </span>
                <p className="pt-0.5 text-ink">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            href="/"
            className="rounded-xl border border-line bg-white/70 px-4 py-2.5 text-sm font-semibold text-navy"
          >
            Zurück zu Heute
          </Link>
          <Link
            href="/einkauf"
            className="rounded-xl bg-sand px-4 py-2.5 text-sm font-semibold text-ink"
          >
            Fehlendes auf die Liste
          </Link>
        </div>
      </article>
    </AppShell>
  );
}
