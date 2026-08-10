import type { EventRepeat, PlanEvent } from "@/lib/types";

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

export const eventVisibilityLabel: Record<
  NonNullable<PlanEvent["visibility"]>,
  string
> = {
  shared: "Für alle",
  private: "Nur für mich",
  partner: "Nur mit Partner",
};

export const eventRepeatLabel: Record<EventRepeat, string> = {
  none: "Nur einmal",
  weekly: "Jede Woche",
  biweekly: "Alle 2 Wochen",
  monthly: "Jeden Monat",
};

function stepRepeat(cur: string, repeat: EventRepeat): string {
  if (repeat === "weekly") return addDaysISO(cur, 7);
  if (repeat === "biweekly") return addDaysISO(cur, 14);
  const d = new Date(`${cur}T12:00:00`);
  d.setMonth(d.getMonth() + 1);
  return localDateISO(d);
}

/**
 * Vorkommen einer Serie im Zeitraum [fromISO, toISO].
 * Ohne repeatUntil = unbegrenzt (nur durch toISO begrenzt).
 */
export function datesInRangeForRepeat(
  startISO: string,
  repeat: EventRepeat,
  fromISO: string,
  toISO: string,
  repeatUntil?: string,
  skipDates: string[] = [],
): string[] {
  if (repeat === "none") {
    if (
      startISO >= fromISO &&
      startISO <= toISO &&
      !skipDates.includes(startISO)
    ) {
      return [startISO];
    }
    return [];
  }
  const hardEnd =
    repeatUntil && repeatUntil < toISO ? repeatUntil : toISO;
  const skip = new Set(skipDates);
  const out: string[] = [];
  let cur = startISO;
  let guard = 0;
  // Vorspulen bis in den sichtbaren Bereich
  while (cur < fromISO && guard < 5000) {
    cur = stepRepeat(cur, repeat);
    guard++;
  }
  while (cur <= hardEnd && guard < 5000) {
    if (cur >= fromISO && cur <= toISO && !skip.has(cur)) out.push(cur);
    cur = stepRepeat(cur, repeat);
    guard++;
  }
  return out;
}

/** Termine für Anzeige: Serien-Master expandieren, Einmaltermine übernehmen. */
export function expandEventsForRange(
  events: PlanEvent[],
  fromISO: string,
  toISO: string,
  todayISO = localDateISO(),
): PlanEvent[] {
  const out: PlanEvent[] = [];
  for (const e of events) {
    const start = eventDateISO(e, todayISO);
    const isMaster =
      Boolean(e.seriesMaster) &&
      Boolean(e.repeat) &&
      e.repeat !== "none";

    if (isMaster) {
      const dates = datesInRangeForRepeat(
        start,
        e.repeat!,
        fromISO,
        toISO,
        e.repeatUntil,
        e.skipDates ?? [],
      );
      for (const date of dates) {
        out.push(
          normalizePlanEvent(
            {
              ...e,
              id: `${e.seriesId ?? e.id}:${date}`,
              date,
              seriesMaster: false,
              detail: e.detail,
            },
            todayISO,
          ),
        );
      }
      continue;
    }

    // Legacy-Instanzen / Einmaltermine (kein Master)
    if (e.seriesMaster) continue;
    if (start >= fromISO && start <= toISO) {
      out.push(normalizePlanEvent(e, todayISO));
    }
  }
  return out.sort((a, b) => {
    const da = eventDateISO(a, todayISO).localeCompare(eventDateISO(b, todayISO));
    if (da !== 0) return da;
    return a.time.localeCompare(b.time);
  });
}

export function eventsOnDate(
  events: PlanEvent[],
  dateISO: string,
  todayISO = localDateISO(),
): PlanEvent[] {
  return expandEventsForRange(events, dateISO, dateISO, todayISO);
}
