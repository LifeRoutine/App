import { NextResponse } from "next/server";
import {
  loadHouseholdState,
  isServerStoreConfigured,
} from "@/lib/server/demo-store";
import { readSessionCookie } from "@/lib/server/demo-session";

export async function GET(req: Request) {
  const session = readSessionCookie(req.headers.get("cookie"));
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }
  const { state, store } = await loadHouseholdState(
    session.householdId,
    session.displayName,
  );
  return NextResponse.json({
    authenticated: true,
    user: {
      username: session.username,
      displayName: session.displayName,
      householdId: session.householdId,
    },
    state,
    store,
    serverStore: isServerStoreConfigured() ? "redis" : store,
  });
}
