import type { PlanEvent } from "@/lib/types";
import { classifyWasteBin, type WasteBinKind } from "@/lib/waste-bins";
import { addDaysISO, dayOffsetFromDate, localDateISO } from "@/lib/plan-dates";

export type ParsedIcsEvent = {
  uid: string;
  title: string;
  date: string;
  /** Letzter Tag inklusiv, wenn Mehrtages-Termin */
  endDate?: string;
  time?: string;
  detail: string;
  location?: string;
  wasteBin: WasteBinKind;
};

/** ICS-Zeilen zusammenführen (Fortsetzungszeilen mit Leerzeichen/Tab). */
function unfoldIcs(text: string): string[] {
  const raw = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const lines: string[] = [];
  for (const line of raw) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  }
  return lines;
}

function unescapeIcs(value: string): string {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

/** DTSTART;VALUE=DATE:20260109 oder DTSTART:20260109T060000 */
function parseIcsDate(prop: string): string | null {
  const value = prop.includes(":") ? prop.slice(prop.lastIndexOf(":") + 1) : prop;
  const m = value.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

function parseIcsTime(prop: string): string | undefined {
  const value = prop.includes(":") ? prop.slice(prop.lastIndexOf(":") + 1) : prop;
  const m = value.match(/T(\d{2})(\d{2})/);
  if (!m) return undefined;
  return `${m[1]}:${m[2]}`;
}

function isDateOnly(prop: string): boolean {
  const value = prop.includes(":") ? prop.slice(prop.lastIndexOf(":") + 1) : prop;
  return /^\d{8}$/.test(value) || prop.toUpperCase().includes("VALUE=DATE");
}

/** DTEND bei ganztägig = erster Tag danach → inklusives Ende. */
function inclusiveEnd(start: string, endRaw: string, dateOnly: boolean): string | undefined {
  if (!endRaw) return undefined;
  let end = endRaw;
  if (dateOnly && end > start) {
    end = addDaysISO(end, -1);
  }
  return end >= start && end !== start ? end : undefined;
}

function propName(line: string): string {
  const base = line.split(":")[0] ?? "";
  return (base.split(";")[0] ?? "").toUpperCase();
}

function propValue(line: string): string {
  const i = line.indexOf(":");
  return i >= 0 ? line.slice(i + 1) : "";
}

/**
 * Liest Abfuhr-/Kalender-ICS (z. B. Abfall+).
 * Nur VEVENT mit Datum — kein Scraping, Datei vom Nutzer.
 */
export function parseIcsCalendar(text: string): {
  calName?: string;
  events: ParsedIcsEvent[];
  error?: string;
} {
  if (!text.includes("BEGIN:VCALENDAR")) {
    return { events: [], error: "Keine Kalender-Datei (.ics) erkannt." };
  }

  const lines = unfoldIcs(text);
  let calName: string | undefined;
  const events: ParsedIcsEvent[] = [];
  let inEvent = false;
  let cur: Partial<ParsedIcsEvent> & {
    date?: string;
    endRaw?: string;
    endDateOnly?: boolean;
    rrule?: string;
    exdates?: string[];
  } = {};

  for (const line of lines) {
    const name = propName(line);
    const value = unescapeIcs(propValue(line));

    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      cur = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (inEvent && cur.date && cur.title) {
        const title = cur.title.trim();
        const baseEnd =
          cur.endRaw && cur.date
            ? inclusiveEnd(cur.date, cur.endRaw, Boolean(cur.endDateOnly))
            : undefined;
        const uid = cur.uid?.trim() || `ics-${cur.date}-${title}`;
        const occurrences = expandSimpleRrule(
          cur.date,
          baseEnd,
          cur.rrule,
          cur.exdates ?? [],
        );
        for (const occ of occurrences) {
          events.push({
            uid: occ.date === cur.date ? uid : `${uid}-${occ.date}`,
            title,
            date: occ.date,
            endDate: occ.endDate,
            time: cur.time,
            detail: cur.detail?.trim() || "",
            location: cur.location?.trim() || undefined,
            wasteBin: classifyWasteBin(title),
          });
        }
      }
      inEvent = false;
      cur = {};
      continue;
    }
    if (!inEvent) {
      if (name === "X-WR-CALNAME") calName = value.trim();
      continue;
    }

    if (name === "DTSTART") {
      const d = parseIcsDate(line);
      if (d) cur.date = d;
      const t = parseIcsTime(line);
      if (t) cur.time = t;
    } else if (name === "DTEND") {
      const d = parseIcsDate(line);
      if (d) {
        cur.endRaw = d;
        cur.endDateOnly = isDateOnly(line);
      }
    } else if (name === "SUMMARY") {
      cur.title = value;
    } else if (name === "DESCRIPTION") {
      cur.detail = value;
    } else if (name === "UID") {
      cur.uid = value;
    } else if (name === "LOCATION") {
      cur.location = value;
    } else if (name === "RRULE") {
      cur.rrule = value;
    } else if (name === "EXDATE") {
      const d = parseIcsDate(line);
      if (d) cur.exdates = [...(cur.exdates ?? []), d];
    }
  }

  events.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title, "de"));
  return { calName, events };
}

