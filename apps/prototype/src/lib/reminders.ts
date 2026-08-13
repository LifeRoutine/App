import { addDaysISO, eventsOnDate, localDateISO } from "@/lib/plan-dates";
import type { AppState } from "@/lib/types";
import { classifyWasteBin, wasteBinLabel } from "@/lib/waste-bins";

const ON_KEY = "liferoutine.remind.on.v1";
const SHOWN_KEY = "liferoutine.remind.shown.v1";
const TIME_KEY = "liferoutine.remind.time.v1";
const DEFAULT_TIME = "07:00";

export type ReminderLine = {
  id: string;
  title: string;
  body: string;
};

export function remindersEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ON_KEY) === "1";
  } catch {
    return false;
  }
}

export function setRemindersEnabled(on: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (on) window.localStorage.setItem(ON_KEY, "1");
    else {
      window.localStorage.removeItem(ON_KEY);
      void caches.delete("lr-remind-v1");
    }
  } catch {
    /* ignore */
  }
}

/** Uhrzeit HH:MM — ab dann der Tages-Hinweis (Standard 07:00). */
export function reminderTime(): string {
  if (typeof window === "undefined") return DEFAULT_TIME;
  try {
    const raw = window.localStorage.getItem(TIME_KEY);
    if (raw && /^\d{2}:\d{2}$/.test(raw)) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_TIME;
}

export function setReminderTime(hhmm: string) {
  if (typeof window === "undefined") return;
  const m = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return;
  const h = Math.min(23, Math.max(0, Number(m[1])));
  const min = Math.min(59, Math.max(0, Number(m[2])));
  const value = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  try {
    window.localStorage.setItem(TIME_KEY, value);
  } catch {
    /* ignore */
  }
}

function atLocal(iso: string, hhmm: string): number {
  return new Date(`${iso}T${hhmm}:00`).getTime();
}

function alreadyShownToday(today: string): boolean {
  try {
    return window.localStorage.getItem(SHOWN_KEY) === today;
  } catch {
    return false;
  }
}

function markShown(today: string) {
  try {
    window.localStorage.setItem(SHOWN_KEY, today);
  } catch {
    /* ignore */
  }
}

function wasteLine(title: string, source?: string, wasteBin?: AppState["events"][number]["wasteBin"]) {
  const bin =
    wasteBin ?? (source === "ics" ? classifyWasteBin(title) : null);
  return bin ? wasteBinLabel[bin] : title;
}

/** Heute + morgen: Müll, Termine, Fristen. */
export function collectReminderLines(
  state: AppState,
  today = localDateISO(),
): ReminderLine[] {
  const lines: ReminderLine[] = [];
  const tomorrow = addDaysISO(today, 1);

  for (const ev of eventsOnDate(state.events, today, today)) {
    if (ev.source === "ics" || ev.wasteBin) {
      lines.push({
        id: `w-${ev.id}`,
        title: "Heute Müll",
        body: `${wasteLine(ev.title, ev.source, ev.wasteBin)} rausstellen.`,
      });
    } else if (ev.source === "vacation") {
      lines.push({
        id: `v-${ev.id}`,
        title: "Heute Urlaub",
        body: ev.title,
      });
    } else if (ev.source === "schoolcal") {
      lines.push({
        id: `sc-${ev.id}`,
        title: "Heute Schule",
        body: ev.title,
      });
    } else if (ev.source !== "school") {
      const time = ev.time && ev.time !== "00:00" ? `${ev.time} ` : "";
      lines.push({
        id: `e-${ev.id}`,
        title: "Heute Termin",
        body: `${time}${ev.title}`,
      });
    }
  }

  for (const ev of eventsOnDate(state.events, tomorrow, today)) {
    if (ev.source === "ics" || ev.wasteBin) {
      lines.push({
        id: `wt-${ev.id}`,
        title: "Morgen Müll",
        body: `${wasteLine(ev.title, ev.source, ev.wasteBin)} nicht vergessen.`,
      });
    }
  }

  for (const doc of state.documents) {
    const d = new Date(`${doc.expiresOn}T12:00:00`);
    const warn = new Date(d);
    warn.setMonth(warn.getMonth() - doc.warnMonths);
    const warnIso = `${warn.getFullYear()}-${String(warn.getMonth() + 1).padStart(2, "0")}-${String(warn.getDate()).padStart(2, "0")}`;
    if (today >= warnIso && today <= doc.expiresOn) {
      lines.push({
        id: `d-${doc.id}`,
        title: "Frist",
        body: `${doc.title} läuft bald ab.`,
      });
    }
  }

  return lines.slice(0, 4);
}

const SCHEDULE_CACHE = "lr-remind-v1";
const SCHEDULE_URL = "/lr-remind-schedule.json";

type ScheduledNote = {
  id: string;
  at: number;
  title: string;
  body: string;
};

/** Nächste Tage in den Service Worker legen — damit ein Hinweis auch ohne offene App kommen kann (Android/PWA). */
export async function persistReminderSchedule(state: AppState): Promise<void> {
  if (typeof window === "undefined") return;
  if (!remindersEnabled() || !("caches" in window)) return;
  const today = localDateISO();
  const time = reminderTime();
  const now = Date.now();
  const items: ScheduledNote[] = [];
  for (let i = 0; i < 7; i++) {
    const iso = addDaysISO(today, i);
    const lines = collectReminderLines(state, iso);
    if (lines.length === 0) continue;
    let at = atLocal(iso, time);
    // Heute schon nach der Uhrzeit → sofort (beim Öffnen)
    if (i === 0 && at < now) at = now;
    items.push({
      id: iso,
      at,
      title: "LifeRoutine",
      body: lines.map((l) => `${l.title}: ${l.body}`).join("\n"),
    });
  }
  try {
    const cache = await caches.open(SCHEDULE_CACHE);
    await cache.put(
      SCHEDULE_URL,
      new Response(
        JSON.stringify({
          items,
          shownId: alreadyShownToday(today) ? today : null,
        }),
        { headers: { "Content-Type": "application/json" } },
      ),
    );
  } catch {
    /* ignore */
  }
}

export async function registerBackgroundReminders(): Promise<"ok" | "limited"> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return "limited";
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    const periodic = (
      reg as ServiceWorkerRegistration & {
        periodicSync?: {
          register: (tag: string, opts: { minInterval: number }) => Promise<void>;
        };
      }
    ).periodicSync;
    if (periodic) {
      await periodic.register("lr-remind", { minInterval: 60 * 60 * 1000 });
      return "ok";
    }
  } catch {
    /* Browser erlaubt kein periodicsync (typisch iOS) */
  }
  return "limited";
}

