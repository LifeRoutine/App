"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CatalogProduct } from "@/lib/barcode-catalog";
import { filterCatalogNames } from "@/lib/catalog-memory";
import { useApp } from "@/lib/app-context";

type Props = {
  title?: string;
  onProduct: (product: CatalogProduct & { source: "scan" | "manual" }) => void;
};

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<{ rawValue: string }[]>;
};

async function lookupRemote(code: string): Promise<CatalogProduct | null> {
  const res = await fetch(`/api/barcode?code=${encodeURIComponent(code)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("lookup failed");
  const data = (await res.json()) as { product?: CatalogProduct | null };
  return data.product ?? null;
}

export function ProductCapture({ title = "Produkt erfassen", onProduct }: Props) {
  const { state, lookupUserCatalog, teachCatalog } = useApp();
  const [scanOpen, setScanOpen] = useState(false);
  const [name, setName] = useState("");
  const [ean, setEan] = useState("");
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  const suggestions = useMemo(
    () => filterCatalogNames(state.userCatalog, name, 8),
    [state.userCatalog, name],
  );

  function stopCamera() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }

  useEffect(() => () => stopCamera(), []);

  function acceptProduct(
    product: CatalogProduct,
    source: "scan" | "manual",
    learnSource: "user" | "openfoodfacts" | "demo",
  ) {
    if (product.barcode) {
      teachCatalog({
        barcode: product.barcode,
        name: product.name,
        qty: product.qty,
        source: learnSource,
      });
    }
    onProduct({ ...product, source });
  }

  function pickKnown(knownName: string) {
    onProduct({ barcode: "", name: knownName, qty: "1×", source: "manual" });
    setName("");
    setMessage(`„${knownName}“ hinzugefügt`);
  }

  async function resolveAndAdd(code: string) {
    const normalized = code.replace(/\s/g, "");
    setLookingUp(true);
    setMessage(`Code ${normalized} wird nachgeschlagen…`);
    try {
      const learned = lookupUserCatalog(normalized);
      if (learned) {
        acceptProduct(
          { barcode: learned.barcode, name: learned.name, qty: learned.qty },
          "scan",
          learned.source === "list" ? "user" : learned.source,
        );
        setMessage(`Aus deinem Katalog: ${learned.name}`);
        setEan("");
        setPendingCode(null);
        return;
      }

      const hit = await lookupRemote(normalized);
      if (!hit) {
        setPendingCode(normalized);
        setScanOpen(true);
        setMessage(
          `Unbekannt (${normalized}). Name tippen — speichern wir fürs nächste Mal.`,
        );
        return;
      }
      acceptProduct(hit, "scan", "openfoodfacts");
      setMessage(`Erkannt: ${hit.name} · gemerkt fürs nächste Mal`);
      setEan("");
      setPendingCode(null);
    } catch {
      setPendingCode(normalized);
      setScanOpen(true);
      setMessage("Nachschlagen fehlgeschlagen — Name tippen und merken.");
    } finally {
      setLookingUp(false);
    }
  }

  function submitName(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    if (pendingCode) {
      acceptProduct(
        { barcode: pendingCode, name: trimmed, qty: "1×" },
        "manual",
        "user",
      );
      setMessage(`Gemerkt: ${trimmed}`);
      setPendingCode(null);
      setName("");
      setEan("");
      return;
    }

    onProduct({ barcode: "", name: trimmed, qty: "1×", source: "manual" });
    setName("");
    setMessage(`„${trimmed}“ hinzugefügt · wird fürs nächste Mal gemerkt`);
  }

  function submitEan(e: React.FormEvent) {
    e.preventDefault();
    void resolveAndAdd(ean.trim());
  }

  async function startCameraScan() {
    setMessage(null);
    const Detector = (
      window as unknown as {
        BarcodeDetector?: new (opts: {
          formats: string[];
        }) => BarcodeDetectorLike;
      }
    ).BarcodeDetector;

    if (!Detector) {
      setMessage(
        "Kamera-Barcode hier nicht unterstützt — Code tippen oder Demo-Scan.",
      );
      setScanOpen(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setScanning(true);
      setScanOpen(true);
      await new Promise((r) => window.setTimeout(r, 50));
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const detector = new Detector({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
      });

      timerRef.current = window.setInterval(async () => {
        const video = videoRef.current;
        if (!video || video.readyState < 2 || lookingUp) return;
        try {
          const codes = await detector.detect(video);
          const raw = codes[0]?.rawValue;
          if (!raw) return;
          stopCamera();
          await resolveAndAdd(raw);
        } catch {
          /* skip */
        }
      }, 700);
    } catch {
      setMessage("Kamerazugriff nicht möglich — Code tippen oder Demo-Scan.");
      stopCamera();
      setScanOpen(true);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-white/80 px-4 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-display text-base font-semibold text-ink">{title}</p>
          <p className="text-[0.65rem] text-muted">
            {state.userCatalog.length > 0
              ? `${state.userCatalog.length} bekannte Produkte — antippen oder tippen`
              : "Name tippen — wird automatisch gemerkt"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setScanOpen((v) => !v);
            if (scanOpen) stopCamera();
          }}
          className="text-xs font-semibold text-save"
        >
          {scanOpen ? "Barcode zu" : "Barcode"}
        </button>
      </div>

      <form onSubmit={submitName} className="mt-3 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={
            pendingCode ? "Name für diesen Code…" : "z. B. Hafermilch"
          }
          className="flex-1 rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none ring-green/30 focus:ring-2"
          autoComplete="off"
        />
        <button
          type="submit"
          className="rounded-xl bg-green px-3 py-2 text-xs font-semibold text-white"
        >
          {pendingCode ? "Merken" : "OK"}
        </button>
      </form>

      {pendingCode ? (
        <div className="mt-2 rounded-xl border border-warn/30 bg-warn/10 px-3 py-2 text-xs text-ink">
          Code <strong>{pendingCode}</strong> unbekannt — Name eingeben und
          speichern.
        </div>
      ) : null}

      {suggestions.length > 0 ? (
        <div className="mt-2">
          <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted">
            {name.trim() ? "Treffer" : "Bekannt — antippen"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => pickKnown(s)}
                className="rounded-full border border-line bg-sand/80 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-mint"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {scanOpen ? (
        <div className="mt-3 space-y-3 border-t border-line pt-3">
          <form onSubmit={submitEan} className="flex gap-2">
            <input
              value={ean}
              onChange={(e) => setEan(e.target.value)}
              placeholder="Barcode tippen"
              inputMode="numeric"
              className="flex-1 rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none ring-green/30 focus:ring-2"
            />
            <button
              type="submit"
              disabled={lookingUp}
              className="rounded-xl bg-navy px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              {lookingUp ? "…" : "OK"}
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void startCameraScan()}
              className="rounded-xl bg-green px-3 py-2 text-xs font-semibold text-white"
            >
              Kamera starten
            </button>
            <button
              type="button"
              onClick={() => void resolveAndAdd("4008400402623")}
              className="rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink"
            >
              Demo-Scan
            </button>
            {scanning ? (
              <button
                type="button"
                onClick={stopCamera}
                className="rounded-xl border border-line px-3 py-2 text-xs font-semibold text-warn"
              >
                Scan stoppen
              </button>
            ) : null}
          </div>

          {scanning ? (
            <video
              ref={videoRef}
              muted
              playsInline
              className="h-40 w-full rounded-xl object-cover"
            />
          ) : null}
        </div>
      ) : null}

      {message ? (
        <p className="mt-2 text-xs font-semibold text-save">{message}</p>
      ) : null}
    </div>
  );
}
