"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/app-context";
import {
  maybeNotifyReminders,
  remindersEnabled,
  requestReminderPermission,
  setRemindersEnabled,
} from "@/lib/reminders";

export function ReminderSettings() {
  const { state } = useApp();
  const [on, setOn] = useState(false);
  const [perm, setPerm] = useState<string>("default");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setOn(remindersEnabled());
    if (typeof Notification !== "undefined") {
      setPerm(Notification.permission);
    } else {
      setPerm("unsupported");
    }
  }, []);

  async function enable() {
    setMsg(null);
    const p = await requestReminderPermission();
    setPerm(p);
    if (p !== "granted") {
      setMsg(
        p === "unsupported"
          ? "Dieses Gerät zeigt keine Hinweise."
          : "Hinweise wurden nicht erlaubt — in den Handy-Einstellungen nachschauen.",
      );
      return;
    }
    setRemindersEnabled(true);
    setOn(true);
    const result = await maybeNotifyReminders(state);
    setMsg(
      result === "shown"
        ? "An — heutige Hinweise kommen, wenn die App offen ist."
        : "An. Heute nichts Offenes, oder schon erinnert.",
    );
  }

  function disable() {
    setRemindersEnabled(false);
    setOn(false);
    setMsg("Aus.");
  }

  return (
    <section className="rounded-2xl border border-line bg-white/80 px-4 py-4">
      <h2 className="font-display text-lg font-semibold text-ink">
        Erinnerungen
      </h2>
      <p className="mt-1 text-sm text-muted">
        Sagt Bescheid bei Müll, Terminen und Fristen. Funktioniert, wenn du die
        App öffnest — kein Wecker im Hintergrund (das kommt später in der
        Handy-App).
      </p>
      <p className="mt-2 text-xs font-semibold text-save">
        Status: {on && perm === "granted" ? "an" : "aus"}
      </p>
      {on && perm === "granted" ? (
        <button
          type="button"
          onClick={disable}
          className="mt-3 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink"
        >
          Erinnerungen aus
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void enable()}
          className="mt-3 w-full rounded-2xl bg-green px-4 py-3 text-sm font-semibold text-white"
        >
          Erinnerungen an
        </button>
      )}
      {msg ? (
        <p className="mt-2 text-xs font-semibold text-save">{msg}</p>
      ) : null}
    </section>
  );
}
