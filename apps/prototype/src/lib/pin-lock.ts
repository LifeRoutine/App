const LOCK_KEY = "liferoutine.lock.v1";
const UNLOCK_KEY = "liferoutine.unlocked";

export type PinLockState = {
  enabled: boolean;
  salt: string;
  hash: string;
};

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toHex(bytes.buffer);
}

async function hashPin(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(digest);
}

export function loadPinLock(): PinLockState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PinLockState;
    if (!parsed?.enabled || !parsed.salt || !parsed.hash) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isPinEnabled(): boolean {
  return loadPinLock()?.enabled === true;
}

export async function setPin(pin: string): Promise<void> {
  const trimmed = pin.trim();
  if (!/^\d{4,8}$/.test(trimmed)) {
    throw new Error("PIN muss 4–8 Ziffern haben.");
  }
  const salt = randomSalt();
  const hash = await hashPin(trimmed, salt);
  const state: PinLockState = { enabled: true, salt, hash };
  window.localStorage.setItem(LOCK_KEY, JSON.stringify(state));
  markUnlocked();
}

export function clearPin(): void {
  window.localStorage.removeItem(LOCK_KEY);
  markUnlocked();
}

export async function verifyPin(pin: string): Promise<boolean> {
  const lock = loadPinLock();
  if (!lock) return true;
  const hash = await hashPin(pin.trim(), lock.salt);
  return hash === lock.hash;
}

export function isUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(UNLOCK_KEY) === "1";
}

export function markUnlocked(): void {
  window.sessionStorage.setItem(UNLOCK_KEY, "1");
}

export function markLocked(): void {
  window.sessionStorage.removeItem(UNLOCK_KEY);
}
