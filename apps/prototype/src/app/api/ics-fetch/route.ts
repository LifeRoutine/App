import { NextResponse } from "next/server";

const MAX_BYTES = 1_500_000;

function blockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/\.$/, "");
  if (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h === "0.0.0.0" ||
    h === "::1" ||
    h === "[::1]"
  ) {
    return true;
  }
  if (h.endsWith(".internal") || h.endsWith(".local")) return true;
  if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(h)) return true;
  return false;
}

/** Öffentlichen Kalender-Link holen (Google/Apple .ics). Kein Scraping — nur was der Nutzer einfügt. */
export async function POST(req: Request) {
  let urlRaw = "";
  try {
    const body = (await req.json()) as { url?: string };
    urlRaw = (body.url ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Link fehlt." }, { status: 400 });
  }
  if (!urlRaw) {
    return NextResponse.json({ error: "Link einfügen." }, { status: 400 });
  }

  const normalized = urlRaw.replace(/^webcal:/i, "https:");
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return NextResponse.json({ error: "Kein gültiger Link." }, { status: 400 });
  }
  if (parsed.protocol !== "https:") {
    return NextResponse.json(
      { error: "Nur https-Kalenderlinks (oder webcal)." },
      { status: 400 },
    );
  }
  if (blockedHost(parsed.hostname)) {
    return NextResponse.json({ error: "Dieser Link ist nicht erlaubt." }, { status: 400 });
  }

  try {
    const res = await fetch(parsed.toString(), {
      headers: { Accept: "text/calendar, text/plain, */*" },
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Kalender unter diesem Link nicht erreichbar." },
        { status: 502 },
      );
    }
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) {
      return NextResponse.json(
        { error: "Kalender-Datei ist zu groß." },
        { status: 400 },
      );
    }
    const text = new TextDecoder("utf-8").decode(buf);
    if (!text.includes("BEGIN:VCALENDAR")) {
      return NextResponse.json(
        { error: "Unter dem Link steckt keine Kalender-Datei (.ics)." },
        { status: 400 },
      );
    }
    return NextResponse.json({ text });
  } catch {
    return NextResponse.json(
      { error: "Keine Verbindung zum Kalender-Link." },
      { status: 502 },
    );
  }
}
