# 🏠 Family Home Hub

A privacy-first family operating system for chores, routines, rewards, meals,
calendar, economy tracking, and more.

**Stack:** React 18 + Vite · Supabase (Auth + Postgres + RLS) · Vercel

---

## Quick Start

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → New project
2. In **SQL Editor → New Query**, paste the contents of `supabase/schema.sql` and run it
3. From **Project Settings → API**, copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

### 2. Configure Environment Variables

```bash
cp .env.example .env.local
# Edit .env.local and fill in the two Supabase values
```

Required:

| Variable | Where to find it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon key |
| `VITE_APP_URL` | `http://localhost:5173` for dev, your Vercel URL for prod |

> **Never** commit `.env.local`. It is in `.gitignore`.

### 3. Run Locally

```bash
npm install
npm run dev
# Open http://localhost:5173
```

### 4. Deploy to Vercel

1. Push this repo to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Vercel auto-detects **Vite** (framework: Vite, build: `vite build`, output: `dist`)
4. Add environment variables in Vercel → Project → Settings → Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_URL` (set to `https://your-app.vercel.app`)
5. Deploy → done

### 5. Configure Supabase Auth Redirect URLs

In Supabase → Authentication → URL Configuration:

- **Site URL:** `https://your-app.vercel.app`
- **Redirect URLs:** add `https://your-app.vercel.app/**`

For local dev also add `http://localhost:5173/**`.

---

## Auth Flow

```
User visits app
  │
  ├── No Supabase session → Login page
  │     ├── Email + Password
  │     ├── Magic Link (passwordless)
  │     └── Forgot Password (reset email)
  │
  ├── Register → creates account
  │     └── Supabase trigger auto-creates:
  │           • households row
  │           • household_members row (role: Owner)
  │
  └── Session active → Main app (all pages)
```

---

## Security Model

### Household Isolation

Every data table has a `household_id` column. Row Level Security policies
use `get_my_household_id()` to ensure users only see their own family’s data.
No cross-household access is possible at the database layer.

### What is Stored Where

| Data | Storage | Notes |
|---|---|---|
| Auth session token | `localStorage` (Supabase SDK managed) | Supabase handles this automatically |
| App data (chores, rewards, etc.) | `localStorage` (Phase 1) | Will migrate to Supabase in Phase 2 |
| Supabase URL + anon key | Environment variable | Safe to expose — protected by RLS |
| OAuth secrets (Google, etc.) | Supabase Edge Function env | **Never** in frontend |
| API keys (AI, etc.) | Supabase server-side | **Never** in localStorage |
| Parent PIN | `localStorage` (hashed) + `households.pin_hash` | Family-grade lock, not cryptographic |

### Parent PIN

The default PIN is **1234**. Change it immediately in Settings → Security.
The PIN is stored as a simple hash (family-grade, not bcrypt). It prevents
casual access by children but is not a cryptographic security boundary.

---

## Project Structure

```
src/
  lib/
    supabase.js       — Supabase browser client (singleton)
    auth.js           — signIn, register, resetPassword, signOut
    pin.js            — PIN hash + verify utilities
  contexts/
    AuthContext.jsx   — Supabase session → React context
  utils/
    DataContext.jsx   — App state + localStorage persistence
    storage.js        — localStorage helpers
  pages/
    Login.jsx         — Password + magic link + forgot password
    Register.jsx      — Create account + household
    Dashboard.jsx     — Family overview
    Chores.jsx        — Chore workflow
    Rewards.jsx       — Reward catalog + requests
    Economy.jsx       — Points / money / screen time / tokens
    Routines.jsx      — Morning / afternoon / evening routines
    Calendar.jsx      — Events + appointments
    Meals.jsx         — Meal planner + grocery + pantry
    Education.jsx     — Assignments + goals + reading log
    Communication.jsx — Announcements + brain dump
    Settings.jsx      — Household settings (PIN-protected)
    Audit.jsx         — Audit log viewer
  components/
    Navigation.jsx    — Sidebar nav with sign-out
    PinModal.jsx      — Parent PIN entry dialog
  styles/
    auth.css          — Auth page styles
supabase/
  schema.sql          — Full DB schema + RLS + trigger
```

---

## Roadmap

### Phase 2 — Data Migration (next)
- [ ] Migrate chores / rewards / family profiles from localStorage → Supabase
- [ ] Real-time updates via Supabase subscriptions
- [ ] Multi-device sync

### Phase 3 — Integrations
- [ ] Google Calendar: export .ics / add-to-calendar links
- [ ] Google Calendar OAuth sync (Edge Function, tokens stored server-side)
- [ ] AI assistant (BYO API key stored in Supabase, never in browser)

### Phase 4 — Multi-household / SaaS
- [ ] Invite family members by email
- [ ] Roles with fine-grained permissions
- [ ] Billing (Stripe) — placeholder in settings only

---

## Economy Disclaimer

Allowance balances are tracking tools and are **not** financial accounts.
Family Home Hub does not hold, transfer, or manage real money.
