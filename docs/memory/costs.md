# Kosten & Preisdeckung – LifeRoutine

Stand: 2026-08-13 · Preise der Anbieter können sich ändern — Quellen prüfen.

Ziel (Stefan): **eigene Kosten decken**, günstig bleiben (vs. Dæly „kein Monatsabo“).

## Was ihr heute wirklich braucht

| Posten | Jetzt (Tester / Prototyp) | Später (echtes Produkt) |
|--------|---------------------------|-------------------------|
| **Vercel** Hosting | Hobby oft **0 €** (persönlich/klein) | Bei kommerziell: Pro ca. **~20 $/Monat** (+ Nutzung) |
| **Upstash Redis** | Free: **0 €** (256 MB, 500k Commands/Monat) — reicht für Demo Irena/Saskia | Bei Wachstum: Pay-as-you-go oder Fixed ab ca. **10 $/Monat** |
| **Domain** (optional) | ohne eigene Domain: 0 € | ca. **10–15 €/Jahr** |
| **Wetter (Open-Meteo)** | Free + Attribution, **nur nicht-kommerziell** | Commercial Plan (Stand Recherche: ca. **~19 €/Monat**) oder selbst hosten |
| **Stripe** (erst bei Plus) | 0 € | Gebühren pro Zahlung (typ. ~1,5 % + Fix) — erst wenn Geld fließt |
| **App Stores** | PWA: 0 € | Native später: Apple/Google Entwicklergebühren |

**Heute realistisch: ~0 €/Monat**, solange Free-Tiers + nicht-kommerzieller Test.

## Szenarien (grobe Monatskosten)

### A — Tester-Phase (jetzt)
- Vercel Hobby + Upstash Free + kein Paid-Wetter  
→ **~0 €** — Kosten sind gedeckt.

### B — Kleiner Launch (eigene Domain, noch Free-stark)
- Domain anteilig ~1 €/Monat  
- Infra weiter Free, solange Limits reichen  
→ **~1–5 €/Monat** — mit wenigen zahlenden Nutzern oder aus der Tasche tragbar.

### C — Kommerziell + Sync + Live-Wetter
- Vercel Pro ~20 $  
- Redis Free oder ~10 $  
- Wetter Paid ~19 €  
→ **grob 40–60 €/Monat** Fixkosten-Band (je nach Kurs/Usage).

## Was das für den Plus-Preis heißt

Nicht 7,99 € „weil Konzept“, sondern:

1. **Fixkosten/Monat ÷ zahlende Nutzer** = Untergrenze pro Kopf.  
   Beispiel Szenario C: 50 € ÷ 25 Zahler ≈ **2 €/Monat** — alles darüber deckt + Puffer.
2. **Jahresabo** oft angenehmer (z. B. 15–30 €/Jahr) als teures Monatabo.
3. **Free stark** lassen — Plus nur Sync/Haushalt/Cloud, nicht den Alltag sperren.

Platzhalter aus dem Konzept (7,99 €) darf **nach unten**.

## Nächste konkrete Schritte

1. In Vercel/Upstash kurz nachschauen: seid ihr noch im Free? (echte Rechnung)
2. Wetter erst bei Launch kommerziell klären — bis dahin Demo oder Open-Meteo Free + Hinweis
3. Stripe/Plus erst nach positivem Tester-Feedback (Backlog P4)

## Später: Umzug zu Strato (Stefan, 2026-08-14)

Ja — **wenn Linux-Server mit Root**, nicht klassisches Webhosting (PHP/HTML). LifeRoutine ist Next.js (`next start`), das braucht Node rund um die Uhr.

| Was | Hinweis |
|-----|---------|
| **Paket** | Linux **V-Server / Cloud Server** (Root). Laut [strato.de/server](https://www.strato.de/server/) Einstieg ab **1 €/Monat** — konkrete Kerne/RAM und **Verlängerungspreis** vor Bestellung im Konfigurator prüfen, nichts raten. |
| **Geht nicht** | Normales Homepage-Hosting ohne Node-Prozess |
| **Stack** | Node → `next start` → PM2 (oder systemd) → Nginx + SSL |
| **Redis** | Upstash kann bleiben **oder** Redis auf demselben Server (dann weniger Fremdkosten) |
| **Deploy** | Nicht mehr „Push auf master = live“ wie Vercel — Build + Restart selbst oder kleines Skript |

**Wann umziehen:** nach Tester-Phase / vor kommerziellem Launch. Bis dahin Vercel Hobby + Upstash Free ist günstiger und weniger Pflege.

**Warum Strato später sinnvoll:** feste Monatskosten, Daten in DE/EU, Hobby-Limit von Vercel fällt weg. Dafür: Updates, Backup, SSL, Neustarts selbst.
