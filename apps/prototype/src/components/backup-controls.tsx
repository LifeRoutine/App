"use client";

import { useRef, useState } from "react";
import { useApp } from "@/lib/app-context";
import { downloadBackupJson, readBackupFile } from "@/lib/backup";

export function BackupControls() {
  const { state, importBackup } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function exportNow() {
    setError(null);
    downloadBackupJson(state);
    setMessage("Backup heruntergeladen.");
    window.setTimeout(() => setMessage(null), 3000);
  }

  async function onFile(file: File | undefined) {
    setError(null);
    setMessage(null);
    if (!file) return;
    if (
      !window.confirm(
        "Import ersetzt den aktuellen Stand auf diesem Gerät. Fortfahren?",
      )
    ) {
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    const result = await readBackupFile(file);
    if (!result.ok) {
      setError(result.error);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    importBackup(result.state);
    const when = result.exportedAt
      ? ` (Export ${new Date(result.exportedAt).toLocaleString("de-DE")})`
      : "";
    setMessage(`Import erfolgreich${when}.`);
    if (inputRef.current) inputRef.current.value = "";
    window.setTimeout(() => setMessage(null), 4000);
  }

  return (
    <section className="rounded-2xl border border-line bg-white/80 px-4 py-4">
      <h2 className="font-display text-lg font-semibold text-ink">
        Backup (JSON)
      </h2>
      <p className="mt-1 text-sm text-muted">
        Export speichert Liste, Vorrat, Plan &amp; Profil lokal als Datei.
        App-PIN ist nicht enthalten — die bleibt nur auf dem Gerät.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={exportNow}
          className="flex-1 rounded-2xl bg-green px-4 py-3 text-sm font-semibold text-white"
        >
          Exportieren
        </button>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex-1 rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink"
        >
          Importieren
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      {message ? (
        <p className="mt-2 text-sm font-semibold text-save">{message}</p>
      ) : null}
      {error ? (
        <p className="mt-2 text-sm font-semibold text-warn">{error}</p>
      ) : null}
    </section>
  );
}
