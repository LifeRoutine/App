# Backlog – LifeRoutine

Stand: 2026-08-09 · inkl. Abgleich Gemini-Empfehlungen

## P1 — Sofort (App fühlt sich echt an)
- [x] Fake-/Demo-Angebote aus dem Default-Frischstart entfernen (Ersparnis nur user/partner)
- [x] JSON-Export/Import (Backup, lokal zuerst als USP)
- [ ] Branding/Farben finalisieren (Stefan)
- [x] Wetter klar als Demo kennzeichnen oder live
- [x] Märkte-Fallback nur Nominatim-belegt; keine erfundenen Öffnungszeiten

## P2 — Usability Helfer
- [x] Nav/UI: „Helfer“ statt LifeAI; Alltagssprache
- [ ] Option B später: gezielter Freitext → Liste/Aufgaben/Termine (API oder lokal)
- [x] Bis dahin: keine LLM-Erwartung in der UI versprechen
- [x] Termine: „Wer sieht das?“ (Für alle / Nur für mich / Nur mit Partner) statt Art/Routine/Privat
- [x] Listen-Namen im Hintergrund merken + antippen (Barcode optional — mit Testern klären)
- [ ] Spracheingabe: im Web/PWA oft wackelig (Browser/iOS); **echte App später** mit nativer Mic-API — Stefan ok damit
- [ ] Kassenzettel-Foto/OCR: schwierig am Handy — nochmal testen; Hinweis in UI
- [x] Schulferien nach Bundesland (ferien-api.de)
- [x] Urlaub pro Person farblich im Plan
- [x] Heute: echte Tagespunkte (Müll, Frist, Urlaub, Liste, Essen) statt €/Min
- [x] Erinnerungen (beim Öffnen der App; ehrlich: kein Hintergrund-Wecker)
- [x] Plan: drei Aktionen Termin · Urlaub · Kalender laden

## P3 — Validierung
- [x] Online-Deploy (Vercel) für Tester — Anleitung: `docs/Deploy-Tester.md` (Repo `LifeRoutine/App`, Root `apps/prototype`)
- [x] Demo-Login + getrennte Haushalte Irena/Saskia + Server-Persistenz (Upstash)
- [ ] **Upstash Redis** auf Vercel setzen (sonst kein dauerhafter Stand)
- [ ] PWA auf 3–5 Test-Handys, ~2 Wochen Alltagseinkauf
- [ ] Feedback sammeln (Einkauf/Vorrat/Heute)

## P4 — Growth (erst nach positivem Feedback)
- [ ] Echtes Backend/Auth (über Demo-Login hinaus) + Haushalt-Sync
- [ ] Stripe-Abo
- [ ] Partner-Angebotsfeed (Aggregator/Kette), OfferProvider `partner`

## Angebote ohne teure API (Zwischenwege)
- [x] Prospekt verlinken + selbst markieren
- [ ] Optional später: Prospekt-/Preisschild-Foto → OCR lokal (Brücke, nicht Ziel)
- [ ] Favoriten-Produkte → Direktlink Prospekt des gewählten Marktes
- [ ] **Ziel:** strukturierte Prospekt-/Angebotsdaten auf eigenem Server (Partner-Feed); Ketten selektiv anschreiben, kein Scraping
- [x] Müll: Nutzer lädt selbst (.ics) → Plan mit Tonnen-Symbolen (Abfall+/Kommunen)

## USP schärfen
- [ ] Stärker: Vorrat/Mindestvorrat ↔ Routinen/Fristen automatisch verknüpfen (nicht nur Liste)
- [ ] Müll: Landkreis-/Kommunen-Kalender anbinden (pro Region anders; ICS/Link/manuell — kein Scraping, nichts erfinden)
- [ ] Schwesterlogik AquaRoutine später, nicht Blocker für P1

## Inspiration Dæly (nur Software-Ideen, kein Wandgerät) — 2026-08-10
Abgeguckt von daely-shop.com; LifeRoutine bleibt App/PWA-Routine, kein Hardware-Konkurrent.
- [x] **Person-Farbe überall:** Termine + Zuhause-Routinen („Wer?“ / „Wer macht’s?“) — Urlaub schon zuvor
- [ ] **Kalender-Import (opt-in):** eigene .ics / Google-/Apple-Link vom Nutzer — wie Müllkalender, nichts scrapen
- [x] **Erinnerungen:** Push/PWA-Notification vor Termin/Routine/Frist (einfach, alltagssprachlich)
- [ ] **Mehrere Listen:** nicht nur eine Einkaufsliste (z. B. Baumarkt, Reise) — klar getrennt
- [x] **Essensplan sichtbarer:** Woche auf einen Blick + „Was gibt’s heute?“ auf Heute
- [ ] Später optional: kinderleichtes Abhaken / Punkte — nur wenn Tester Familien mit Kindern priorisieren
- **Nicht übernehmen:** Wand-Display, Bilderrahmen-Modus, Geräte-Montage, Hardware-Preis

## Produkt / sonstig
- [ ] Marken- und Domainprüfung finalisieren
- [ ] Preismodell mit Nutzenkommunikation testen
- [ ] Sync-Alternativen später: QR/WLAN, WebDAV/Drive (opt-in)

## Später / Vision
- [ ] Barcode/Händler-APIs, Beleg-Layouts, Preisverlauf
- [ ] Autopilot Stufe 4, Kinder-Modus, Smart Home, Mobilität
