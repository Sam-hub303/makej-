# Makej! — CLAUDE.md

Kompletní přehled projektu pro AI asistenta. Přečti celý soubor před jakoukoliv prací.

---

## Co je Makej!

Makej! je česká aplikace pro hledání práce — funguje jako "Tinder pro práci". Brigádník swipuje nabídky, zaměstnavatel přijímá/odmítá kandidáty, po matchi se otevře chat. Platforma pokrývá brigády, part-time i full-time pozice. Cílová skupina: studenti, brigádníci, lidé hledající stálou práci, gastro/eventy/sklad i jiné obory.

---

## Repozitáře

| Repo | Složka | URL |
|---|---|---|
| Mobilní app (Next.js) | `/Users/samuelpseja/cursor/makej` | github.com/Sam-hub303/makej- |
| Marketingový web | `/Users/samuelpseja/cursor/makej-web` | github.com/Sam-hub303/makej-web |

---

## Supabase

- **Projekt:** `cxegfwfbgcgpwerfbvra` (region: eu-west-1)
- **URL:** `https://cxegfwfbgcgpwerfbvra.supabase.co`
- **Anon key:** `sb_publishable_N_BIwMCTD6ZOTrtBl3juyw_CGIQ_lvh`
- **Session storage key:** `makej-auth` (sdílený mezi mobilní app i webem)

### Databázové tabulky

```
profiles      — uživatelé (worker i employer), RLS zapnuto
jobs          — inzeráty brigád, RLS zapnuto
matches       — swipe matche, status: pending/accepted/rejected
messages      — chat zprávy přes match_id
rejections    — odmítnuté inzeráty (worker swipe left)
reviews       — hodnocení po dokončené brigádě
job_views     — sledování zhlédnutí inzerátů (pro dashboard analytics)
notifications — perzistentní notifikace (přežijí refresh)
```

### Klíčové DB triggery a funkce

- **`on_auth_user_created`** → `handle_new_user()` — při registraci automaticky vytvoří `profiles` řádek (ukládá name, role, company_name z user_metadata)
- **`trg_fill_job_on_match_accepted`** → `fill_job_on_match_accepted()` — když se match změní na `accepted`, job se automaticky nastaví na `filled`
- **`delete_my_account()`** RPC — smaže účet uživatele

### RLS pravidla (důležité)

- `jobs INSERT` — jen uživatelé s `role = 'employer'`
- `matches INSERT` — jen uživatelé s `role = 'worker'`
- `messages INSERT` — jen účastníci daného matche
- `rejections INSERT` — jen uživatelé s `role = 'worker'`
- `profiles SELECT` — viditelné všem (pro zobrazení jmen v chatech)

---

## Složka `makej` — Mobilní aplikace

### Stack
- **Next.js 16** + **React 19** + **TypeScript**
- **Tailwind CSS v4** (konfigurace přes `globals.css` s `@theme inline`)
- **Supabase JS v2** pro auth + realtime + DB
- Připraveno pro **Capacitor** (iOS/Android)

### Barvy (globals.css)
```css
primary:   #292978  /* tmavě navy modrá — hlavní barva tlačítek */
accent:    #3a3a99  /* světlejší navy — konec gradientu tlačítek */
secondary: #d0d0ff  /* světle levandulová — texty, ikony */
```
**Důležité:** Tlačítka používají gradient `from-primary to-accent` (tmavě modrý). NEPOUŽÍVEJ `to-secondary` — to byl starý styl (světlý gradient), který byl záměrně odstraněn.

