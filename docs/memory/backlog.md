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

## P3 — Validierung
- [x] Online-Deploy (Vercel) für Tester — Anleitung: `docs/Deploy-Tester.md` (Repo `LifeRoutine/App`, Root `apps/prototype`)
- [ ] PWA auf 3–5 Test-Handys, ~2 Wochen Alltagseinkauf
- [ ] Feedback sammeln (Einkauf/Vorrat/Heute)

## P4 — Growth (erst nach positivem Feedback)
- [ ] Backend (z. B. Supabase/Firebase) + Auth + Haushalt-Sync
- [ ] Stripe-Abo
- [ ] Partner-Angebotsfeed (Aggregator/Kette), OfferProvider `partner`

## Angebote ohne teure API (Zwischenwege)
- [x] Prospekt verlinken + selbst markieren
- [ ] Optional später: Prospekt-/Preisschild-Foto → OCR → Angebot (crowdsourced, opt-in Teilen)
- [ ] Favoriten-Produkte → Direktlink Prospekt des gewählten Marktes

## USP schärfen
- [ ] Stärker: Vorrat/Mindestvorrat ↔ Routinen/Fristen automatisch verknüpfen (nicht nur Liste)
- [ ] Müll: Landkreis-/Kommunen-Kalender anbinden (pro Region anders; ICS/Link/manuell — kein Scraping, nichts erfinden)
- [ ] Schwesterlogik AquaRoutine später, nicht Blocker für P1

## Produkt / sonstig
- [ ] Marken- und Domainprüfung finalisieren
- [ ] Preismodell mit Nutzenkommunikation testen
- [ ] Sync-Alternativen später: QR/WLAN, WebDAV/Drive (opt-in)

## Später / Vision
- [ ] Barcode/Händler-APIs, Beleg-Layouts, Preisverlauf
- [ ] Autopilot Stufe 4, Kinder-Modus, Smart Home, Mobilität
