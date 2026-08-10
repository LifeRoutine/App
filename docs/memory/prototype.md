# Prototyp-Stand – LifeRoutine

Pfad: `C:\LifeRoutine\apps\prototype`  
**Demo:** `DEMO-STARTEN.bat` → http://localhost:3001

## Funktionierender Lokal-Prototyp
- Onboarding inkl. Ortssuche (OSM) + GPS
- Heute: €/Min-Nutzen, Verbund-Insights, Warum, Link Einstellungen
- Einkauf: Liste · Märkte · Vorräte · Essen · Katalog · Angebote-Stub
- Liste: Tippen/Barcode, Angebot markieren (Prospekt), Route, Extraweg, privat/geteilt, Erledigt → Vorrat
- Märkte: OSM/Overpass + **Online-Prospekt-Links** je Kette; Fallback nur Nominatim-belegt
- Vorräte: unter Mindestvorrat + Kaufen-Angebot → „Nachkaufen lohnt“
- Katalog: wächst mit Nutzung (Haushalt), Einträge löschbar
- Barcode: Katalog → OFF → manuell merken (primär auf der Liste)
- Haushalt: Mitglieder, Einladungs-Code, Beitritt-Demo (`/haushalt`)
- Zuhause: Routinen + neue hinzufügen
- Plan: Kalender mit Wochenübersicht, Termine inkl. **Wiederholung dauerhaft** (bis Serie beendet), Fristen CRUD
- LifeAI: Phrasen wie „Tomaten kaufen“ → Liste; Regel-Assistent
- Einstellungen: Name, Typ, Ort + **JSON-Backup**, **PWA-Install**, **App-PIN**, Links Haushalt/Märkte/Angebote/Katalog/Datenschutz
- Datenschutz-Seite: was lokal liegt, Backup-Hinweis, PIN, Löschen
- Heute: Wetter als **Demo** gekennzeichnet
- PWA: `/manifest.webmanifest`, Icons, `sw.js`, standalone
- Persistenz: `liferoutine.app.v1` (+ `liferoutine.lock.v1` für PIN); Backup-Format `liferoutine.backup` v1

## Farben
Beruhigend/harmonisch: weiches Blaugrau + Sage (`globals.css`). Bei Bedarf weiter feinjustieren.
