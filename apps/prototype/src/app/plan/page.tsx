"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useApp } from "@/lib/app-context";
import { docTypeLabel } from "@/lib/mock-data";
import {
  addDaysISO,
  eventDateISO,
  eventKindLabel,
  formatDayHeading,
  localDateISO,
} from "@/lib/plan-dates";
import type { DocumentType, PlanEvent } from "@/lib/types";

const docTypes = Object.keys(docTypeLabel) as DocumentType[];
const warnOptions = [
  { months: 1, label: "4 Wochen vorher" },
  { months: 3, label: "3 Monate vorher" },
  { months: 6, label: "6 Monate vorher" },
];
const kindOptions: PlanEvent["kind"][] = ["termin", "routine", "essen", "privat"];

function monthMatrix(year: number, monthIndex: number): (string | null)[][] {
  const first = new Date(year, monthIndex, 1);
  const startPad = (first.getDay() + 6) % 7; // Mo=0
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = localDateISO(new Date(year, monthIndex, d));
    cells.push(iso);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

export default function PlanPage() {
  const { state, addDocument, removeDocument, addEvent, removeEvent } = useApp();
  const today = localDateISO();
  const [cursor, setCursor] = useState(() => {
    const [y, m] = today.split("-").map(Number);
    return { year: y, month: m - 1 };
  });
  const [selected, setSelected] = useState(today);

  const [evTitle, setEvTitle] = useState("");
  const [evTime, setEvTime] = useState("18:00");
  const [evKind, setEvKind] = useState<PlanEvent["kind"]>("termin");
  const [evDetail, setEvDetail] = useState("");

  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState<DocumentType>("personalausweis");
  const [person, setPerson] = useState(state.members[0]?.name ?? "Ich");
  const [personId, setPersonId] = useState<string | undefined>(
    state.members[0]?.id,
  );
  const [expiresOn, setExpiresOn] = useState("");
  const [warnMonths, setWarnMonths] = useState(6);

  const datesWithEvents = useMemo(() => {
    const set = new Set<string>();
    for (const e of state.events) set.add(eventDateISO(e, today));
    return set;
  }, [state.events, today]);

  const dayEvents = useMemo(
    () =>
      state.events
        .filter((e) => eventDateISO(e, today) === selected)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [state.events, selected, today],
  );

  const upcoming = useMemo(() => {
    return [...state.events]
      .map((e) => ({ e, date: eventDateISO(e, today) }))
      .filter((x) => x.date >= today)
      .sort((a, b) => {
        const d = a.date.localeCompare(b.date);
        return d !== 0 ? d : a.e.time.localeCompare(b.e.time);
      })
      .slice(0, 12);
  }, [state.events, today]);

  const matrix = monthMatrix(cursor.year, cursor.month);
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(
    "de-DE",
    { month: "long", year: "numeric" },
  );

  function shiftMonth(delta: number) {
    const d = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  }

  function submitEvent() {
    if (!evTitle.trim()) return;
    addEvent({
      title: evTitle,
      date: selected,
      time: evTime,
      kind: evKind,
      detail: evDetail,
    });
    setEvTitle("");
    setEvDetail("");
  }

  function submitDoc() {
    if (!expiresOn) return;
    addDocument({
      title: title.trim() || docTypeLabel[docType],
      docType,
      person,
      personId,
      expiresOn,
      warnMonths,
    });
    setTitle("");
    setExpiresOn("");
  }

  const sortedDocs = useMemo(
    () =>
      [...state.documents].sort((a, b) =>
        a.expiresOn.localeCompare(b.expiresOn),
      ),
    [state.documents],
  );

  return (
    <AppShell title="Plan" subtitle="Kalender · Termine · Fristen">
      <section className="rounded-2xl border border-line bg-white/80 px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="rounded-xl border border-line px-3 py-1.5 text-sm font-semibold text-ink"
          >
            ←
          </button>
          <h2 className="font-display text-lg font-semibold capitalize text-ink">
            {monthLabel}
          </h2>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="rounded-xl border border-line px-3 py-1.5 text-sm font-semibold text-ink"
          >
            →
          </button>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[0.65rem] font-semibold uppercase tracking-wide text-muted">
          {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {matrix.flat().map((iso, idx) => {
            if (!iso) return <div key={`e-${idx}`} className="aspect-square" />;
            const isToday = iso === today;
            const isSelected = iso === selected;
            const hasEv = datesWithEvents.has(iso);
            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelected(iso)}
                className={`aspect-square rounded-xl text-sm font-semibold transition ${
                  isSelected
                    ? "bg-green text-white"
                    : isToday
                      ? "bg-mint text-save"
                      : "bg-sand/40 text-ink hover:bg-sand"
                }`}
              >
                <span className="block leading-none">
                  {Number(iso.slice(8))}
                </span>
                {hasEv ? (
                  <span
                    className={`mt-0.5 inline-block h-1 w-1 rounded-full ${
                      isSelected ? "bg-white" : "bg-green"
                    }`}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => {
            setSelected(today);
            const [y, m] = today.split("-").map(Number);
            setCursor({ year: y, month: m - 1 });
          }}
          className="mt-3 text-xs font-semibold text-muted underline"
        >
          Heute ({today.split("-").reverse().join(".")})
        </button>
      </section>

      <section className="mt-4">
        <h2 className="font-display text-lg font-semibold text-ink">
          {formatDayHeading(selected, today)}
        </h2>
        <p className="text-xs text-muted">
          {new Date(`${selected}T12:00:00`).toLocaleDateString("de-DE", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <div className="mt-2 space-y-2">
          {dayEvents.length === 0 ? (
            <p className="text-sm text-muted">Keine Termine an diesem Tag.</p>
          ) : (
            dayEvents.map((ev) => (
              <article
                key={ev.id}
                className="rounded-2xl border border-line bg-white/80 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-semibold text-ink">{ev.title}</h3>
                      <span className="shrink-0 text-sm text-muted">{ev.time}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted">{ev.detail}</p>
                    <p className="mt-1 text-[0.7rem] font-semibold tracking-wide text-green uppercase">
                      {eventKindLabel[ev.kind]}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeEvent(ev.id)}
                    className="shrink-0 text-xs font-semibold text-muted underline"
                  >
                    Löschen
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-white/80 px-4 py-4">
        <h2 className="font-display text-lg font-semibold text-ink">
          Termin eintragen
        </h2>
        <p className="mt-1 text-sm text-muted">
          Für den gewählten Tag ({selected.split("-").reverse().join(".")}).
          Auch Mülltermine kannst du so manuell setzen.
        </p>
        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-muted">Titel</span>
            <input
              value={evTitle}
              onChange={(e) => setEvTitle(e.target.value)}
              placeholder="z. B. Müll rausstellen"
              className="mt-1 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none ring-green/30 focus:ring-2"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-xs font-semibold text-muted">Uhrzeit</span>
              <input
                type="time"
                value={evTime}
                onChange={(e) => setEvTime(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted">Art</span>
              <select
                value={evKind}
                onChange={(e) => setEvKind(e.target.value as PlanEvent["kind"])}
                className="mt-1 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
              >
                {kindOptions.map((k) => (
                  <option key={k} value={k}>
                    {eventKindLabel[k]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-semibold text-muted">Notiz (optional)</span>
            <input
              value={evDetail}
              onChange={(e) => setEvDetail(e.target.value)}
              placeholder="Kurznotiz"
              className="mt-1 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none ring-green/30 focus:ring-2"
            />
          </label>
          <button
            type="button"
            onClick={submitEvent}
            disabled={!evTitle.trim()}
            className="w-full rounded-2xl bg-green px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            Termin speichern
          </button>
        </div>
      </section>

      {upcoming.length > 0 ? (
        <section className="mt-4">
          <h2 className="font-display text-lg font-semibold text-ink">
            Demnächst
          </h2>
          <div className="mt-2 space-y-2">
            {upcoming.map(({ e, date }) => (
              <button
                key={e.id}
                type="button"
                onClick={() => {
                  setSelected(date);
                  const [y, m] = date.split("-").map(Number);
                  setCursor({ year: y, month: m - 1 });
                }}
                className="flex w-full items-baseline justify-between gap-2 rounded-2xl border border-line bg-white/70 px-4 py-3 text-left"
              >
                <span className="min-w-0 truncate text-sm font-semibold text-ink">
                  {e.title}
                </span>
                <span className="shrink-0 text-xs text-muted">
                  {date === today
                    ? `Heute ${e.time}`
                    : date === addDaysISO(today, 1)
                      ? `Morgen ${e.time}`
                      : `${date.split("-").reverse().join(".")} ${e.time}`}
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-5 rounded-2xl border border-line bg-white/80 px-4 py-4">
        <h2 className="font-display text-lg font-semibold text-ink">
          Dokumente & Fristen
        </h2>
        <p className="mt-1 text-sm text-muted">
          Nur Typ, Person und Ablaufdatum —{" "}
          <strong>keine Ausweis- oder Kartennummern</strong>.
        </p>
        <div className="mt-3 space-y-3">
          {sortedDocs.length === 0 ? (
            <p className="text-sm text-muted">Noch keine Fristen hinterlegt.</p>
          ) : (
            sortedDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-start justify-between gap-3 border-b border-line/70 pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-semibold text-ink">
                    {doc.title} · {doc.person}
                  </p>
                  <p className="text-xs text-muted">
                    {docTypeLabel[doc.docType]}
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
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-white/80 px-4 py-4">
        <h2 className="font-display text-lg font-semibold text-ink">
          Frist hinzufügen
        </h2>
        <p className="mt-1 text-sm text-muted">
          Keine Nummern eingeben — Erinnerungen brauchen nur das Ablaufdatum.
        </p>
        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-muted">Typ</span>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as DocumentType)}
              className="mt-1 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
            >
              {docTypes.map((t) => (
                <option key={t} value={t}>
                  {docTypeLabel[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted">Titel</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={docTypeLabel[docType]}
              className="mt-1 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none ring-green/30 focus:ring-2"
            />
          </label>
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
            <span className="text-xs font-semibold text-muted">Ablaufdatum</span>
            <input
              type="date"
              value={expiresOn}
              onChange={(e) => setExpiresOn(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted">Erinnerung</span>
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
            disabled={!expiresOn}
            className="w-full rounded-2xl bg-green px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            Speichern
          </button>
        </div>
      </section>
    </AppShell>
  );
}
