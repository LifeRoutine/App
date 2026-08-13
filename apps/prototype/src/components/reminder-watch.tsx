"use client";

import { useEffect } from "react";
import { useApp } from "@/lib/app-context";
import {
  maybeNotifyReminders,
  persistReminderSchedule,
  remindersEnabled,
} from "@/lib/reminders";

/** Beim Öffnen erinnern und den Plan für später in den Service Worker legen. */
export function ReminderWatch() {
  const { ready, authenticated, isGuest, state } = useApp();

  useEffect(() => {
    if (!ready || (!authenticated && !isGuest)) return;
    void maybeNotifyReminders(state);
    // einmal nach dem Öffnen — nicht bei jedem Tippen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authenticated, isGuest]);

  useEffect(() => {
    if (!ready || (!authenticated && !isGuest)) return;
    if (!remindersEnabled()) return;
    void persistReminderSchedule(state);
    // nur Plan/Fristen — nicht bei jedem Listen-Tipp
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authenticated, isGuest, state.events, state.documents]);

  return null;
}
