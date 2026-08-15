import { NextResponse } from "next/server";
import { listDemoActivity } from "@/lib/server/demo-activity";
import { readSessionCookie } from "@/lib/server/demo-session";

/** Nur für angemeldete Demo-Nutzer — wer war zuletzt in der App. */
export async function GET(req: Request) {
  const session = readSessionCookie(req.headers.get("cookie"));
  if (!session) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }
  const activity = await listDemoActivity();
  return NextResponse.json({ activity });
}
