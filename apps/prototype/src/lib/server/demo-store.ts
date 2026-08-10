import { Redis } from "@upstash/redis";
import { promises as fs } from "fs";
import path from "path";
import { hydrateAppState } from "@/lib/backup";
import { seedDemoHouseholdState } from "@/lib/server/demo-accounts";
import type { AppState } from "@/lib/types";

type StoreKind = "redis" | "local" | "memory";

function redisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function keyFor(householdId: string): string {
  return `liferoutine:household:${householdId}`;
}

function localPath(householdId: string): string {
  return path.join(process.cwd(), ".data", `household-${householdId}.json`);
}

function memoryMap(): Map<string, AppState> {
  const g = globalThis as typeof globalThis & {
    __lrDemoStore?: Map<string, AppState>;
  };
  if (!g.__lrDemoStore) g.__lrDemoStore = new Map();
  return g.__lrDemoStore;
}

export function isServerStoreConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

async function readLocal(householdId: string): Promise<AppState | null> {
  try {
    const raw = await fs.readFile(localPath(householdId), "utf8");
    return hydrateAppState(JSON.parse(raw));
  } catch {
    return null;
  }
}

async function writeLocal(householdId: string, state: AppState): Promise<void> {
  const dir = path.dirname(localPath(householdId));
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(localPath(householdId), JSON.stringify(state), "utf8");
}

/** Lädt Haushalt; fehlt → Seed (Hechingen + Müll) und speichern. */
export async function loadHouseholdState(
  householdId: string,
  displayName: string,
): Promise<{ state: AppState; store: StoreKind }> {
  const redis = redisClient();
  if (redis) {
    const raw = await redis.get<AppState | string>(keyFor(householdId));
    if (raw) {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      return { state: hydrateAppState(parsed), store: "redis" };
    }
    const seeded = seedDemoHouseholdState(displayName);
    await redis.set(keyFor(householdId), seeded);
    return { state: seeded, store: "redis" };
  }

  // Vercel ohne Upstash: nur Prozess-Speicher (nicht dauerhaft) — bitte Redis setzen
  if (process.env.VERCEL) {
    const mem = memoryMap();
    const hit = mem.get(householdId);
    if (hit) return { state: hit, store: "memory" };
    const seeded = seedDemoHouseholdState(displayName);
    mem.set(householdId, seeded);
    return { state: seeded, store: "memory" };
  }

  const local = await readLocal(householdId);
  if (local) return { state: local, store: "local" };
  const seeded = seedDemoHouseholdState(displayName);
  await writeLocal(householdId, seeded);
  return { state: seeded, store: "local" };
}

export async function saveHouseholdState(
  householdId: string,
  state: AppState,
): Promise<StoreKind> {
  const redis = redisClient();
  if (redis) {
    await redis.set(keyFor(householdId), state);
    return "redis";
  }
  if (process.env.VERCEL) {
    memoryMap().set(householdId, state);
    return "memory";
  }
  await writeLocal(householdId, state);
  return "local";
}

/** Frischen Demo-Stand schreiben (Hechingen + Müll). */
export async function resetHouseholdState(
  householdId: string,
  displayName: string,
): Promise<{ state: AppState; store: StoreKind }> {
  const seeded = seedDemoHouseholdState(displayName);
  const store = await saveHouseholdState(householdId, seeded);
  return { state: seeded, store };
}
