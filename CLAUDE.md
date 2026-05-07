# Makej! – Kontext projektu

## Co je Makej!
Mobilní app pro jednorázové brigády – funguje jako Tinder pro práci.
Zaměstnavatel postne nabídku, brigádník swipne, po příjetí brigádníka zaměstnavatelem je systém propojí přes chat.

## Tech stack
- Next.js 14+ s TypeScriptem (App Router, static export)
- Supabase – databáze, auth, realtime chat
- Tailwind CSS
- Capacitor 5 – iOS/Android wrapper
- GitHub: github.com/Sam-hub303/makej-

## Workflow po každé změně
npm run build:mobile && npx cap sync ios

## Aktuální stav
- Capacitor integrace hotová, app běží na iOS simulátoru
- Bug: chaty se nezobrazují po obnovení Supabase projektu
- Bug: upravit profil přesměruje na login (session persistence problém)

## Důležitá rozhodnutí
- NEpřepisujeme do Vue, NEpoužíváme Cordovu
- Zůstáváme na React/Next.js + Capacitor