### Struktura souborů

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx      — přihlášení (email+heslo + Google OAuth)
│   │   └── register/page.tsx   — registrace (2 kroky: role → údaje)
│   ├── (app)/
│   │   ├── layout.tsx          — layout s BottomNav + NotificationProvider
│   │   ├── jobs/
│   │   │   ├── page.tsx        — worker: swipe UI / employer: správa inzerátů + kandidáti
│   │   │   └── new/page.tsx    — vytvoření nového inzerátu (jen employer)
│   │   ├── messages/page.tsx   — chat (worker vidí accepted matche, employer všechny)
│   │   └── profile/page.tsx    — profil, editace, nastavení, smazání účtu
│   ├── layout.tsx              — root layout s AuthProvider
│   └── page.tsx                — redirect na /jobs
├── components/
│   ├── AuthProvider.tsx        — React Context: user, profile, session, signOut, refreshProfile
│   ├── BottomNav.tsx           — spodní navigace (role-based: worker vs employer)
│   ├── JobCard.tsx             — swipovatelná karta inzerátu s drag gestures
│   ├── NotificationProvider.tsx — realtime notifikace (message/accepted/new_candidate)
│   └── NotificationPanel.tsx   — panel s notifikacemi
└── lib/
    ├── supabase.ts             — singleton Supabase klient (storageKey: 'makej-auth')
    ├── queries.ts              — všechny DB operace (getActiveJobs, createMatch, sendMessage atd.)
    ├── types.ts                — TypeScript typy (Job, Match, Message, UserProfile, Review)
    └── mock-data.ts            — mock data pro development
```

### Důležité flows

**Worker flow:**
1. Registrace jako `worker` → profil vytvořen triggerem
2. `/jobs` → swipe karty (doprava = `createMatch`, doleva = `createRejection`)
3. Po acceptu od zaměstnavatele → `onAuthStateChange` přes `NotificationProvider` pošle notifikaci
4. `/messages` → chat jen s accepted matchi

**Employer flow:**
1. Registrace jako `employer` → profil s `company_name`
2. `/jobs` → `EmployerDashboard`: seznam vlastních inzerátů + kandidáti
3. Přijetí kandidáta → `updateMatchStatus('accepted')` → trigger automaticky nastaví job na `filled`
4. Header má tlačítko **Dashboard** → otevírá `http://localhost:3333/employer/` (web dashboard)
5. Realtime subscriptions: nové matche, změny statusů, nové joby

**Auth:**
- `AuthProvider` hlídá stale session (JWT errors, paused project)
- Google OAuth redirect na `/jobs`
- Session sdílena se `makej-web` přes `localStorage['makej-auth']`

### Realtime subscriptions v app

- `NotificationProvider` — subscribuje na `messages INSERT` a `matches UPDATE` (worker: accepted event, employer: new_candidate event)
- `EmployerDashboard` (jobs/page.tsx) — subscribuje na `matches INSERT/UPDATE` a `jobs UPDATE` pro live refresh kandidátů
- `messages/page.tsx` — subscribuje na `messages INSERT` pro aktivní chat thread

---

## Složka `makej-web` — Marketingový web

### Stack
- **Čistý HTML/CSS/JS** — žádný build tool, žádný framework
- Supabase přes **CDN** (`@supabase/supabase-js@2` UMD bundle)
- React + Babel Standalone pro employer dashboard (JSX v browseru)

### Soubory

```
index.html          — landing page
style.css           — všechny styly
script.js           — JS logika (navbar, smooth scroll, auth modály, Supabase)
hero-mockup.png     — obrázek telefonu v hero sekci
employer/
├── index.html      — employer dashboard (auth gate + React app)
├── app.jsx         — worker app mock data + sdílené tokeny (T, Icon, fmtKc)
├── employer-data.jsx       — mock data (přepsána reálnými daty při načtení)
├── employer-shell.jsx      — sidebar, topbar, grafy (Sparkline, AreaChart, BarChart, Donut)
├── employer-dashboard.jsx  — Dashboard tab (KPI, funnel, heatmap, activity)
├── employer-pages.jsx      — Inzeráty + Kandidáti kanban s Přijmout/Odmítnout
├── employer-pages2.jsx     — Analytika + Plán směn
├── employer-pages3.jsx     — Zprávy (realtime chat), Tým, Fakturace, Nastavení
├── employer-supabase.jsx   — Supabase data layer (fetchEmployerData, acceptCandidate, atd.)
└── employer-main.jsx       — Root React komponenta s loading stavem + realtime
```

### Jak funguje auth na webu (index.html)

