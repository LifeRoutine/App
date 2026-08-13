import { demoWasteEvents } from "@/data/demo-waste-events";
import { createDefaultState } from "@/lib/mock-data";
import { ensureNamesInCatalog } from "@/lib/catalog-memory";
import { normalizePantryItem } from "@/lib/pantry";
import { localDateISO, normalizePlanEvent } from "@/lib/plan-dates";
import type { AppState } from "@/lib/types";

export const BACKUP_FORMAT = "liferoutine.backup" as const;
export const BACKUP_VERSION = 1 as const;

export type LifeRoutineBackup = {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  /** App-Stand (kein PIN-Hash — der bleibt lokal am Gerät). */
  state: AppState;
};

export function hydrateAppState(raw: unknown): AppState {
  const fallback = createDefaultState();
  if (!raw || typeof raw !== "object") return fallback;
  const parsed = raw as Partial<AppState>;
  if (!parsed.profile || typeof parsed.profile !== "object") return fallback;
  const next: AppState = {
    ...fallback,
    ...parsed,
    profile: {
      ...fallback.profile,
      ...parsed.profile,
      inviteCode: parsed.profile.inviteCode || fallback.profile.inviteCode,
    },
    members: parsed.members ?? fallback.members,
    shoppingList: (parsed.shoppingList ?? fallback.shoppingList).map((i) => ({
      ...i,
      listId:
        i.listId === "baumarkt" || i.listId === "reise" ? i.listId : "einkauf",
    })),
    routines: parsed.routines ?? fallback.routines,
    events: (parsed.events ?? fallback.events).map((e) =>
      normalizePlanEvent(e, localDateISO()),
    ),
    documents: parsed.documents ?? fallback.documents,
    pantry: (parsed.pantry ?? fallback.pantry).map((p) => normalizePantryItem(p)),
    mealPlan: parsed.mealPlan ?? fallback.mealPlan,
    userCatalog: parsed.userCatalog ?? fallback.userCatalog,
    discoveredStores: parsed.discoveredStores ?? fallback.discoveredStores,
  };

  // Bestehende Listen-/Vorratsnamen in den Katalog übernehmen (Auswahl ohne Tippen)
  const seedNames = [
    ...next.shoppingList.map((i) => i.name),
    ...next.pantry.map((p) => p.name),
  ];
  const hasWasteIcs = next.events.some((e) => e.source === "ics");
  const events = hasWasteIcs
    ? next.events
    : [
        ...next.events,
        ...demoWasteEvents.map((e) => normalizePlanEvent(e, localDateISO())),
      ];
  return {
    ...next,
    events,
    userCatalog: ensureNamesInCatalog(next.userCatalog, seedNames),
  };
}

export function buildBackup(state: AppState): LifeRoutineBackup {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    state,
  };
}

export function backupToJson(state: AppState): string {
  return `${JSON.stringify(buildBackup(state), null, 2)}\n`;
}

export function backupFilename(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `liferoutine-backup-${y}-${m}-${d}.json`;
}

export type ParseBackupResult =
  | { ok: true; state: AppState; exportedAt?: string }
  | { ok: false; error: string };

/** Akzeptiert Backup-Envelope oder rohen AppState (ältere/manuelle Exporte). */
export function parseBackupJson(text: string): ParseBackupResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "Datei ist kein gültiges JSON." };
  }
  if (!data || typeof data !== "object") {
    return { ok: false, error: "Ungültige Backup-Struktur." };
  }
  const obj = data as Record<string, unknown>;

  if (obj.format === BACKUP_FORMAT) {
    if (obj.version !== BACKUP_VERSION) {
      return {
        ok: false,
        error: `Unbekannte Backup-Version (${String(obj.version)}).`,
      };
    }
    if (!obj.state || typeof obj.state !== "object") {
      return { ok: false, error: "Backup enthält keinen App-Stand." };
    }
    const state = hydrateAppState(obj.state);
    if (!state.profile) {
      return { ok: false, error: "Backup ohne Profil — Import abgebrochen." };
    }
    return {
      ok: true,
      state,
      exportedAt:
        typeof obj.exportedAt === "string" ? obj.exportedAt : undefined,
    };
  }

  // Roher AppState (z. B. direkt aus localStorage kopiert)
  if ("profile" in obj && obj.profile && typeof obj.profile === "object") {
    return { ok: true, state: hydrateAppState(obj) };
  }

  return {
    ok: false,
    error: "Keine LifeRoutine-Backup-Datei erkannt.",
  };
}

export function downloadBackupJson(state: AppState): void {
  const blob = new Blob([backupToJson(state)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = backupFilename();
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function readBackupFile(file: File): Promise<ParseBackupResult> {
  const text = await file.text();
  return parseBackupJson(text);
}
