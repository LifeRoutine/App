# LifeRoutine online für Tester (Vercel)

Damit andere die App **tage-/wochenlang** testen können — ohne deinen PC und ohne WLAN zu Hause.

## Was passiert?

1. Der Prototyp wird auf **Vercel** gebaut und unter einer **HTTPS-URL** erreichbar (z. B. `https://liferoutine-xxx.vercel.app`).
2. Tester öffnen den Link im Handy-Browser (Firefox/Chrome/Safari).
3. Sie tippen **Zum Startbildschirm / Installieren** → Icon wie eine App.
4. Daten bleiben **auf ihrem Gerät** (`localStorage`). Kein gemeinsames Konto.
5. Backup: unter Einstellungen **JSON exportieren**.

Dein PC muss dafür **nicht** laufen.

---

## Voraussetzung

- Konto bei [vercel.com](https://vercel.com) (kostenlos, GitHub-Login empfohlen)
- Projekt liegt in einem **GitHub-Repo** (oder du deployest per Vercel-CLI)

Aktuell: lokal noch ohne Git-Commit — zuerst einmal committen und nach GitHub pushen.

---

## Weg A — Vercel-Website (empfohlen)

1. Code nach GitHub bringen (neues Repo `LifeRoutine`, push).
2. [vercel.com/new](https://vercel.com/new) → Repo verbinden.
3. **Root Directory** setzen auf: `apps/prototype`  
   (Einstellungen → General → Root Directory, oder im Import-Dialog „Edit“).
4. Framework: Next.js (auto). Build Command: `npm run build`. Output: Standard.
5. **Deploy** klicken.
6. Fertige URL kopieren und an Tester schicken.

Bei jedem Push auf `main`/`master` baut Vercel neu.

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

- Android Firefox: Menü ⋮ → Installieren / Zum Startbildschirm  
- Android Chrome: Menü ⋮ → App installieren  
- iPhone: Safari → Teilen → Zum Home-Bildschirm  

Kurz durchklicken: Heute, Einkauf, Vorräte, Plan, Einstellungen (Backup).  
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
