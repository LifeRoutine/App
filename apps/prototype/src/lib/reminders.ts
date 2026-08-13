import { addDaysISO, eventsOnDate, localDateISO } from "@/lib/plan-dates";
import type { AppState } from "@/lib/types";
import { classifyWasteBin, wasteBinLabel } from "@/lib/waste-bins";

const ON_KEY = "liferoutine.remind.on.v1";
const SHOWN_KEY = "liferoutine.remind.shown.v1";

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
    else window.localStorage.removeItem(ON_KEY);
  } catch {
    /* ignore */
  }
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

export async function maybeNotifyReminders(
  state: AppState,
): Promise<"shown" | "skipped" | "denied" | "unsupported"> {
  if (typeof window === "undefined") return "unsupported";
  if (!("Notification" in window)) return "unsupported";
  if (!remindersEnabled()) return "skipped";
  if (Notification.permission !== "granted") return "denied";

  const today = localDateISO();
  if (alreadyShownToday(today)) return "skipped";

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