export async function maybeNotifyReminders(
  state: AppState,
): Promise<"shown" | "skipped" | "denied" | "unsupported"> {
  if (typeof window === "undefined") return "unsupported";
  if (!("Notification" in window)) return "unsupported";
  if (!remindersEnabled()) return "skipped";
  if (Notification.permission !== "granted") return "denied";

  await persistReminderSchedule(state);
  void registerBackgroundReminders();

  const today = localDateISO();
  if (alreadyShownToday(today)) return "skipped";

  // Noch vor der gewählten Uhrzeit → nur planen, nicht jetzt zeigen
  if (Date.now() < atLocal(today, reminderTime())) return "skipped";

  const lines = collectReminderLines(state, today);
  if (lines.length === 0) {
    markShown(today);
    return "skipped";
  }

  const body = lines.map((l) => `${l.title}: ${l.body}`).join("\n");
  try {
    const reg = await navigator.serviceWorker?.ready.catch(() => null);
    if (reg?.showNotification) {
      await reg.showNotification("LifeRoutine", {
        body,
        icon: "/icons/icon-192.png",
        tag: `lr-${today}`,
      });
    } else {
      new Notification("LifeRoutine", { body, icon: "/icons/icon-192.png" });
    }
    markShown(today);
    await persistReminderSchedule(state);
    return "shown";
  } catch {
    return "skipped";
  }
}

export async function requestReminderPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}
