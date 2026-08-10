"use client";

import { useRef, useState } from "react";
import {
  createDemoReceiptLines,
  recognizeReceiptImage,
  type ReceiptLine,
} from "@/lib/receipt";

type Props = {
  title?: string;
  onConfirm: (lines: { name: string; qty: string }[]) => void;
};

export function ReceiptCapture({
  title = "Beleg fotografieren",
  onConfirm,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lines, setLines] = useState<ReceiptLine[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [rawPreview, setRawPreview] = useState<string | null>(null);

  function reset() {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    fileRef.current = null;
    setPreview(null);
    setLines(null);
    setBusy(false);
    setProgress(0);
    setMessage(null);
    setRawPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onFile(file: File | undefined) {
    if (!file) return;
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    fileRef.current = file;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setLines(null);
    setRawPreview(null);
    setMessage("Beleg geladen — jetzt auswerten (OCR, Deutsch).");
  }

  async function analyze() {
    if (!preview && !fileRef.current) {
      setMessage("Zuerst Foto aufnehmen oder Datei wählen.");
      return;
    }

    setBusy(true);
    setProgress(0);
    setLines(null);
    setMessage("OCR startet — erster Lauf kann etwas dauern…");

    try {
      const source = fileRef.current ?? preview!;
      const { text, lines: parsed } = await recognizeReceiptImage(
        source,
        setProgress,
      );
      setRawPreview(text.slice(0, 400));

      if (parsed.length > 0) {
        setLines(parsed);
        setMessage(
          `${parsed.length} Position(en) erkannt — prüfen und übernehmen.`,
        );
      } else {
        setLines(createDemoReceiptLines());
        setMessage(
          "OCR hat keine klaren Produktzeilen gefunden (Licht/Schärfe?). Demo-Positionen zum Weiterprobieren — oder schärferes Foto.",
        );
      }
    } catch (e) {
      setLines(createDemoReceiptLines());
      setMessage(
        `OCR-Fehler (${e instanceof Error ? e.message : "unbekannt"}) — Demo-Positionen geladen.`,
      );
    } finally {
      setBusy(false);
      setProgress(0);
    }
  }

  function toggle(id: string) {
    setLines((prev) =>
      prev
        ? prev.map((l) => (l.id === id ? { ...l, selected: !l.selected } : l))
        : prev,
    );
  }

  function confirm() {
    if (!lines) return;
    const picked = lines
      .filter((l) => l.selected)
      .map((l) => ({ name: l.name, qty: l.qty }));
    if (picked.length === 0) {
      setMessage("Mindestens eine Position wählen.");
      return;
    }
    onConfirm(picked);
    setMessage(`${picked.length} Position(en) → Vorrat.`);
    setLines(null);
  }

  return (
    <div className="rounded-2xl border border-line bg-white/80 px-4 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-display text-base font-semibold text-ink">{title}</p>
          <p className="text-[0.65rem] text-muted">
            Foto → Text lesen (OCR). Am Handy oft schwierig (Licht/Schärfe) —
            wir testen das noch. Notfalls Positionen tippen.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            if (open) reset();
          }}
          className="text-xs font-semibold text-save"
        >
          {open ? "Schließen" : "Erweitern"}
        </button>
      </div>

      {!open ? (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            window.setTimeout(() => inputRef.current?.click(), 50);
          }}
          className="mt-2 rounded-xl bg-navy px-3 py-2 text-xs font-semibold text-white"
        >
          Beleg fotografieren
        </button>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-muted">
            Gut lesbares Foto (gerade, hell). Du bestätigst die Positionen, bevor
            etwas gespeichert wird.
          </p>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="block w-full text-xs text-muted file:mr-3 file:rounded-xl file:border-0 file:bg-mint file:px-3 file:py-2 file:text-xs file:font-semibold file:text-ink"
            onChange={(e) => onFile(e.target.files?.[0])}
          />

          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Beleg-Vorschau"
              className="max-h-48 w-full rounded-xl object-contain bg-sand"
            />
          ) : null}

          {busy ? (
            <div className="rounded-xl bg-mint/60 px-3 py-2 text-xs text-ink">
              OCR läuft… {progress > 0 ? `${progress} %` : "Modell wird geladen"}
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full bg-green transition-all"
                  style={{ width: `${Math.max(progress, 5)}%` }}
                />
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || !preview}
              onClick={() => void analyze()}
              className="rounded-xl bg-green px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Liest…" : "Beleg auswerten"}
            </button>
            {preview || lines ? (
              <button
                type="button"
                onClick={reset}
                disabled={busy}
                className="rounded-xl border border-line px-3 py-2 text-xs font-semibold text-muted disabled:opacity-50"
              >
                Zurücksetzen
              </button>
            ) : null}
          </div>

          {rawPreview && !busy ? (
            <details className="text-xs text-muted">
              <summary className="cursor-pointer font-semibold text-ink">
                Roher OCR-Text
              </summary>
              <pre className="mt-1 max-h-28 overflow-auto whitespace-pre-wrap rounded-lg bg-sand p-2">
                {rawPreview}
              </pre>
            </details>
          ) : null}

          {lines ? (
            <div className="space-y-2 rounded-xl border border-line bg-sand/50 p-3">
              <p className="text-xs font-semibold text-ink">
                Erkannte Positionen — abwählen was nicht passt
              </p>
              {lines.map((l) => (
                <label
                  key={l.id}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={l.selected}
                    onChange={() => toggle(l.id)}
                    className="accent-green"
                  />
                  <span className="flex-1 text-ink">
                    {l.name}
                    <span className="text-muted"> · {l.qty}</span>
                  </span>
                  {l.price ? (
                    <span className="text-xs text-muted">{l.price}</span>
                  ) : null}
                </label>
              ))}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => confirm()}
                  className="rounded-xl bg-green px-3 py-2 text-xs font-semibold text-white"
                >
                  In Vorrat übernehmen
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {message ? (
        <p className="mt-2 text-xs font-semibold text-save">{message}</p>
      ) : null}
    </div>
  );
}
