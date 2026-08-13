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
        events.push({
          uid: cur.uid?.trim() || `ics-${cur.date}-${title}`,
          title,
          date: cur.date,
          endDate:
            cur.endRaw && cur.date
              ? inclusiveEnd(cur.date, cur.endRaw, Boolean(cur.endDateOnly))
              : undefined,
          time: cur.time,
          detail: cur.detail?.trim() || "",
          location: cur.location?.trim() || undefined,
          wasteBin: classifyWasteBin(title),
        });
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
    }
  }

  events.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title, "de"));
  return { calName, events };
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
