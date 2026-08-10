"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { useApp } from "@/lib/app-context";
import { parseShopAddIntent } from "@/lib/life-ai-parse";
import { lifeAiSuggestions } from "@/lib/mock-data";

type Reply = {
  user: string;
  assistant: string;
  action?: { label: string; href: string };
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export default function LifeAiPage() {
  const { addShopItems, toggleRoutine, state } = useApp();
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [thread, setThread] = useState<Reply[]>([
    {
      user: "",
      assistant:
        "Ich helfe bei Liste, Müll und Terminen. Schreib z. B.: „Tomaten kaufen“ oder „Müll ist erledigt“.",
    },
  ]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

  function interpret(raw: string): Reply {
    const text = raw.toLowerCase();

    if (text.includes("müll") && (text.includes("erledigt") || text.includes("fertig"))) {
      const muell = state.routines.find((r) =>
        r.title.toLowerCase().includes("müll"),
      );
      if (muell && !muell.done) toggleRoutine(muell.id);
      return {
        user: raw,
        assistant: "Müll ist als erledigt markiert.",
        action: { label: "Zuhause öffnen", href: "/zuhause" },
      };
    }

    // Demo-Vorschlag: alle drei auf einmal
    if (
      text.includes("milch") &&
      text.includes("kaffee") &&
      text.includes("waschmittel")
    ) {
      addShopItems(["Milch", "Kaffee", "Waschmittel"], { source: "ai" });
      return {
        user: raw,
        assistant:
          "Erledigt: Milch, Kaffee und Waschmittel stehen auf der Einkaufsliste (oder sind wieder aktiv).",
        action: { label: "Zur Einkaufsliste", href: "/einkauf" },
      };
    }

    const shopNames = parseShopAddIntent(raw);
    if (shopNames) {
      addShopItems(shopNames, { source: "ai" });
      const label = shopNames.join(", ");
      return {
        user: raw,
        assistant: `Erledigt: ${label} ${shopNames.length === 1 ? "steht" : "stehen"} auf der Einkaufsliste.`,
        action: { label: "Zur Einkaufsliste", href: "/einkauf" },
      };
    }

    // Einzelprodukte ohne „kaufen“-Satz
    const singles: string[] = [];
    if (/\bmilch\b/.test(text)) singles.push("Milch");
    if (/\bkaffee\b/.test(text)) singles.push("Kaffee");
    if (/\bwaschmittel\b/.test(text)) singles.push("Waschmittel");
    if (singles.length > 0) {
      addShopItems(singles, { source: "ai" });
      return {
        user: raw,
        assistant: `Erledigt: ${singles.join(", ")} auf der Einkaufsliste.`,
        action: { label: "Zur Einkaufsliste", href: "/einkauf" },
      };
    }

    if (text.includes("ausweis") || text.includes("pass") || text.includes("frist")) {
      return {
        user: raw,
        assistant:
          "Fristen (ohne Nummern) verwaltest du unter Plan → Dokumente & Fristen.",
        action: { label: "Plan öffnen", href: "/plan" },
      };
    }
    if (
      text.includes("abendessen") ||
      text.includes("essensplan") ||
      (text.includes("plane") && text.includes("essen"))
    ) {
      return {
        user: raw,
        assistant:
          "Essensplan ist unter Einkauf → Essensplan. Fehlende Zutaten kannst du direkt auf die Liste schieben.",
        action: { label: "Essensplan", href: "/einkauf/essensplan" },
      };
    }
    if (text.includes("erledigen") || /\bheute\b/.test(text)) {
      return {
        user: raw,
        assistant:
          "Schau unter Heute: Termine, offene Aufgaben und ggf. Spar-Tipps — wenige Schritte statt langer Listen.",
        action: { label: "Heute öffnen", href: "/" },
      };
    }
    return {
      user: raw,
      assistant:
        "Verstanden — z. B. „Tomaten kaufen“ oder „Müll ist erledigt“. Oder tippe ein Beispiel oben an.",
    };
  }

  function send(value?: string) {
    const text = (value ?? input).trim();
    if (!text) return;
    // Side-Effects vor setState — sonst React-Fehler (setState während Render)
    const reply = interpret(text);
    setThread((prev) => [...prev, reply]);
    setInput("");
    setVoiceError(null);
  }

  function startVoice() {
    setVoiceError(null);
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      setVoiceError(
        "Spracheingabe wird in diesem Browser nicht unterstützt. Bitte tippen oder einen Vorschlag wählen.",
      );
      return;
    }
    if (
      typeof window !== "undefined" &&
      !window.isSecureContext &&
      window.location.hostname !== "localhost"
    ) {
      setVoiceError(
        "Mikrofon braucht HTTPS oder localhost. Über die LAN-IP (http://192…) blockiert der Browser oft die Spracheingabe — bitte tippen.",
      );
      return;
    }

    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }

    const recognition = new Ctor();
    recognition.lang = "de-DE";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) {
        setInput(transcript);
        send(transcript);
      }
    };
    recognition.onerror = (event) => {
      setListening(false);
      const map: Record<string, string> = {
        "not-allowed": "Mikrofon-Zugriff verweigert — in den Browser-Einstellungen erlauben.",
        "no-speech": "Nichts gehört — bitte nochmal tippen oder sprechen.",
        "audio-capture": "Kein Mikrofon gefunden.",
        network: "Spracherkennung-Netzwerkfehler — bitte tippen.",
        aborted: "",
      };
      const msg = map[event.error] ?? `Spracheingabe fehlgeschlagen (${event.error}).`;
      if (msg) setVoiceError(msg);
    };
    recognition.onend = () => {
      setListening(false);
    };

    try {
      setListening(true);
      recognition.start();
    } catch {
      setListening(false);
      setVoiceError("Spracheingabe konnte nicht starten — bitte tippen.");
    }
  }

  return (
    <AppShell title="Helfer" subtitle="Einfach tippen, was erledigt werden soll">
      <section className="animate-rise space-y-3">
        {thread.map((msg, i) => (
          <div key={`${msg.user}-${i}`} className="space-y-2">
            {msg.user ? (
              <div className="ml-8 rounded-2xl rounded-br-md bg-navy px-4 py-3 text-sm text-white">
                {msg.user}
              </div>
            ) : null}
            <div className="mr-4 rounded-2xl rounded-bl-md border border-line bg-white/80 px-4 py-3 text-sm leading-relaxed text-ink">
              {msg.assistant}
              {msg.action ? (
                <Link
                  href={msg.action.href}
                  className="mt-3 inline-flex rounded-xl bg-mint px-3 py-2 text-xs font-semibold text-ink"
                >
                  {msg.action.label}
                </Link>
              ) : null}
            </div>
          </div>
        ))}
      </section>

      <section className="mt-5">
        <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
          Beispiele zum Antippen
        </p>
        <div className="flex flex-wrap gap-2">
          {lifeAiSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="rounded-full border border-line bg-white/70 px-3 py-1.5 text-left text-xs text-ink transition hover:bg-mint"
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      <form
        className="mt-5 flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="z. B. Tomaten kaufen…"
          className="min-h-[3.2rem] flex-1 resize-none rounded-2xl border border-line bg-white/85 px-3 py-2.5 text-sm outline-none ring-green/40 focus:ring-2"
        />
        <button
          type="button"
          aria-label={listening ? "Höre zu…" : "Sprechen"}
          aria-pressed={listening}
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-white ${
            listening ? "bg-navy mic-pulse" : "bg-green"
          }`}
          onClick={() => startVoice()}
        >
          ●
        </button>
        <button
          type="submit"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-navy text-white"
          aria-label="Senden"
        >
          →
        </button>
      </form>
      {voiceError ? (
        <p className="mt-2 text-sm font-medium text-warn">{voiceError}</p>
      ) : (
        <p className="mt-2 text-xs text-muted">
          Mikrofon-Button: sprechen. Geht nicht? Einfach tippen.
        </p>
      )}
    </AppShell>
  );
}
