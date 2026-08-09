"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useApp } from "@/lib/app-context";
import { docTypeLabel } from "@/lib/mock-data";
import type { DocumentType } from "@/lib/types";

const dayNames = ["Heute", "Morgen", "Übermorgen"];
const docTypes = Object.keys(docTypeLabel) as DocumentType[];
const warnOptions = [
  { months: 1, label: "4 Wochen vorher" },
  { months: 3, label: "3 Monate vorher" },
  { months: 6, label: "6 Monate vorher" },
];

export default function PlanPage() {
  const { state, addDocument, removeDocument } = useApp();
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState<DocumentType>("personalausweis");
  const [person, setPerson] = useState(state.members[0]?.name ?? "Ich");
  const [personId, setPersonId] = useState<string | undefined>(
    state.members[0]?.id,
  );
  const [expiresOn, setExpiresOn] = useState("");
  const [warnMonths, setWarnMonths] = useState(6);

  const sortedDocs = useMemo(
    () =>
      [...state.documents].sort((a, b) =>
        a.expiresOn.localeCompare(b.expiresOn),
      ),
    [state.documents],
  );

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

  return (
    <AppShell title="Plan" subtitle="Termine · Fristen · Überblick">
      {[0, 1, 2].map((offset) => {
        const events = state.events
          .filter((e) => e.dayOffset === offset)
          .sort((a, b) => a.time.localeCompare(b.time));
        return (
          <section key={offset} className="mb-5">
            <h2 className="font-display text-lg font-semibold text-ink">
              {dayNames[offset] ?? `Tag +${offset}`}
            </h2>
            <div className="mt-2 space-y-2">
              {events.length === 0 ? (
                <p className="text-sm text-muted">Nichts geplant.</p>
              ) : (
                events.map((ev) => (
                  <article
                    key={ev.id}
                    className="rounded-2xl border border-line bg-white/80 px-4 py-3"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-semibold text-ink">{ev.title}</h3>
                      <span className="text-sm text-muted">{ev.time}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted">{ev.detail}</p>
                    <p className="mt-1 text-[0.7rem] font-semibold tracking-wide text-green uppercase">
                      {ev.kind}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>
        );
      })}

      <section className="rounded-2xl border border-line bg-white/80 px-4 py-4">
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
