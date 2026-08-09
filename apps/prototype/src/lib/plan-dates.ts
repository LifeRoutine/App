import type { PlanEvent } from "@/lib/types";

/** Lokales Kalenderdatum YYYY-MM-DD (ohne UTC-Verschiebung). */
export function localDateISO(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDaysISO(dateISO: string, days: number): string {
  const d = new Date(`${dateISO}T12:00:00`);
  d.setDate(d.getDate() + days);
  return localDateISO(d);
}

export function eventDateISO(ev: PlanEvent, todayISO = localDateISO()): string {
  if (ev.date) return ev.date;
  return addDaysISO(todayISO, ev.dayOffset);
}

export function dayOffsetFromDate(
  dateISO: string,
  todayISO = localDateISO(),
): number {
  const a = new Date(`${todayISO}T12:00:00`).getTime();
  const b = new Date(`${dateISO}T12:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function normalizePlanEvent(
  ev: PlanEvent,
  todayISO = localDateISO(),
): PlanEvent {
  const date = eventDateISO(ev, todayISO);
  return {
    ...ev,
    date,
    dayOffset: dayOffsetFromDate(date, todayISO),
  };
}

export function formatDayHeading(dateISO: string, todayISO = localDateISO()): string {
  const offset = dayOffsetFromDate(dateISO, todayISO);
  if (offset === 0) return "Heute";
  if (offset === 1) return "Morgen";
  if (offset === -1) return "Gestern";
  return new Date(`${dateISO}T12:00:00`).toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export const eventKindLabel: Record<PlanEvent["kind"], string> = {
  termin: "Termin",
  routine: "Routine",
  essen: "Essen",
  privat: "Privat",
};
