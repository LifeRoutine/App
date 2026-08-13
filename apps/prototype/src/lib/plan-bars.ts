import type { HouseholdMember, PlanEvent } from "@/lib/types";
import { eventDateISO } from "@/lib/plan-dates";
import { SCHOOL_HOLIDAY_COLOR } from "@/lib/school-holidays";
import { classifyWasteBin, wasteBinColor } from "@/lib/waste-bins";

export const PERSONAL_CAL_COLOR = "#3d5a80";

export function eventBarColor(
  ev: PlanEvent,
  members: Pick<HouseholdMember, "id" | "color">[],
): string | null {
  if (ev.source === "school") return SCHOOL_HOLIDAY_COLOR;
  const bin =
    ev.wasteBin ?? (ev.source === "ics" ? classifyWasteBin(ev.title) : null);
  if (bin) return wasteBinColor[bin];
  if (ev.memberId) {
    return members.find((m) => m.id === ev.memberId)?.color ?? null;
  }
  if (ev.source === "personal") return PERSONAL_CAL_COLOR;
  return null;
}

export type DayBar = {
  key: string;
  color: string;
  edge: "single" | "start" | "mid" | "end";
};

function baseEventId(id: string): string {
  const m = id.match(/^(.*):(\d{4}-\d{2}-\d{2})$/);
  return m?.[1] ?? id;
}

function spanOf(
  ev: PlanEvent,
  originals: PlanEvent[],
  todayISO: string,
): { start: string; end: string } {
  const base = baseEventId(ev.id);
  const orig =
    originals.find((e) => e.id === base) ??
    originals.find((e) => e.seriesId === base && e.seriesMaster) ??
    ev;
  const start = eventDateISO(orig, todayISO);
  const end = orig.endDate && orig.endDate >= start ? orig.endDate : start;
  return { start, end };
}

/** Bis zu 3 farbige Balken für einen Monatstag (Mehrtages zuerst). */
export function barsForDay(
  dayEvents: PlanEvent[],
  iso: string,
  originals: PlanEvent[],
  members: Pick<HouseholdMember, "id" | "color">[],
  todayISO: string,
): DayBar[] {
  const scored = dayEvents.map((ev) => {
    const { start, end } = spanOf(ev, originals, todayISO);
    const days =
      Math.round(
        (new Date(`${end}T12:00:00`).getTime() -
          new Date(`${start}T12:00:00`).getTime()) /
          86_400_000,
      ) + 1;
    const color = eventBarColor(ev, members) ?? "#5a9a7a";
    let edge: DayBar["edge"] = "single";
    if (start !== end) {
      if (iso === start) edge = "start";
      else if (iso === end) edge = "end";
      else edge = "mid";
    }
    return { ev, color, edge, days };
  });
  scored.sort((a, b) => b.days - a.days);
  return scored.slice(0, 3).map((s) => ({
    key: s.ev.id,
    color: s.color,
    edge: s.edge,
  }));
}
