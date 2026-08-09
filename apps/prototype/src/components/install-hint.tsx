"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type BrowserKind = "firefox" | "chrome" | "safari" | "other";

function detectBrowser(): BrowserKind {
  const ua = navigator.userAgent;
  if (/firefox|fxios/i.test(ua)) return "firefox";
  if (/crios|chrome|edg/i.test(ua) && !/edg.*firefox/i.test(ua)) return "chrome";
  if (/safari/i.test(ua) && !/chrome|crios|android/i.test(ua)) return "safari";
  return "other";
}

export function InstallHint() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [installed, setInstalled] = useState(false);
  const [origin, setOrigin] = useState("");
  const [browser, setBrowser] = useState<BrowserKind>("other");
  const [isIos, setIsIos] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
    setBrowser(detectBrowser());
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setIsAndroid(/android/i.test(navigator.userAgent));

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    if (standalone) {
      setInstalled(true);
      return;
    }

    function onBip(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  if (installed) {
    return (
      <section
        id="installieren"
        className="rounded-2xl border border-line bg-mint/50 px-4 py-4"
      >
        <h2 className="font-display text-lg font-semibold text-ink">
          App installiert
        </h2>
        <p className="mt-1 text-sm text-muted">
          LifeRoutine läuft bereits vom Startbildschirm.
        </p>
      </section>
    );
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  return (
    <section
      id="installieren"
      className="rounded-2xl border border-dashed border-navy/25 bg-sand/50 px-4 py-4"
    >
      <h2 className="font-display text-lg font-semibold text-ink">
        App aufs Handy
      </h2>
      <p className="mt-1 text-sm text-muted">
        Ohne App Store — auf dem Startbildschirm. PC und Handy im gleichen WLAN;
        Dev-Server muss laufen.
      </p>

      {origin ? (
        <p className="mt-3 break-all rounded-xl bg-white/80 px-3 py-2 text-xs font-semibold text-ink">
          Adresse: {origin}
        </p>
      ) : null}

      {deferred ? (
        <button
          type="button"
          onClick={() => void install()}
          className="mt-3 w-full rounded-2xl bg-green px-4 py-3 text-sm font-semibold text-white"
        >
          Jetzt installieren
        </button>
      ) : null}

      {browser === "firefox" ? (
        <div className="mt-3 space-y-2 text-sm text-muted">
          <p className="font-semibold text-ink">Firefox</p>
          {isAndroid ? (
            <ol className="list-decimal space-y-2 pl-5">
              <li>Menü ⋮ (rechts oben) öffnen</li>
              <li>
                „Installieren“ oder „Zum Startbildschirm hinzufügen“ tippen
              </li>
              <li>Bestätigen — Icon erscheint auf dem Startbildschirm</li>
            </ol>
          ) : isIos ? (
            <p>
              Firefox auf dem iPhone nutzt die Safari-Engine: Teilen-Taste →
              „Zum Home-Bildschirm“.
            </p>
          ) : (
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                Adressleiste: Icon „Diese Website in einer App öffnen“ / App-Icon
                (falls sichtbar) — oder Menü ☰
              </li>
              <li>
                „Installieren“ / „App installieren“ wählen (Firefox Desktop,
                aktuelle Version)
              </li>
              <li>
                Alternativ: Lesezeichen in die Lesezeichen-Leiste — echte PWA
                geht am zuverlässigsten auf dem Handy
              </li>
            </ol>
          )}
          <p className="text-xs">
            Hinweis: Unter Firefox erscheint der große Install-Button oft nicht
            (Chrome-spezifisch) — die Menü-Schritte oben reichen. Am zuverlässigsten
            mit einer HTTPS-Adresse (online für Tester), nicht nur über die
            Heimnetz-IP.
          </p>
        </div>
      ) : (
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted">
          <li>
            <span className="font-semibold text-ink">Android (Chrome):</span>{" "}
            Menü ⋮ → „App installieren“ / „Zum Startbildschirm“.
          </li>
          <li>
            <span className="font-semibold text-ink">Firefox Android:</span>{" "}
            Menü ⋮ → „Installieren“ / „Zum Startbildschirm hinzufügen“.
          </li>
          <li>
            <span className="font-semibold text-ink">iPhone:</span> Safari oder
            Firefox → Teilen → „Zum Home-Bildschirm“.
          </li>
        </ol>
      )}
    </section>
  );
}
