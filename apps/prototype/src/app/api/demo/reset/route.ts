import { NextResponse } from "next/server";
import { readSessionCookie } from "@/lib/server/demo-session";
import { resetHouseholdState } from "@/lib/server/demo-store";

export async function POST(req: Request) {
  const session = readSessionCookie(req.headers.get("cookie"));
  if (!session) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }
  const { state, store } = await resetHouseholdState(
    session.householdId,
    session.displayName,
  );
  return NextResponse.json({ ok: true, state, store });
}
