import { Redis } from "@upstash/redis";
import { promises as fs } from "fs";
import path from "path";
import { getDemoAccounts } from "@/lib/server/demo-accounts";

export type DemoActivityRow = {
  username: string;
  displayName: string;
  householdId: string;
  /** ISO — fehlt = noch nie angemeldet / geöffnet */
  lastActiveAt: string | null;
};

function redisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function activityKey(householdId: string): string {
  return `liferoutine:activity:${householdId}`;
}

function localActivityPath(householdId: string): string {
  return path.join(
    process.cwd(),
    ".data",
    `activity-${householdId}.txt`,
  );
}

function memoryMap(): Map<string, string> {
  const g = globalThis as typeof globalThis & {
    __lrDemoActivity?: Map<string, string>;
  };
  if (!g.__lrDemoActivity) g.__lrDemoActivity = new Map();
  return g.__lrDemoActivity;
}

/** Merkt: dieser Haushalt war gerade in der App. */
export async function touchDemoActivity(householdId: string): Promise<void> {
  const iso = new Date().toISOString();
  const redis = redisClient();
  if (redis) {
    await redis.set(activityKey(householdId), iso);
    return;
  }
  if (process.env.VERCEL) {
    memoryMap().set(householdId, iso);
    return;
  }
  try {
    const dir = path.dirname(localActivityPath(householdId));
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(localActivityPath(householdId), iso, "utf8");
  } catch {
    memoryMap().set(householdId, iso);
  }
}

async function readActivity(householdId: string): Promise<string | null> {
  const redis = redisClient();
  if (redis) {
    const raw = await redis.get<string>(activityKey(householdId));
    return typeof raw === "string" && raw ? raw : null;
  }
  if (process.env.VERCEL) {
    return memoryMap().get(householdId) ?? null;
  }
  try {
    const raw = await fs.readFile(localActivityPath(householdId), "utf8");
    return raw.trim() || null;
  } catch {
    return memoryMap().get(householdId) ?? null;
  }
}

/** Alle Demo-Zugänge inkl. Zuletzt-aktiv (ohne Passwörter). */
export async function listDemoActivity(): Promise<DemoActivityRow[]> {
  const rows: DemoActivityRow[] = [];
  for (const a of getDemoAccounts()) {
    rows.push({
      username: a.username,
      displayName: a.displayName,
      householdId: a.householdId,
      lastActiveAt: await readActivity(a.householdId),
    });
  }
  return rows;
}
