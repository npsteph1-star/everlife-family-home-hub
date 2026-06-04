# EverLife Family Home Hub

Mobile-first local-first PWA starter for a family command center.

## What is included

- Editable family member management
- Mom Admin / Dad Admin concept
- Routines
- Chores
- Rewards
- Brain dump sorting
- Pregnancy/newborn tracker
- AI settings placeholder
- Alexa optional toggle
- Backup/export/import
- PWA manifest
- Service worker for basic offline support
- Local-first storage using browser localStorage

## Important production note

This starter stores data locally in the browser. For a sellable SaaS app, add:

- Real authentication
- Database
- Server-side API key storage
- Row-level security
- Payment/subscription layer
- Encrypted cloud sync

Recommended production stack:

- Frontend: React + Vite
- Backend/database: Supabase
- Auth: Supabase Auth
- Payments: Stripe
- AI proxy: Supabase Edge Functions or Node API
- Hosting: Vercel or Netlify

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy

Simple first deployment:
- Build command: `npm run build`
- Output directory: `dist`

Deploy to:
- Netlify
- Vercel
- Cloudflare Pages