Tlačítka "Přihlásit se" a "Vytvořit účet" v navbaru otevírají modály:
- **Login modál:** email+heslo + Google OAuth
- **Register modál:** 2 kroky (worker/employer → jméno, email, heslo, firma)
- Po přihlášení jako employer se v navbaru zobrazí tlačítko **Dashboard**
- Session je uložena pod `makej-auth` klíčem → sdílena s employer dashboardem na stejné origin

### Employer dashboard (`/employer/`)

**Auth gate:** Zobrazí se login formulář. Pokud není `role === 'employer'`, přihlášení je odmítnuto.

**Data flow:**
1. `getSession()` → získá `session.user.id` přihlášeného zaměstnavatele
2. `fetchEmployerData(employerId)` → fetchuje z Supabase: profil, joby, matche, zprávy, reviews
3. Mutuje globální proměnné (`E_JOBS`, `E_THREADS`, `ECOMPANY` atd.) in-place
4. `setLoaded(true)` + `setTick(1)` → React re-render s reálnými daty

**Realtime:** Subscribuje na `matches INSERT/UPDATE`, `jobs INSERT/UPDATE` → automatický refresh

**Zprávy (EMessages):**
- Lokální state `threads` inicializován z globálního `E_THREADS`
- Per-thread subscription: nové zprávy se přidají okamžitě do aktivního threadu
- Globální subscription: aktualizuje náhled (last message) ve všech threadech
- Odesílání: `sb.from('messages').insert(...)` s optimistickým update

### Lokální servery

```
localhost:3000  — makej Next.js app (npm run dev ve složce makej)
localhost:3333  — makej-web (python3 -m http.server 3333 ve složce makej-web)
```

---

## Co je propojené mezi aplikacemi

| Akce | Kde se projeví |
|---|---|
| Worker swipne v mobilu | Okamžitě v web dashboardu (realtime matches INSERT) |
| Employer přijme kandidáta v mobilu | Web dashboard se aktualizuje (realtime matches UPDATE) + job → filled (DB trigger) |
| Employer přijme v web dashboardu | Mobil vidí aktualizaci (realtime jobs UPDATE) + job → filled |
| Zpráva z mobilu | Okamžitě v web dashboardu (per-thread realtime subscription) |
| Zpráva z web dashboardu | Okamžitě v mobilu (NotificationProvider subscription) |
| Nový inzerát z mobilu | Okamžitě v web dashboardu (realtime jobs INSERT) |

---

## Typické úkoly a kde co hledat

| Chci... | Soubor |
|---|---|
| Přidat sloupec do DB | Supabase MCP → `apply_migration` |
| Změnit co vidí worker na /jobs | `src/app/(app)/jobs/page.tsx` |
| Změnit swipe logiku | `src/components/JobCard.tsx` |
| Přidat nové DB query | `src/lib/queries.ts` |
| Změnit typy | `src/lib/types.ts` |
| Upravit auth flow | `src/components/AuthProvider.tsx` |
| Upravit notifikace | `src/components/NotificationProvider.tsx` |
| Upravit landing page | `makej-web/index.html` + `style.css` + `script.js` |
| Upravit employer dashboard | `makej-web/employer/employer-*.jsx` |
| Přidat realtime do dashboardu | `makej-web/employer/employer-main.jsx` |
| Přidat Supabase query do dashboardu | `makej-web/employer/employer-supabase.jsx` |

---

## Důležité poznámky

- **Neměň gradient tlačítek** na `from-primary to-secondary` — správný je `from-primary to-accent`
- **Employer dashboard mock data** (v `employer-data.jsx`) se přepíší reálnými daty při načtení — neodstraňuj je, slouží jako fallback během načítání
- **`E_THREADS`, `E_JOBS` atd.** jsou `const` globální proměnné v browser scope — `employer-supabase.jsx` je mutuje in-place, nelze je reassignovat
- **Supabase anon key je veřejný** (publishable) — je bezpečné ho mít v kódu na frontendu
- **DB trigger** zajišťuje job → filled atomicky — aplikační kód v `queries.ts` to dělá taky pro jistotu, ale trigger je primární zdroj pravdy
- **`storageKey: 'makej-auth'`** — tenhle klíč musí být stejný ve všech Supabase klientech jinak se session nesdílí
