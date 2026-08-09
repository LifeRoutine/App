# Entscheidungen – LifeRoutine

Stand: 2026-08-09

## Konzeptversion
- **Maßgeblich: V1.1** (Dokumente & Fristen).
- V1.0 bleibt als Vorgänger in `docs/konzept/` archiviert.
- Dateigröße V1.0 > V1.1 trotz weniger Seiten: Export-/Bildkompression, nicht weniger Inhalt.

## Preis / Monetarisierung
- Konzept-Platzhalter: Plus **7,99 €/Monat**, Jahresabo ca. **79 €**, Free mit begrenztem Nutzen.
- **Preis ist nicht final** — Stefan: darf geändert werden; mit Nutzenkommunikation (Ersparnis/Zeit) testen.
- Keine Werbung / keine Werbeprofile als Produktprinzip.

## Positionierung
- Persönlicher Alltagsassistent für Singles, Paare, Familien, WGs (Mental Load, nicht Familienstatus).
- Nicht: Habit-Tracker, reine Familien-App, Prospekt-App.
- Schwestermarke zu AquaRoutine: Kreispfeil/Haken, Navy/Grün, „Routine“; LifeRoutine mit Haus-Symbol statt Aqua-Welle.

## Informationsarchitektur (5 Bereiche)
- **Heute** · **Einkauf** · **Zuhause** · **Plan** · **LifeAI**
- LifeAI ist verbindende Schicht, kein separater Chatbot.
- **Gemini-Abgleich 2026-08-09:** „AI“ weckt LLM-Erwartung. Kurzfristig eher umbenennen (LifeAssist/Schnell-Aktionen) oder klar als Regel-Assistent labeln; echtes Freitext-LLM erst bewusst (P2).

## Sprint-Priorität (Gemini + eigene Linie)
- **P1:** Fake-Angebote raus ✓, JSON-Backup ✓, Brand — lokal echt.
- **P2:** LifeAI ehrlich / optional Freitext.
- **P3:** 3–5 Tester PWA.
- **P4:** Backend/Auth/Sync + Stripe + Partner-Feed erst nach Feedback.
- Angebote: kein Scraping; Crowdsource/OCR-Prospektfoto = optionale Stufe nach P1.

## Hosting
- **Tester jetzt:** Vercel Hobby (kostenlos) ok — PC muss nicht laufen.
- **Business später (Stefan):** eher **Strato** (DE) als Dauer-Hosting — nicht fest verkabelt an Vercel.
- Hinweis: Next.js braucht Node (VPS/Container), kein klassisches nur-PHP-Shared-Hosting.


## Einkaufs-Loop
- Abgehakte Liste → **„Erledigt → Vorrat“** übernimmt Produkte in den Vorrat (Status ok).
- Quellen an Listenpositionen: Tipp / Scan / Vorrat / Essensplan / LifeAI.

## Datenschutz (Prototyp)
- **Lokal zuerst:** App-Stand in `localStorage` (`liferoutine.app.v1`), kein Cloud-Konto.
- **Keine Werbung / keine Werbeprofile** (Produktprinzip).
- **Keine Ausweis-/Kartennummern**; Fristen nur Metadaten.
- Beleg-OCR im Browser; externe Calls nur bei Nutzung (Nominatim, Overpass, Open Food Facts).
- UI: `/datenschutz` + Link in Einstellungen; Daten löschen = Demo zurücksetzen.
- **App-PIN (optional):** SHA-256+Salt in `liferoutine.lock.v1`; Session-Unlock; Re-Lock nach ~1 Min. Hintergrund. Geräte-Schutz, kein Server-Auth.
- **PWA:** Manifest + Service Worker; installierbar aufs Home-Bildschirm (Android-Prompt / iOS Teilen).
- Spätere Sync/Sharing nur opt-in.

