"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useApp } from "@/lib/app-context";
import { MEMBER_COLORS } from "@/lib/mock-data";

const roleLabel = {
  owner: "Eigentümer",
  adult: "Erwachsener",
  child: "Kind",
} as const;

function ColorDots({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="listbox" aria-label="Farbe">
      {MEMBER_COLORS.map((c) => {
        const on = value.toLowerCase() === c.toLowerCase();
        return (
          <button
            key={c}
            type="button"
            aria-label={`Farbe ${c}`}
            aria-pressed={on}
            onClick={() => onChange(c)}
            className={`h-7 w-7 rounded-full border-2 ${
              on ? "border-ink" : "border-transparent"
            }`}
            style={{ backgroundColor: c }}
          />
        );
      })}
    </div>
  );
}

export default function HaushaltPage() {
  const {
    state,
    addMember,
    setMemberColor,
    removeMember,
    regenerateInvite,
    joinWithInvite,
    ready,
  } = useApp();
  const [name, setName] = useState("");
  const [addRole, setAddRole] = useState<"adult" | "child">("adult");
  const [addColor, setAddColor] = useState<string>(MEMBER_COLORS[0]);
  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinMsg, setJoinMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function invite() {
    if (!name.trim()) return;
    addMember(name, addRole, addColor);
    setName("");
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(state.profile.inviteCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  function tryJoin() {
    const ok = joinWithInvite(joinCode, joinName);
    setJoinMsg(
      ok
        ? "Fertig — Person ist im Haushalt (Test auf diesem Gerät)."
        : "Code stimmt nicht — bitte nochmal prüfen.",
    );
    if (ok) {
      setJoinCode("");
      setJoinName("");
    }
  }

  return (
    <AppShell title="Haushalt" subtitle="Wer gehört dazu — und wer sieht was">
      <section className="hero-heute animate-rise rounded-3xl px-5 py-5">
        <p className="text-sm text-white/90">Code zum Einladen</p>
        <p className="mt-1 font-display text-3xl font-semibold tracking-wide">
          {state.profile.inviteCode}
        </p>
        <p className="mt-2 text-sm text-white/85">
          Code an Partner schicken. Später klappt das Gerät-übergreifend — jetzt
          noch Test auf demselben Handy/Browser.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copyInvite}
            className="rounded-xl bg-white/25 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/35"
          >
            {copied ? "Kopiert" : "Code kopieren"}
          </button>
          <button
            type="button"
            disabled={!ready}
            onClick={regenerateInvite}
            className="rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25"
          >
            Neu generieren
          </button>
        </div>
      </section>

      <section className="mt-5">
        <h2 className="font-display text-lg font-semibold text-ink">
          Mitglieder
        </h2>
        <ul className="mt-3 space-y-2">
          {state.members.map((m) => (
            <li
              key={m.id}
              className="rounded-2xl border border-line bg-white/80 px-4 py-3"
              style={{ borderLeftWidth: 4, borderLeftColor: m.color }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-white"
                    style={{ background: m.color }}
                  >
                    {m.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{m.name}</p>
                    <p className="text-xs text-muted">{roleLabel[m.role]}</p>
                  </div>
                </div>
                {m.role !== "owner" ? (
                  <button
                    type="button"
                    onClick={() => removeMember(m.id)}
                    className="text-xs font-semibold text-muted underline"
                  >
                    Entfernen
                  </button>
                ) : null}
              </div>
              <div className="mt-2">
                <p className="mb-1 text-[0.65rem] font-semibold text-muted">
                  Farbe
                </p>
                <ColorDots
                  value={m.color}
                  onChange={(c) => setMemberColor(m.id, c)}
                />
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setAddRole("adult")}
            className={`rounded-xl px-3 py-2 text-xs font-semibold ${
              addRole === "adult"
                ? "bg-mint text-save"
                : "border border-line bg-white text-muted"
            }`}
          >
            Erwachsen
          </button>
          <button
            type="button"
            onClick={() => setAddRole("child")}
            className={`rounded-xl px-3 py-2 text-xs font-semibold ${
              addRole === "child"
                ? "bg-mint text-save"
                : "border border-line bg-white text-muted"
            }`}
          >
            Kind
          </button>
        </div>
        <p className="mt-3 text-[0.65rem] font-semibold text-muted">Farbe</p>
        <div className="mt-1">
          <ColorDots value={addColor} onChange={setAddColor} />
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={
              addRole === "child" ? "Name des Kindes" : "Name hinzufügen"
            }
            className="min-w-0 flex-1 rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none ring-green/30 focus:ring-2"
            onKeyDown={(e) => {
              if (e.key === "Enter") invite();
            }}
          />
          <button
            type="button"
            onClick={invite}
            className="rounded-2xl bg-green px-4 py-3 text-sm font-semibold text-white"
          >
            +
          </button>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-white/80 px-4 py-4">
        <h2 className="font-display text-lg font-semibold text-ink">
          Mit Code beitreten
        </h2>
        <p className="mt-1 text-sm text-muted">
          Test auf diesem Gerät — später auch zwischen Handys.
        </p>
        <input
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          placeholder="LR-XXXX"
          className="mt-3 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none ring-green/30 focus:ring-2"
        />
        <input
          value={joinName}
          onChange={(e) => setJoinName(e.target.value)}
          placeholder="Dein Name"
          className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none ring-green/30 focus:ring-2"
        />
        <button
          type="button"
          onClick={tryJoin}
          className="mt-3 w-full rounded-2xl bg-navy px-4 py-3 text-sm font-semibold text-white"
        >
          Beitreten
        </button>
        {joinMsg ? (
          <p className="mt-2 text-center text-sm text-muted">{joinMsg}</p>
        ) : null}
      </section>

      <section className="mt-6 rounded-2xl border border-dashed border-navy/25 bg-sand/50 px-4 py-4">
        <h2 className="font-display text-lg font-semibold text-ink">
          Wer sieht was?
        </h2>
        <p className="mt-2 text-sm text-muted">
          Auf der Einkaufsliste und bei Terminen kannst du wählen:{" "}
          <strong>Für alle</strong>, <strong>Nur für mich</strong> oder bei
          Terminen <strong>Nur mit Partner</strong>. Standard: für alle.
        </p>
      </section>
    </AppShell>
  );
}
