import { createHmac, timingSafeEqual } from "crypto";
import type { DemoAccount } from "@/lib/server/demo-accounts";

export type DemoSession = {
  username: string;
  householdId: string;
  displayName: string;
};

const COOKIE = "lr_demo_session";

function secret(): string {
  return (
    process.env.DEMO_SESSION_SECRET ||
    process.env.DEMO_PASS_A ||
    "liferoutine-demo-session-dev"
  );
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function encodeSession(account: DemoAccount): string {
  const body = Buffer.from(
    JSON.stringify({
      username: account.username,
      householdId: account.householdId,
      displayName: account.displayName,
    } satisfies DemoSession),
    "utf8",
  ).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function decodeSession(token: string | undefined): DemoSession | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const raw = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as DemoSession;
    if (!raw.username || !raw.householdId || !raw.displayName) return null;
    return raw;
  } catch {
    return null;
  }
}

export function sessionCookieHeader(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 60}${secure}`;
}

export function clearSessionCookieHeader(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export function readSessionCookie(
  cookieHeader: string | null,
): DemoSession | null {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`));
  if (!match) return null;
  return decodeSession(match.slice(COOKIE.length + 1));
}

export { COOKIE as DEMO_SESSION_COOKIE };
