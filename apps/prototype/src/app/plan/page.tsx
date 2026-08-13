"use client";

import { useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { WasteBinDot, WasteBinIcon } from "@/components/waste-bin-icon";
import { useApp } from "@/lib/app-context";
import { icsToPlanEvents, readIcsFile } from "@/lib/ics";
import { docTypeLabel } from "@/lib/mock-data";
import {
  addDaysISO,
  eventDateISO,
  eventRepeatLabel,
  eventVisibilityLabel,
  expandEventsForRange,
  formatDayHeading,
  localDateISO,
  normalizePlanEvent,
} from "@/lib/plan-dates";
import {
  BUNDESLAENDER,
  SCHOOL_HOLIDAY_COLOR,
  bundeslandName,
  formatSchoolHolidayTitle,
  type SchoolHolidayPeriod,
} from "@/lib/school-holidays";
import type { DocumentType, EventRepeat, PlanEvent } from "@/lib/types";
import { classifyWasteBin } from "@/lib/waste-bins";

const docTypes = Object.keys(docTypeLabel) as DocumentType[];
const warnOptions = [
  { months: 1, label: "4 Wochen vorher" },
  { months: 3, label: "3 Monate vorher" },
  { months: 6, label: "6 Monate vorher" },
];
const visibilityOptions: NonNullable<PlanEvent["visibility"]>[] = [
  "shared",
  "private",
  "partner",
];

type PlanTab = "termine" | "fristen";

/** Expandierte Mehrtages-IDs: `id:YYYY-MM-DD` → Basis-ID zum Löschen. */
function baseEventId(id: string): string {
  const m = id.match(/^(.*):(\d{4}-\d{2}-\d{2})$/);
  return m?.[1] ?? id;
}

function eventBarColor(
  ev: PlanEvent,
  members: { id: string; color: string }[],
): string | null {
  if (ev.source === "school") return SCHOOL_HOLIDAY_COLOR;
  if (ev.memberId) {
    return members.find((m) => m.id === ev.memberId)?.color ?? null;
  }
  return null;
}
function monthMatrix(year: number, monthIndex: number): (string | null)[][] {
  const first = new Date(year, monthIndex, 1);
  const startPad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(localDateISO(new Date(year, monthIndex, d)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

export default function PlanPage() {
  const {
    state,
    addDocument,
    removeDocument,
    addEvent,
    addVacation,
    removeEvent,
    removeEventSeries,
    endEventSeries,
    skipSeriesOccurrence,
    importIcsEvents,
    importSchoolHolidays,
  } = useApp();
  const today = localDateISO();
  const [tab, setTab] = useState<PlanTab>("termine");
  const [selected, setSelected] = useState(today);
  const [showMonth, setShowMonth] = useState(false);
  const [composer, setComposer] = useState<
    null | "termin" | "urlaub" | "kalender"
  >(null);
  const [icsMsg, setIcsMsg] = useState<string | null>(null);
  const icsInputRef = useRef<HTMLInputElement>(null);
  const [cursor, setCursor] = useState(() => {
    const [y, m] = today.split("-").map(Number);
    return { year: y, month: m - 1 };
  });

  const [evTitle, setEvTitle] = useState("");
  const [evTime, setEvTime] = useState("18:00");
  const [evVisibility, setEvVisibility] =
    useState<NonNullable<PlanEvent["visibility"]>>("shared");
  const [evDetail, setEvDetail] = useState("");
  const [evRepeat, setEvRepeat] = useState<EventRepeat>("none");
  const [evUntil, setEvUntil] = useState("");
  const [evMemberId, setEvMemberId] = useState("");
  const [ferienState, setFerienState] = useState(
    state.profile.schoolHolidayState || "BW",
  );
  const [ferienBusy, setFerienBusy] = useState(false);
  const [ferienMsg, setFerienMsg] = useState<string | null>(null);

  const [vacMemberId, setVacMemberId] = useState(
    () => state.members[0]?.id ?? "",
  );
  const [vacStart, setVacStart] = useState(today);
  const [vacEnd, setVacEnd] = useState(today);
  const [vacTitle, setVacTitle] = useState("");
  const [vacMsg, setVacMsg] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState<DocumentType>("personalausweis");
  const [person, setPerson] = useState(state.members[0]?.name ?? "Ich");
  const [personId, setPersonId] = useState<string | undefined>(
    state.members[0]?.id,
  );
  const [expiresOn, setExpiresOn] = useState("");
  const [warnMonths, setWarnMonths] = useState(6);
  const [showAddDoc, setShowAddDoc] = useState(false);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDaysISO(today, i)),
    [today],
  );

  const eventsByDate = useMemo(() => {
    const monthStart = localDateISO(new Date(cursor.year, cursor.month, 1));
    const monthEnd = localDateISO(new Date(cursor.year, cursor.month + 1, 0));
    const from = weekDays[0] < monthStart ? weekDays[0] : monthStart;
    let to = weekDays[6] > monthEnd ? weekDays[6] : monthEnd;
    // Serien weit genug voraus expandieren (Anzeige + nächste Wochen)
    if (to < addDaysISO(today, 90)) to = addDaysISO(today, 90);
    const expanded = expandEventsForRange(state.events, from, to, today);
    const map = new Map<string, PlanEvent[]>();
    for (const e of expanded) {
      const d = eventDateISO(e, today);
      const list = map.get(d) ?? [];
      list.push(e);
      map.set(d, list);
    }
    for (const [, list] of map) list.sort((a, b) => a.time.localeCompare(b.time));
    return map;
  }, [state.events, today, weekDays, cursor.year, cursor.month]);

  const dayEvents = eventsByDate.get(selected) ?? [];
  const matrix = monthMatrix(cursor.year, cursor.month);
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(
    "de-DE",
    { month: "long", year: "numeric" },
  );

  const sortedDocs = useMemo(
    () =>
      [...state.documents].sort((a, b) =>
        a.expiresOn.localeCompare(b.expiresOn),
      ),
    [state.documents],
  );

  function selectDay(iso: string) {
    setSelected(iso);
    const [y, m] = iso.split("-").map(Number);
    setCursor({ year: y, month: m - 1 });
  }

  function submitEvent() {
    if (!evTitle.trim()) return;
    addEvent({
      title: evTitle,
      date: selected,
      time: evTime,
      kind: "termin",
      detail: evDetail,
      visibility: evVisibility,
      repeat: evRepeat,
      repeatUntil: evRepeat === "none" ? undefined : evUntil || undefined,
      memberId: evMemberId || undefined,
    });
    setEvTitle("");
    setEvDetail("");
    setEvVisibility("shared");
    setEvRepeat("none");
    setEvUntil("");
    setEvMemberId("");
    setComposer(null);
  }

  async function onIcsFile(file: File | undefined) {
    setIcsMsg(null);
    if (!file) return;
    const result = await readIcsFile(file);
    if (!result.ok) {
      setIcsMsg(result.error);
      if (icsInputRef.current) icsInputRef.current.value = "";
      return;
    }
    const count = importIcsEvents(icsToPlanEvents(result.events, today));
    const name = result.calName ? ` „${result.calName}“` : "";
    setIcsMsg(`${count} Abfuhrtermine geladen${name}.`);
    if (icsInputRef.current) icsInputRef.current.value = "";
    const next = result.events.find((e) => e.date >= today) ?? result.events[0];
    if (next) setSelected(next.date);
  }

  async function loadSchoolHolidays() {
    setFerienBusy(true);
    setFerienMsg(null);
    try {
      const res = await fetch(
        `/api/school-holidays?state=${encodeURIComponent(ferienState)}`,
      );
      const data = (await res.json()) as {
        error?: string;
        periods?: SchoolHolidayPeriod[];
        state?: string;
      };
      if (!res.ok || !data.periods) {
        setFerienMsg(data.error || "Ferien konnten nicht geladen werden.");
        return;
      }
      const events: PlanEvent[] = data.periods.map((p) => {
        const slug = (p.slug || `${p.name}-${p.start}`).replace(/\s+/g, "-");
        return normalizePlanEvent(
          {
            id: `school-${slug}`,
            title: formatSchoolHolidayTitle(p.name),
            time: "00:00",
            date: p.start.slice(0, 10),
            endDate: p.end.slice(0, 10),
            dayOffset: 0,
            kind: "termin",
            detail: `Schulferien · ${bundeslandName(ferienState)}`,
            visibility: "shared",
            source: "school",
            icsUid: slug,
            repeat: "none",
          },
          today,
        );
      });
      const n = importSchoolHolidays(events, ferienState);
      setFerienMsg(
        `${n} Ferienzeiten für ${bundeslandName(ferienState)} geladen (ferien-api.de).`,
      );
    } catch {
      setFerienMsg("Keine Verbindung — später nochmal versuchen.");
    } finally {
      setFerienBusy(false);
    }
  }

  function submitVacation() {
    setVacMsg(null);
    if (!vacMemberId || !vacStart || !vacEnd) {
      setVacMsg("Person und Zeitraum wählen.");
      return;
    }
    if (vacEnd < vacStart) {
      setVacMsg("Ende darf nicht vor dem Start liegen.");
      return;
    }
    addVacation({
      memberId: vacMemberId,
      startDate: vacStart,
      endDate: vacEnd,
      title: vacTitle.trim() || undefined,
    });
    setVacTitle("");
    setVacMsg("Urlaub eingetragen — Farbe der Person im Kalender.");
    setSelected(vacStart);
    setComposer(null);
  }

  function submitDoc() {
    if (!expiresOn) return;
    if (docType === "sonstiges" && !title.trim()) return;
    addDocument({
      title:
        docType === "sonstiges"
          ? title.trim()
          : docTypeLabel[docType],
      docType,
      person,
      personId,
      expiresOn,
      warnMonths,
    });
    setTitle("");
    setExpiresOn("");
    setShowAddDoc(false);
  }

  return (
    <AppShell title="Plan" subtitle="Termine eintragen · Fristen merken">
      <div className="mb-4 grid grid-cols-2 gap-2">
        {(
          [
            ["termine", "Termine"],
            ["fristen", "Fristen"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-2xl px-3 py-2.5 text-sm font-semibold ${
              tab === id
                ? "bg-green text-white"
                : "border border-line bg-white/80 text-ink"
            }`}
          >
            {label}
            {id === "termine" ? (
              <span className="ml-1 opacity-80">
                (
                {
                  expandEventsForRange(
                    state.events,
                    today,
                    addDaysISO(today, 6),
                    today,
                  ).length
                }
                )
              </span>
            ) : (
              <span className="ml-1 opacity-80">({state.documents.length})</span>
            )}
          </button>
        ))}
      </div>

      {tab === "termine" ? (
        <>
          <section className="rounded-2xl border border-line bg-white/80 px-3 py-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="font-display text-base font-semibold text-ink">
                Woche
              </h2>
              <button
                type="button"
                onClick={() => setShowMonth((v) => !v)}
                className="text-xs font-semibold text-muted underline"
              >
                {showMonth ? "Monat zu" : "Monat"}
              </button>
            </div>
            {/* Kompakte Leiste — kein Scroll durch 7 große Karten */}
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((iso) => {
                const events = eventsByDate.get(iso) ?? [];
                const active = iso === selected;
                const weekday = new Date(`${iso}T12:00:00`).toLocaleDateString(
                  "de-DE",
                  { weekday: "short" },
                );
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => selectDay(iso)}
                    className={`rounded-xl px-0.5 py-2 text-center transition ${
                      active
                        ? "bg-green text-white"
                        : iso === today
                          ? "bg-mint text-save"
                          : "bg-sand/50 text-ink"
                    }`}
                  >
                    <p className="text-[0.6rem] font-semibold uppercase opacity-80">
                      {weekday.replace(".", "")}
                    </p>
                    <p className="font-display text-lg font-semibold leading-none">
                      {Number(iso.slice(8))}
                    </p>
                    <div className="mt-1 flex min-h-[0.375rem] justify-center gap-0.5">
                      {events.slice(0, 3).map((ev) => {
                        const bin =
                          ev.wasteBin ??
                          (ev.source === "ics"
                            ? classifyWasteBin(ev.title)
                            : null);
                        if (bin) {
                          return (
                            <WasteBinDot
                              key={ev.id}
                              kind={bin}
                              active={active}
                            />
                          );
                        }
                        const color = eventBarColor(ev, state.members);
                        return (
                          <span
                            key={ev.id}
                            className="inline-block h-1.5 w-1.5 rounded-full"
                            style={{
                              backgroundColor: color
                                ? color
                                : active
                                  ? "#fff"
                                  : "#5a9a7a",
                            }}
                          />
                        );
                      })}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {showMonth ? (
            <section className="mt-3 rounded-2xl border border-line bg-white/80 px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date(cursor.year, cursor.month - 1, 1);
                    setCursor({ year: d.getFullYear(), month: d.getMonth() });
                  }}
                  className="rounded-lg border border-line px-2 py-1 text-sm font-semibold"
                >
                  ←
                </button>
                <p className="text-sm font-semibold capitalize text-ink">
                  {monthLabel}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date(cursor.year, cursor.month + 1, 1);
                    setCursor({ year: d.getFullYear(), month: d.getMonth() });
                  }}
                  className="rounded-lg border border-line px-2 py-1 text-sm font-semibold"
                >
                  →
                </button>
              </div>
              <div className="mt-2 grid grid-cols-7 gap-0.5 text-center text-[0.6rem] font-semibold text-muted">
                {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-0.5">
                {matrix.flat().map((iso, idx) => {
                  if (!iso)
                    return <div key={`e-${idx}`} className="aspect-square" />;
                  const dayList = eventsByDate.get(iso) ?? [];
                  const has = dayList.length > 0;
                  const on = iso === selected;
                  const accent =
                    dayList
                      .map((ev) => eventBarColor(ev, state.members))
                      .find(Boolean) ?? null;
                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => selectDay(iso)}
                      className={`aspect-square rounded-lg text-xs font-semibold ${
                        on
                          ? "bg-green text-white"
                          : iso === today
                            ? "bg-mint text-save"
                            : "text-ink"
                      }`}
                    >
                      {Number(iso.slice(8))}
                      {has ? (
                        <span
                          className="mx-auto mt-0.5 block h-1 w-1 rounded-full"
                          style={{
                            backgroundColor: on
                              ? "#fff"
                              : accent || "#5a9a7a",
                          }}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          {/* Detail gewählter Tag — direkt sichtbar */}
          <section className="mt-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">
                {formatDayHeading(selected, today)}
              </h2>
              <p className="text-xs text-muted">
                {new Date(`${selected}T12:00:00`).toLocaleDateString("de-DE", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {(
                [
                  ["termin", "Termin"],
                  ["urlaub", "Urlaub"],
                  ["kalender", "Kalender laden"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setComposer((c) => {
                      if (c === id) return null;
                      if (id === "urlaub") {
                        setVacStart(selected);
                        setVacEnd((end) => (end < selected ? selected : end));
                      }
                      return id;
                    });
                  }}
                  className={`rounded-2xl px-2 py-2.5 text-center text-[0.7rem] font-semibold leading-tight ${
                    composer === id
                      ? "bg-navy text-white"
                      : "border border-line bg-white text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {composer === "termin" ? (
              <div className="mt-3 space-y-3 rounded-2xl border border-line bg-white/90 px-4 py-4">
                <label className="block">
                  <span className="text-xs font-semibold text-muted">Titel</span>
                  <input
                    value={evTitle}
                    onChange={(e) => setEvTitle(e.target.value)}
                    placeholder="z. B. Zahnarzt"
                    className="mt-1 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none ring-green/30 focus:ring-2"
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="text-xs font-semibold text-muted">
                      Uhrzeit
                    </span>
                    <input
                      type="time"
                      value={evTime}
                      onChange={(e) => setEvTime(e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-muted">
                      Wer sieht das?
                    </span>
                    <select
                      value={evVisibility}
                      onChange={(e) =>
                        setEvVisibility(
                          e.target.value as NonNullable<PlanEvent["visibility"]>,
                        )
                      }
                      className="mt-1 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
                    >
                      {visibilityOptions.map((v) => (
                        <option key={v} value={v}>
                          {eventVisibilityLabel[v]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {state.members.length > 0 ? (
                  <label className="block">
                    <span className="text-xs font-semibold text-muted">
                      Wer? (Farbe im Kalender)
                    </span>
                    <select
                      value={evMemberId}
                      onChange={(e) => setEvMemberId(e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
                    >
                      <option value="">Niemand / alle</option>
                      {state.members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <label className="block">
                  <span className="text-xs font-semibold text-muted">
                    Notiz (optional)
                  </span>
                  <input
                    value={evDetail}
                    onChange={(e) => setEvDetail(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none ring-green/30 focus:ring-2"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-muted">
                    Wiederholen?
                  </span>
                  <select
                    value={evRepeat}
                    onChange={(e) =>
                      setEvRepeat(e.target.value as EventRepeat)
                    }
                    className="mt-1 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
                  >
                    {(Object.keys(eventRepeatLabel) as EventRepeat[]).map(
                      (r) => (
                        <option key={r} value={r}>
                          {eventRepeatLabel[r]}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                {evRepeat !== "none" ? (
                  <label className="block">
                    <span className="text-xs font-semibold text-muted">
                      Endet am (optional) — leer = dauerhaft bis du beendest
                    </span>
                    <input
                      type="date"
                      value={evUntil}
                      min={selected}
                      onChange={(e) => setEvUntil(e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
                    />
                  </label>
                ) : null}
                <button
                  type="button"
                  onClick={submitEvent}
                  disabled={!evTitle.trim()}
                  className="w-full rounded-2xl bg-green px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {evRepeat === "none" ? "Speichern" : "Wiederholung speichern"}
                </button>
              </div>
            ) : null}

            {composer === "urlaub" ? (
              <div className="mt-3 space-y-3 rounded-2xl border border-line bg-white/90 px-4 py-4">
                <p className="text-xs text-muted">
                  Pro Person — Farbe wie im Familienkalender. Gilt ab dem
                  gewählten Tag.
                </p>
                <label className="block">
                  <span className="text-xs font-semibold text-muted">Wer</span>
                  <select
                    value={vacMemberId}
                    onChange={(e) => setVacMemberId(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-line bg-white px-3 py-2.5 text-sm"
                  >
                    {state.members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="text-xs font-semibold text-muted">Von</span>
                    <input
                      type="date"
                      value={vacStart}
                      onChange={(e) => setVacStart(e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-line bg-white px-3 py-2.5 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-muted">Bis</span>
                    <input
                      type="date"
                      value={vacEnd}
                      min={vacStart}
                      onChange={(e) => setVacEnd(e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-line bg-white px-3 py-2.5 text-sm"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs font-semibold text-muted">
                    Titel (optional)
                  </span>
                  <input
                    value={vacTitle}
                    onChange={(e) => setVacTitle(e.target.value)}
                    placeholder="z. B. Skifahren"
                    className="mt-1 w-full rounded-2xl border border-line bg-white px-3 py-2.5 text-sm"
                  />
                </label>
                <button
                  type="button"
                  onClick={submitVacation}
                  disabled={!vacMemberId}
                  className="w-full rounded-2xl bg-green px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Urlaub speichern
                </button>
                {vacMsg ? (
                  <p className="text-xs font-semibold text-save">{vacMsg}</p>
                ) : null}
              </div>
            ) : null}

            {composer === "kalender" ? (
              <div className="mt-3 space-y-4 rounded-2xl border border-line bg-white/90 px-4 py-4">
                <div>
                  <p className="text-xs font-semibold text-ink">Müllkalender</p>
                  <p className="mt-0.5 text-[0.7rem] text-muted">
                    .ics vom Landkreis laden. Hechingen ist schon im Plan.
                  </p>
                  <button
                    type="button"
                    onClick={() => icsInputRef.current?.click()}
                    className="mt-2 rounded-xl bg-navy px-3 py-2 text-xs font-semibold text-white"
                  >
                    Datei wählen (.ics)
                  </button>
                  <input
                    ref={icsInputRef}
                    type="file"
                    accept=".ics,text/calendar"
                    className="hidden"
                    onChange={(e) => void onIcsFile(e.target.files?.[0])}
                  />
                  {icsMsg ? (
                    <p className="mt-2 text-xs font-semibold text-save">
                      {icsMsg}
                    </p>
                  ) : null}
                </div>
                <div className="border-t border-line pt-3">
                  <p className="text-xs font-semibold text-ink">Schulferien</p>
                  <p className="mt-0.5 text-[0.7rem] text-muted">
                    Bundesland — Quelle ferien-api.de (dieses und nächstes Jahr).
                  </p>
                  <select
                    value={ferienState}
                    onChange={(e) => setFerienState(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-line bg-white px-3 py-2.5 text-sm"
                  >
                    {BUNDESLAENDER.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={ferienBusy}
                    onClick={() => void loadSchoolHolidays()}
                    className="mt-2 w-full rounded-2xl bg-navy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {ferienBusy ? "Lädt…" : "Ferien laden"}
                  </button>
                  {ferienMsg ? (
                    <p className="mt-2 text-xs font-semibold text-save">
                      {ferienMsg}
                    </p>
                  ) : state.profile.schoolHolidayState ? (
                    <p className="mt-2 text-xs text-muted">
                      Geladen: {bundeslandName(state.profile.schoolHolidayState)}{" "}
                      <span
                        className="ml-1 inline-block h-2 w-2 rounded-full align-middle"
                        style={{ backgroundColor: SCHOOL_HOLIDAY_COLOR }}
                      />
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="mt-3 space-y-2">
              {dayEvents.length === 0 ? (
                <p className="text-sm text-muted">
                  Nichts an diesem Tag — Termin, Urlaub oder Kalender laden.
                </p>
              ) : (
                dayEvents.map((ev) => {
                  const bin =
                    ev.wasteBin ??
                    (ev.source === "ics" ? classifyWasteBin(ev.title) : null);
                  const accent = eventBarColor(ev, state.members);
                  const memberName = ev.memberId
                    ? state.members.find((m) => m.id === ev.memberId)?.name
                    : null;
                  const rangeLabel =
                    ev.endDate && ev.date && ev.endDate !== ev.date
                      ? `${ev.date.slice(8)}.${ev.date.slice(5, 7)}.–${ev.endDate.slice(8)}.${ev.endDate.slice(5, 7)}.`
                      : null;
                  return (
                  <article
                    key={ev.id}
                    className="rounded-2xl border border-line bg-white/80 px-4 py-3"
                    style={
                      accent
                        ? {
                            borderLeftWidth: 4,
                            borderLeftColor: accent,
                            backgroundColor: `${accent}18`,
                          }
                        : undefined
                    }
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-start gap-2.5">
                        {bin ? (
                          <WasteBinIcon kind={bin} size={26} className="mt-0.5 shrink-0" />
                        ) : accent ? (
                          <span
                            className="mt-1 inline-block h-4 w-4 shrink-0 rounded-full"
                            style={{ backgroundColor: accent }}
                            aria-hidden
                          />
                        ) : null}
                        <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink">
                          {bin ||
                          ev.source === "school" ||
                          ev.source === "vacation" ? null : (
                            <span className="text-muted">{ev.time} · </span>
                          )}
                          {ev.title}
                        </p>
                        {ev.detail ? (
                          <p className="mt-1 text-sm text-muted">{ev.detail}</p>
                        ) : null}
                        <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-wide text-green">
                          {bin
                            ? "Müllkalender"
                            : ev.source === "school"
                              ? "Schulferien"
                              : ev.source === "vacation"
                                ? `Urlaub${memberName ? ` · ${memberName}` : ""}`
                                : memberName
                                  ? `${eventVisibilityLabel[ev.visibility ?? "shared"]} · ${memberName}`
                                  : eventVisibilityLabel[ev.visibility ?? "shared"]}
                          {rangeLabel ? ` · ${rangeLabel}` : ""}
                          {ev.repeat && ev.repeat !== "none"
                            ? ` · ${eventRepeatLabel[ev.repeat]}`
                            : ""}
                        </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {ev.seriesId ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                skipSeriesOccurrence(
                                  ev.seriesId!,
                                  eventDateISO(ev, today),
                                )
                              }
                              className="text-xs font-semibold text-muted underline"
                            >
                              Diesen Tag streichen
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Wiederholung stoppen? Ab diesem Tag kommt der Termin nicht mehr.",
                                  )
                                ) {
                                  endEventSeries(
                                    ev.seriesId!,
                                    eventDateISO(ev, today),
                                  );
                                }
                              }}
                              className="text-xs font-semibold text-muted underline"
                            >
                              Nicht mehr wiederholen
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Alle Termine dieser Wiederholung löschen?",
                                  )
                                ) {
                                  removeEventSeries(ev.seriesId!);
                                }
                              }}
                              className="text-xs font-semibold text-muted underline"
                            >
                              Alle löschen
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => removeEvent(baseEventId(ev.id))}
                            className="text-xs font-semibold text-muted underline"
                          >
                            Löschen
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                  );
                })
              )}
            </div>
          </section>
        </>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold text-ink">
              Dokumente & Fristen
            </h2>
            <button
              type="button"
              onClick={() => setShowAddDoc((v) => !v)}
              className="rounded-2xl bg-navy px-3 py-2 text-xs font-semibold text-white"
            >
              {showAddDoc ? "Schließen" : "+ Frist"}
            </button>
          </div>
          <p className="mb-3 text-sm text-muted">
            Nur Typ, Person, Ablauf — keine Ausweis-/Kartennummern.
          </p>

          {showAddDoc ? (
            <div className="mb-4 space-y-3 rounded-2xl border border-line bg-white/90 px-4 py-4">
              <label className="block">
                <span className="text-xs font-semibold text-muted">Typ</span>
                <select
                  value={docType}
                  onChange={(e) => {
                    const next = e.target.value as DocumentType;
                    setDocType(next);
                    if (next !== "sonstiges") setTitle("");
                  }}
                  className="mt-1 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
                >
                  {docTypes.map((t) => (
                    <option key={t} value={t}>
                      {docTypeLabel[t]}
                    </option>
                  ))}
                </select>
              </label>
              {docType === "sonstiges" ? (
                <label className="block">
                  <span className="text-xs font-semibold text-muted">
                    Was genau?
                  </span>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="z. B. Impfpass, ADAC-Mitgliedschaft…"
                    className="mt-1 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none ring-green/30 focus:ring-2"
                  />
                </label>
              ) : null}
              <label className="block">
                <span className="text-xs font-semibold text-muted">Person</span>
                <select
                  value={personId ?? ""}
                  onChange={(e) => {
                    const m = state.members.find((x) => x.id === e.target.value);
                    setPersonId(m?.id);
                    setPerson(m?.name ?? "Ich");
                  }}
                  className="mt-1 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
                >
                  {state.members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-muted">
                  Ablaufdatum
                </span>
                <input
                  type="date"
                  value={expiresOn}
                  onChange={(e) => setExpiresOn(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-muted">
                  Erinnerung
                </span>
                <select
                  value={warnMonths}
                  onChange={(e) => setWarnMonths(Number(e.target.value))}
                  className="mt-1 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
                >
                  {warnOptions.map((o) => (
                    <option key={o.months} value={o.months}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={submitDoc}
                disabled={
                  !expiresOn || (docType === "sonstiges" && !title.trim())
                }
                className="w-full rounded-2xl bg-green px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                Speichern
              </button>
            </div>
          ) : null}

          <div className="space-y-2">
            {sortedDocs.length === 0 ? (
              <p className="text-sm text-muted">Noch keine Fristen.</p>
            ) : (
              sortedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-line bg-white/80 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-ink">
                      {doc.docType === "sonstiges"
                        ? doc.title
                        : docTypeLabel[doc.docType]}{" "}
                      · {doc.person}
                    </p>
                    <p className="mt-0.5 text-sm text-muted">
                      Ablauf{" "}
                      {new Date(doc.expiresOn).toLocaleDateString("de-DE", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-save">{doc.warnLabel}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDocument(doc.id)}
                    className="shrink-0 text-xs font-semibold text-muted underline"
                  >
                    Löschen
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </AppShell>
  );
}
