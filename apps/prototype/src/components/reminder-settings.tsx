"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/app-context";
import {
  maybeNotifyReminders,
  persistReminderSchedule,
  registerBackgroundReminders,
  reminderTime,
  remindersEnabled,
  requestReminderPermission,
  setReminderTime,
  setRemindersEnabled,
} from "@/lib/reminders";

export function ReminderSettings() {
  const { state } = useApp();
  const [on, setOn] = useState(false);
  const [perm, setPerm] = useState<string>("default");
  const [time, setTime] = useState("07:00");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setOn(remindersEnabled());
    setTime(reminderTime());
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
    const bg = await registerBackgroundReminders();
    const result = await maybeNotifyReminders(state);
    const later =
      bg === "ok"
        ? " Auf dem Handy (installierte App) kann ein Hinweis auch später kommen."
        : " Am iPhone nur, wenn die App offen ist — Apple erlaubt das im Browser nicht.";
    setMsg(
      result === "shown"
        ? `An — heutige Hinweise sind da.${later}`
        : `An. Ab ${reminderTime()} — heute noch nichts, oder schon erinnert.${later}`,
    );
  }

  function disable() {
    setRemindersEnabled(false);
    setOn(false);
    setMsg("Aus.");
  }

  async function onTimeChange(next: string) {
    setTime(next);
    setReminderTime(next);
    if (remindersEnabled()) {
      await persistReminderSchedule(state);
      setMsg(`Ab ${next} Uhr.`);
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-white/80 px-4 py-4">
      <h2 className="font-display text-lg font-semibold text-ink">
        Erinnerungen
      </h2>
      <p className="mt-1 text-sm text-muted">
        Sagt Bescheid bei Müll, Terminen und Fristen. Am zuverlässigsten, wenn
        die App auf dem Startbildschirm liegt. iPhone: nur bei geöffneter App.
      </p>
      <label className="mt-3 block">
        <span className="text-xs font-semibold text-muted">
          Ab welcher Uhrzeit?
        </span>
        <input
          type="time"
          value={time}
          onChange={(e) => void onTimeChange(e.target.value)}
          className="mt-1 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
        />
      </label>
      <p className="mt-2 text-xs font-semibold text-save">
        Status: {on && perm === "granted" ? `an · ab ${time}` : "aus"}
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
