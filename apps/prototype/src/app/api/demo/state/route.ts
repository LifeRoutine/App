import { NextResponse } from "next/server";
import { hydrateAppState } from "@/lib/backup";
import { readSessionCookie } from "@/lib/server/demo-session";
import {
  loadHouseholdState,
  saveHouseholdState,
} from "@/lib/server/demo-store";

export async function GET(req: Request) {
  const session = readSessionCookie(req.headers.get("cookie"));
  if (!session) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }
  const { state, store } = await loadHouseholdState(
    session.householdId,
    session.displayName,
  );
  return NextResponse.json({ state, store });
}

export async function PUT(req: Request) {
  const session = readSessionCookie(req.headers.get("cookie"));
  if (!session) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });
  }
  const state = hydrateAppState(
    body && typeof body === "object" && "state" in body
      ? (body as { state: unknown }).state
      : body,
  );
  // Anzeigename am Login festhalten
  state.profile.displayName = session.displayName;
  const store = await saveHouseholdState(session.householdId, state);
  return NextResponse.json({ ok: true, store });
}