const WEEKDAY_INDEX: Record<string, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

/** Einfache RRULE (täglich/wöchentlich/monatlich/jährlich) — max. 2 Jahre. */
function expandSimpleRrule(
  start: string,
  endDate: string | undefined,
  rrule: string | undefined,
  exdates: string[],
): { date: string; endDate?: string }[] {
  const span =
    endDate && endDate > start
      ? Math.round(
          (new Date(`${endDate}T12:00:00`).getTime() -
            new Date(`${start}T12:00:00`).getTime()) /
            86_400_000,
        )
      : 0;
  const withSpan = (date: string) => ({
    date,
    endDate: span > 0 ? addDaysISO(date, span) : undefined,
  });
  if (!rrule) return [withSpan(start)];

  const parts = Object.fromEntries(
    rrule.split(";").map((p) => {
      const [k, v] = p.split("=");
      return [(k ?? "").toUpperCase(), (v ?? "").toUpperCase()];
    }),
  );
  const freq = parts.FREQ as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | undefined;
  if (!freq) return [withSpan(start)];
  const interval = Math.max(1, Number(parts.INTERVAL) || 1);
  const until = parts.UNTIL ? parseIcsDate(`:${parts.UNTIL}`) : undefined;
  const count = parts.COUNT ? Math.min(400, Number(parts.COUNT) || 0) : 0;
  const byDay = (parts.BYDAY ?? "")
    .split(",")
    .map((d) => d.replace(/^-?\d+/, ""))
    .filter((d) => d in WEEKDAY_INDEX);
  const skip = new Set(exdates);
  const hardEnd = until ?? addDaysISO(start, 730);
  const out: { date: string; endDate?: string }[] = [];

  const push = (date: string) => {
    if (date > hardEnd) return false;
    if (count && out.length >= count) return false;
    if (!skip.has(date) && date >= start) out.push(withSpan(date));
    return !count || out.length < count;
  };

  if (freq === "WEEKLY" && byDay.length > 0) {
    let weekStart = start;
    let guard = 0;
    while (guard++ < 400) {
      const week = new Date(`${weekStart}T12:00:00`);
      const mondayOffset = (week.getDay() + 6) % 7;
      const monday = addDaysISO(weekStart, -mondayOffset);
      for (const code of byDay) {
        const iso = addDaysISO(
          monday,
          WEEKDAY_INDEX[code]! === 0 ? 6 : WEEKDAY_INDEX[code]! - 1,
        );
        if (iso < start) continue;
        if (iso > hardEnd) return out;
        if (!push(iso)) return out;
      }
      weekStart = addDaysISO(monday, 7 * interval);
      if (weekStart > hardEnd) break;
    }
    return out.length > 0 ? out : [withSpan(start)];
  }

  let cur = start;
  let guard = 0;
  while (guard++ < 400) {
    if (!push(cur)) break;
    if (freq === "DAILY") cur = addDaysISO(cur, interval);
    else if (freq === "WEEKLY") cur = addDaysISO(cur, 7 * interval);
    else if (freq === "MONTHLY") {
      const d = new Date(`${cur}T12:00:00`);
      d.setMonth(d.getMonth() + interval);
      cur = localDateISO(d);
    } else {
      const d = new Date(`${cur}T12:00:00`);
      d.setFullYear(d.getFullYear() + interval);
      cur = localDateISO(d);
    }
    if (cur > hardEnd) break;
  }
  return out.length > 0 ? out : [withSpan(start)];
}