## Dokumente & Fristen (V1.1)
- Nur Metadaten: **Typ, Person, Ablauf, Erinnerungsvorlauf**.
- **Keine Ausweisnummern, Passnummern, Kartennummern** — weder Abfrage noch Speicherung (auch nicht optional).
- Keine Dokument-Scans im Prototyp; später nur mit klarer Einwilligung und ohne Nummern-OCR als Pflicht.
- Vorlaufzeiten je Dokumenttyp vorschlagen; Kontext zu Reise/Haushalt verbinden.

## Demo-Kontext
- Beispiel-Standort: **Hechingen** (Fallback); Onboarding mit **Ortssuche** (Nominatim/OSM) + optional GPS.
- Koordinaten (`locationLat`/`locationLon`) werden mitgespeichert für spätere Markt-Suche.
- Wetter im Heute-Dashboard ist vorerst **Demo/Mock**, keine Live-API. Später an Standort koppeln.

## Nichts erfinden (hart)
- **Keine erfundenen** Märkte, Adressen, Angebote, Preise, Öffnungszeiten.
- Marktdaten: OSM/Nominatim oder Nutzer; Demo-Fallback nur mit belegten Einträgen (oder leer).
- Unsicher → weglassen / nachfragen, nicht raten.

## Einkauf / Märkte
- Untermenü Einkauf: **Liste** | **Märkte** | **Vorräte** | **Essen** | **Katalog** (+ Stub **Angebote**).
- Märkte: Live-Suche via **Overpass/OSM** (`/api/stores`) wenn Koordinaten gesetzt; Fallback Demo Hechingen.
- Gefundene Märkte in `discoveredStores`; Auswahl in `preferredStoreIds`.
- Angebotsdaten: Stub-Seite mit Quellen-Recherche; **keine erfundenen Preise** — nur Nutzer-Markierung oder später Partner.

## Geteilter Haushalt (Demo)
- Seite `/haushalt`: Mitglieder, Einladungs-Code, Beitritt-Simulation.
- Listenpositionen: Toggle **privat / geteilt** (localStorage, kein Cloud-Sync).

## Dokumente & Fristen
- Plan: Liste + Formular (Typ, Person, Ablauf, Erinnerungsvorlauf); löschbar.

## Angebotsdaten
- Online-Prospekte = Nutzer-Quelle; **kein heimliches Scraping**.
- Architektur: `OfferProvider` (`lib/offers/`) — Demo-Katalog **leer** (nichts erfinden); später Partner.
- Nutzer kann Angebot **selbst aus Prospekt markieren** (`source: user`).
- Prospekt **verlinken** unter Märkte.
- Vorrat: unter Mindestvorrat + Kaufen-Angebot → „Nachkaufen lohnt“.
- Status-PDF: `docs/LifeRoutine_Funktionsstand_2026-08-09.pdf`
- Märkte-Fallback: nur **Nominatim-belegte** Adressen (Hechingen/Stein); kein Netto in Hechingen; keine erfundenen Öffnungszeiten.

## Differenzierung (Nutzen)
- Heute zeigt **Geld + Zeit**, nicht nur To-dos.
- Block **„LifeRoutine verbindet“**: Termin↔Essen, Vorrat↔Plan, Gäste→Mengen/Einkauf.
- Jede Priorität hat **Warum** (Transparenz).
- Einkauf: **Kluge Route** + **„Lohnt sich der Extraweg?“**.

## Barcodes / Produktwissen
- Barcode allein = nur Nummer. **Lookup nötig** (Name, Marke, Menge).
- Lookup-Reihenfolge: **Haushaltskatalog** → Demo → **Open Food Facts** → Nutzer benennt & speichert.
- Strategie: Katalog wächst mit Nutzung (pro Haushalt); später opt-in Teilen zwischen Haushalten.
- UI: Untermenü **Katalog** unter Einkauf.
- **Alternative ohne Barcode:** Beleg fotografieren unter **Vorräte** → OCR → Positionen in den Vorrat.
