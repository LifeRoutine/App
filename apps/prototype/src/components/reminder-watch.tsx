"use client";

import { useEffect } from "react";
import { useApp } from "@/lib/app-context";
import { maybeNotifyReminders } from "@/lib/reminders";

/** Einmal pro Tag, wenn die App geöffnet wird. */
export function ReminderWatch() {
  const { ready, authenticated, isGuest, state } = useApp();

  useEffect(() => {
    if (!ready || (!authenticated && !isGuest)) return;
    void maybeNotifyReminders(state);
    // einmal nach dem Öffnen — nicht bei jedem Tippen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authenticated, isGuest]);

  return null;
}
