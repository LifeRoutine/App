# LifeRoutine online für Tester (Vercel)

Damit andere die App **tage-/wochenlang** testen können — ohne deinen PC.

## Demo-Zugänge (zwei getrennte Haushalte)

Beide in **Hechingen**, Daten **getrennt** auf dem Server:

| Name (Login) | Passwort (Standard) | Haushalt |
|---|---|---|
| `irena` | `IrenaDemo26` | eigener Stand |
| `saskia` | `SaskiaDemo26` | eigener Stand |

Passwörter in Vercel unter Environment Variables ändern (`DEMO_PASS_A` / `DEMO_PASS_B`). Siehe `.env.example`.

## Server-Speicherung (wichtig)

Damit der Stand **dauerhaft** bleibt (nicht nur im Handy-Browser):

1. Kostenloses [Upstash Redis](https://upstash.com) anlegen  
2. In Vercel setzen: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`  
3. Optional: `DEMO_SESSION_SECRET` (langes Zufallsgeheimnis)  
4. Neu deployen  

Ohne Upstash funktioniert Login lokal (Ordner `.data/`) bzw. auf Vercel nur kurz im Speicher — **nicht** für echte Tester.

## Was passiert?

1. Deploy auf Vercel (Root: `apps/prototype`).  
2. Tester öffnen die URL → **Anmelden** (irena oder saskia).  
3. Optional: App aufs Startbildschirm legen.  
4. Änderungen werden für den jeweiligen Haushalt gespeichert.  
5. Zusätzlich: Sicherungskopie unter Einstellungen.

---

## Voraussetzung

- Konto bei [vercel.com](https://vercel.com) (kostenlos, GitHub-Login empfohlen)
- Repo: `LifeRoutine/App`, Root Directory **`apps/prototype`**

---

## Weg A — Vercel-Website (empfohlen)

1. Repo verbinden.  
2. **Root Directory:** `apps/prototype`  
3. Env-Variablen setzen (Upstash + Demo-Passwörter).  
4. Deploy.  
5. URL an Irena / Saskia schicken.

Bei jedem Push auf `master` baut Vercel neu.


---

## Weg B — Vercel CLI (ohne UI)

Im Terminal:

```bash
cd apps/prototype
npx vercel login
npx vercel
```

Fragen beantworten; Root ist schon dieser Ordner.  
Produktion:

```bash
npx vercel --prod
```

Am Ende erscheint die HTTPS-URL.

---

## Was du Testern schreibst (Vorlage)

Betreff: LifeRoutine Test

Hallo,

bitte öffne auf dem Handy: **https://DEINE-URL.vercel.app**

Anmelden (je eigener Haushalt):
- Irena → Name `irena` / Passwort `IrenaDemo26`
- Saskia → Name `saskia` / Passwort `SaskiaDemo26`

- Android Firefox: Menü ⋮ → Installieren / Zum Startbildschirm  
- Android Chrome: Menü ⋮ → App installieren  
- iPhone: Safari → Teilen → Zum Home-Bildschirm  

Kurz durchklicken: Heute, Einkauf, Vorräte, Plan (Müll), Einstellungen.  
Feedback gern als Stichpunkte (was nervt / fehlt / unklar).

Danke!

---

## Hinweise

- **Kein Store**, keine echte Native-App — PWA mit HTTPS ist für den Test völlig ok.
- OSM/Nominatim/Overpass laufen vom Vercel-Server (API-Routen) — Nutzungsregeln der Anbieter beachten, nicht massenhaft scrapen.
- PIN und Backup sind lokal pro Gerät.
- Preis/Brand noch Prototyp — Testern klar sagen: Demo.

---

## Lokal weiterentwickeln

Weiterhin: `DEMO-STARTEN.bat` → http://localhost:3001  
Online-Tester sehen erst Änderungen nach dem nächsten Deploy/Push.
