# Prototyp-Stand – LifeRoutine

Pfad: `C:\LifeRoutine\apps\prototype`  
**Demo:** `DEMO-STARTEN.bat` → http://localhost:3001

## Funktionierender Lokal-Prototyp
- Onboarding inkl. Ortssuche (OSM) + GPS
- Heute: Tagespunkte (Müll inkl. morgen, Frist, Urlaub, knapper Vorrat, Liste) + **Was gibt’s heute?** + Schnellaktionen „Knappes / Fehlendes auf Liste“
- Einkauf: **drei Listen** · Hinweis bei knappem Vorrat · Kurzlinks Vorräte/Essen/Märkte
- Vorräte: Knappes zuerst · „Auf die Liste“ / schon auf Liste · Bulk-Button
- Haushalt: Mitglieder, Einladungs-Code, Beitritt-Demo (`/haushalt`)
- Zuhause: Routinen + neue hinzufügen
- Plan: Kalender mit **Monatsbalken**, Termine, **Müllkalender .ics**, **Schulferien**, **Schulkalender Kind**, **eigener Kalender** (.ics/Link), **Urlaub pro Person**, Fristen, Sichtbarkeit, Wiederholung
- Helfer (`/life-ai`): Phrasen wie „Tomaten kaufen“ → Liste; Alltagssprache
- Einstellungen: Name, Typ, Ort + **Sicherungskopie**, **PWA-Install**, **App-PIN**, Links Haushalt/Märkte/Angebote/Katalog/Datenschutz
- Datenschutz-Seite: was lokal liegt, Sicherungskopie, PIN, Löschen
- UX: Labels alltagstauglich (kein Stub/JSON/Art-Jargon in der Haupt-UI)
- Heute: Wetter als **Demo** gekennzeichnet
- PWA: `/manifest.webmanifest`, Icons, `sw.js`, standalone
- Persistenz: Demo-Login → Server (Redis/`.data`); Cache `liferoutine.app.v1` (+ PIN `liferoutine.lock.v1`); Backup-Format `liferoutine.backup` v1
- Demo-Zugänge: `irena` / `saskia` (siehe `docs/Deploy-Tester.md`, `.env.example`)
- Müllkalender: ICS unter Plan → + Termin; Demo Hechingen Landstraße 19 vorbefüllt

## Farben
Beruhigend/harmonisch: weiches Blaugrau + Sage (`globals.css`). Bei Bedarf weiter feinjustieren.
