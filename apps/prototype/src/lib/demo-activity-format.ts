/** Alltagssprache für „Zuletzt aktiv“ — client-sicher. */
export function formatLastActiveDe(iso: string | null, now = new Date()): string {
  if (!iso) return "noch nie";
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "unbekannt";
  const diffMs = now.getTime() - then.getTime();
  if (diffMs < 0) return "gerade eben";
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "gerade eben";
  if (mins < 60) return `vor ${mins} Min.`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "gestern";
  if (days < 14) return `vor ${days} Tagen`;
  return then.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
    year: then.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}