/** ICS → PlanEvent (ganztägig → morgens 06:00 als Erinnerung). */
export function icsToPlanEvents(
  parsed: ParsedIcsEvent[],
  todayISO = localDateISO(),
): PlanEvent[] {
  const stamp = Date.now();
  return parsed.map((p, i) => ({
    id: `ics-${stamp}-${i}`,
    title: p.title,
    time: "06:00",
    date: p.date,
    endDate: p.endDate,
    dayOffset: dayOffsetFromDate(p.date, todayISO),
    kind: "termin" as const,
    detail: [p.detail, p.location].filter(Boolean).join(" · ") || "Aus Müllkalender.",
    visibility: "shared" as const,
    repeat: "none" as const,
    source: "ics" as const,
    icsUid: p.uid,
    wasteBin: p.wasteBin,
  }));
}

/** Schul-/Klassenkalender → PlanEvent, ohne Müll-Tonnen. */
export function icsToSchoolCalEvents(
  parsed: ParsedIcsEvent[],
  memberId: string,
  memberName: string,
  todayISO = localDateISO(),
): PlanEvent[] {
  const stamp = Date.now();
  return parsed.map((p, i) => ({
    id: `schoolcal-${memberId}-${stamp}-${i}`,
    title: p.title,
    time: p.time || "00:00",
    date: p.date,
    endDate: p.endDate,
    dayOffset: dayOffsetFromDate(p.date, todayISO),
    kind: "termin" as const,
    detail:
      [p.detail, p.location].filter(Boolean).join(" · ") ||
      `Schulkalender · ${memberName}`,
    visibility: "shared" as const,
    repeat: "none" as const,
    source: "schoolcal" as const,
    memberId,
    icsUid: p.uid,
  }));
}

/** Eigener Kalender (Google/Apple .ics) — ohne Müll-Tonnen. */
export function icsToPersonalEvents(
  parsed: ParsedIcsEvent[],
  memberId: string | undefined,
  memberName: string | undefined,
  todayISO = localDateISO(),
): PlanEvent[] {
  const stamp = Date.now();
  return parsed.map((p, i) => ({
    id: `personal-${memberId ?? "haushalt"}-${stamp}-${i}`,
    title: p.title,
    time: p.time || "00:00",
    date: p.date,
    endDate: p.endDate,
    dayOffset: dayOffsetFromDate(p.date, todayISO),
    kind: "termin" as const,
    detail:
      [p.detail, p.location].filter(Boolean).join(" · ") ||
      (memberName ? `Kalender · ${memberName}` : "Eigener Kalender"),
    visibility: "shared" as const,
    repeat: "none" as const,
    source: "personal" as const,
    memberId,
    icsUid: p.uid,
  }));
}

export async function readIcsFile(file: File): Promise<{
  ok: true;
  calName?: string;
  events: ParsedIcsEvent[];
} | { ok: false; error: string }> {
  const text = await file.text();
  const result = parseIcsCalendar(text);
  if (result.error) return { ok: false, error: result.error };
  if (result.events.length === 0) {
    return { ok: false, error: "Keine Termine in der Datei gefunden." };
  }
  return { ok: true, calName: result.calName, events: result.events };
}
