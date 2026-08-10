import { NextResponse } from "next/server";
import { findDemoAccount } from "@/lib/server/demo-accounts";
import {
  encodeSession,
  sessionCookieHeader,
} from "@/lib/server/demo-session";
import { loadHouseholdState } from "@/lib/server/demo-store";

export async function POST(req: Request) {
  let body: { username?: string; password?: string };
  try {
    body = (await req.json()) as { username?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const account = findDemoAccount(body.username ?? "", body.password ?? "");
  if (!account) {
    return NextResponse.json(
      { error: "Name oder Passwort stimmt nicht." },
      { status: 401 },
    );
  }

  const { state, store } = await loadHouseholdState(
    account.householdId,
    account.displayName,
  );
  const token = encodeSession(account);

  const res = NextResponse.json({
    ok: true,
    user: {
      username: account.username,
      displayName: account.displayName,
      householdId: account.householdId,
    },
    state,
    store,
  });
  res.headers.set("Set-Cookie", sessionCookieHeader(token));
  return res;
}
