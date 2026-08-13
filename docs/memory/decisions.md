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

## UX-Prinzip (Stefan, 2026-08-10)
- **Alles selbst erklaerend** — Hausfrauen/Hausmaenner haben keine Zeit und Lust, sich reinzudenken.
- Kurze Alltagssprache, kein Entwickler-/Produkt-Jargon.
- Eine Handlung = klarer Button; Beispiele in Platzhaltern; wenig scrollen.

## Termin-Sichtbarkeit (nicht „Art“)
- Formular-Feld **„Wer sieht das?“** statt Art/Routine/Privat.
- Werte: `shared` = Für alle · `private` = Nur für mich · `partner` = Nur mit Partner.
- Default `kind: termin`; Sichtbarkeit ≠ Zuhause-Aufgaben.
- Partner-Filter echt erst mit Rollen/Sync; Prototyp speichert und zeigt Label.

## Informationsarchitektur (5 Bereiche)
- **Heute** · **Einkauf** · **Zuhause** · **Plan** · **Helfer** (Route /life-ai)
- LifeAI ist verbindende Schicht, kein separater Chatbot.
- **Gemini-Abgleich 2026-08-09:** „AI“ weckt LLM-Erwartung. Kurzfristig eher umbenennen (LifeAssist/Schnell-Aktionen) oder klar als Regel-Assistent labeln; echtes Freitext-LLM erst bewusst (P2).

## Sprint-Priorität (Gemini + eigene Linie)
- **P1:** Fake-Angebote raus ✓, JSON-Backup ✓, Brand — lokal echt.
- **P2:** LifeAI ehrlich / optional Freitext.
- **P3:** 3–5 Tester PWA.
- **P4:** Backend/Auth/Sync + Stripe + Partner-Feed erst nach Feedback.
- Angebote: kein Scraping; Crowdsource/OCR-Prospektfoto = optionale Stufe nach P1.

## Positionierung vs. Dæly (2026-08-10)
- Dæly = Wand-Familienkalender (Hardware). LifeRoutine = Routine-App/PWA (Software).
- Stefan: Vision weiter mit **vielen nützlichen Routine-Apps** (Schwester zu AquaRoutine), nicht Hardware-Konkurrenz.
- Von Dæly nur Software-Ideen abgucken (Person-Farben, ICS-Sync opt-in, Erinnerungen, Mehrfach-Listen, Essensplan auf Heute) — siehe backlog.

## Routinen / Müllkalender
- Stefan: Abfuhrtermine kommen aus dem **Müllkalender des Landkreis/der Kommune** — **jedes Gebiet anders**.
- **Kein Scraping** — Nutzer lädt selbst (.ics / Link / manuell).
- **ICS-Import (2026-08-10):** Plan → „Müllkalender laden“; ersetzt vorherige ICS-Termine; Tonnen-Symbole (Rest/Bio/Gelb/Papier/Elektro/…).
- Beispiel-Datei Stefan: Abfall+ `landstrasse19hechingen.ics` (Landstraße 19, Hechingen).
- Prototyp: auch manuelle Routine „Müll rausstellen“.
- **Eigener Kalender (2026-08-13):** unter Kalender laden → „Mein Kalender“; .ics-Datei oder https/webcal-Link; Quelle `personal`; ersetzt nur diesen Kalender, nicht Müll/Schule.
- **Mehrfach-Listen:** Einkauf / Baumarkt / Reise (`listId`); Angebote/Route nur auf Einkauf; Erledigt→Vorrat nur Einkauf.
- **Monatsbalken:** Urlaub/Ferien/Mehrtages als farbige Balken, nicht nur Punkt.
- **Erinnerungen:** Plan im Service Worker; Periodic Sync wo möglich; iPhone ehrlich nur bei offener App.



## Einkaufs-Loop
- Abgehakte Liste → **„Erledigt → Vorrat“** übernimmt Produkte in den Vorrat (Status ok).
- Quellen an Listenpositionen: Tipp / Scan / Vorrat / Essensplan / LifeAI.

## Datenschutz (Prototyp)
- **Demo-Login (2026-08-10):** zwei getrennte Haushalte `irena` / `saskia` (Passwörter per Env). Stand serverseitig (Upstash Redis; lokal `.data/`). Cookie-Session.
- Zusätzlich Browser-Cache `localStorage` (`liferoutine.app.v1`); PIN lokal.
- **Keine Werbung / keine Werbeprofile** (Produktprinzip).
- **Keine Ausweis-/Kartennummern**; Fristen nur Metadaten.
- Beleg-OCR im Browser; externe Calls nur bei Nutzung (Nominatim, Overpass, Open Food Facts).
- UI: `/datenschutz` + Link in Einstellungen; Abmelden unter Einstellungen.
- **App-PIN (optional):** SHA-256+Salt in `liferoutine.lock.v1`; Session-Unlock; Re-Lock nach ~1 Min. Hintergrund. Geräte-Schutz, kein Ersatz für Demo-Login.
- **PWA:** Manifest + Service Worker; installierbar aufs Home-Bildschirm (Android-Prompt / iOS Teilen).
- Spätere echte Sync/Sharing nur opt-in.

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
- **Zielbild (Stefan, 2026-08-10):** strukturierte Angebotsdaten auf **eigenem Server** (Produktname, Preis, Markt, Gültigkeit) — App konsumiert Feed, kein Foto-OCR als Dauerlösung.
- Weg dorthin: erst Link + selbst markieren → optional lokales Prospektfoto → **Partner-/Aggregator-Feed** (selektiv anschreiben, nicht Massen-Scraping) → dann „Prospekte bei uns“.
- Foto-OCR nur als Zwischenbrücke; Crowdsource nur opt-in + rechtlich geprüft.
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
