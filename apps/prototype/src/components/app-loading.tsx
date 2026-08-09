"use client";

/** Splash ohne next/image — zuverlässiger beim ersten Laden / Handy. */
export function AppLoading({
  label = "LifeRoutine wird geladen…",
}: {
  label?: string;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center px-4 py-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo-full.png"
        alt="LifeRoutine — Dein Alltag. Einfacher."
        width={220}
        height={96}
        className="h-auto w-auto max-w-[70%] object-contain"
      />
      <p className="mt-6 text-sm text-muted">{label}</p>
    </div>
  );
}
