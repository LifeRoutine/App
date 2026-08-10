"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useApp } from "@/lib/app-context";

const roleLabel = {
  owner: "Eigentümer",
  adult: "Erwachsener",
  child: "Kind",
} as const;

export default function HaushaltPage() {
  const {
    state,
    addMember,
    removeMember,
    regenerateInvite,
    joinWithInvite,
    ready,
  } = useApp();
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinMsg, setJoinMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function invite() {
    if (!name.trim()) return;
    addMember(name, "adult");
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
              className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white/80 px-4 py-3"
            >
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
            </li>
          ))}
        </ul>

        <div className="mt-3 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name hinzufügen"
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
