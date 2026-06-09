# බත්පත · Bathpatha

A mobile-first, installable **Progressive Web App** for a boarding house, where
residents record the meals they take from the boarding-house aunty and the app
automatically tracks how much each person owes.

Built with **Next.js 15 (App Router) · TypeScript · Tailwind · shadcn-style UI ·
Supabase · Zustand · React Query** and full **offline-first** PWA support.

---

## Features

- 📱 **Installable PWA** — add to home screen on Android & iPhone, runs full-screen like a native app.
- 🔢 **PIN login** — pick your name, enter a 4-digit PIN. No passwords. Session persists.
- 🍳 **One-tap meal entry** — big *Breakfast* / *Dinner* buttons → pick eggs (0–4) → done.
- 💰 **Running balance** — amounts accumulate continuously (no monthly reset). Anyone can record a payment against their own balance, and admins can settle for anyone — full meal-and-payment history stays visible to everyone.
- 🕓 **48-hour edit window** — users edit only their own recent entries; admins edit anything.
- 🗂️ **Historical price snapshots** — changing prices never alters past records.
- 📊 **Admin reports** — totals, meal/egg counts, settlements, date filtering, CSV export.
- 🛡️ **Audit log** — every meal, edit, settlement and price change is recorded.
- 📴 **Offline mode** — meals recorded offline are stored on-device and synced automatically when back online. Entries are never lost.

---

## Roles

| Capability | Admin (Pavith) | Normal user |
| --- | --- | --- |
| Record own meals | ✅ | ✅ |
| View everyone's totals & meals | ✅ | ✅ |
| Edit own meals (within 48 h) | ✅ | ✅ |
| Edit anyone's meals, anytime | ✅ | ❌ |
| Record payment against own balance | ✅ | ✅ |
| Record payment for anyone | ✅ | ❌ |
| Delete a settlement (correction) | ✅ | ❌ |
| Change prices | ✅ | ❌ |
| Add / disable users, reset PINs | ✅ | ❌ |
| Reports & audit log | ✅ | ❌ |

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to <https://supabase.com> → **New project**.
2. Open the **SQL Editor** and run the contents of [`supabase/schema.sql`](supabase/schema.sql).
   This creates the tables, constraints, triggers, RLS, and seeds the four
   initial users (Pavith = admin, Nayantha, Lahiru, Bevin) plus default prices
   (Breakfast Rs. 200, Dinner Rs. 300, Egg Rs. 50).

### 3. Configure environment variables

Copy the example and fill in your values:

```bash
cp .env.local.example .env.local
```

| Variable | Where to find it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key (**server only**) |
| `SESSION_SECRET` | Any long random string — `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |

### 4. Generate the PWA icons

```bash
npm run icons
```

This renders `public/icon-source.svg` into the PNG icons referenced by the
manifest. (Re-run it any time you change the source SVG.)

### 5. Run locally

```bash
npm run dev
```

Open <http://localhost:3000>. Pick a user and choose a 4-digit PIN — the **first**
PIN you enter for a user becomes their PIN. (The service worker is disabled in
development; PWA/offline behaviour is active in production builds only.)

To test offline/PWA locally:

```bash
npm run build && npm start
```

---

## Deploying to Vercel

1. Push this repo to GitHub/GitLab.
2. In [Vercel](https://vercel.com) → **New Project** → import the repo.
3. Add the four environment variables (same as `.env.local`) under
   **Settings → Environment Variables**.
4. Deploy. Vercel auto-detects Next.js — no extra configuration needed.

> The service worker and manifest are generated at build time. After the first
> production deploy, visiting the site on a phone will offer **"Add to Home
> Screen"** (Android/Chrome) or **Share → Add to Home Screen** (iOS/Safari).

---

## Architecture notes

- **Auth.** PIN-based, no Supabase Auth. The login API verifies the PIN
  (bcrypt-hashed) and issues a signed (`jose` HS256) **httpOnly cookie** session
  that lasts a year. All data access goes through Next.js **API routes** using
  the Supabase **service-role** key; the anon key is never used to read/write
  data directly, and **Row Level Security is enabled with no public policies**
  so the database is not reachable from the client.
- **Pricing.** `meal_price` and `egg_price` are snapshotted onto every
  `meal_records` row at insert time, so later price changes never affect history.
- **Validation.** A DB unique constraint `(user_id, meal_type, meal_date)`
  guarantees a user can't record two breakfasts (or two dinners) on the same day;
  egg counts are non-negative; the 48-hour edit window is enforced server-side.
- **Offline.** Meals recorded while offline are queued in **IndexedDB** and
  flushed by a background sync manager on reconnect / page load / every 30 s.
  Conflict resolution is "server wins" — a queued meal that the server reports as
  a duplicate is silently dropped.
- **State.** React Query owns server data; Zustand holds the lightweight client
  session mirror and the offline-pending counter.

## Project structure

```
supabase/schema.sql           # database schema + seed
src/app/
  layout.tsx, providers.tsx    # root layout, font, React Query, toaster
  page.tsx                     # PIN login
  offline/                     # offline fallback page
  (app)/                       # authenticated shell (bottom nav, sync, offline banner)
    dashboard/                 # current user card + one-tap meal entry
    history/                   # personal meal history (48 h edit)
    others/                    # everyone's balances + per-user detail & settlements
    reports/                   # admin reports + CSV export
    settings/                  # admin: prices, users, audit log
  api/                         # auth, meals, summaries, settlements, settings, admin
src/components/                # UI primitives + feature components
src/lib/                       # types, supabase admin, session, pricing, offline db, sync, api
src/store/                     # zustand stores (auth, offline)
```

## Default data

Initial users seeded by the schema: **Pavith** (admin), **Nayantha**, **Lahiru**,
**Bevin**. Each sets their own PIN on first login. Admins can add more users and
reset PINs from **Settings → Users**.
