# Sideline

A Hupu-style sports forum for **overseas leagues**. Home opens into boards (NBA, Soccer, NFL, F1, Tennis, UFC). Every board uses the **same rating card**; only the five axes change. English is the default. Chinese, Spanish, and Japanese ship in the language strip.

## Run

```bash
npm install
npm run dev          # dev on http://127.0.0.1:43147
npm run preview      # production build + serve (most stable for QA)
npm run smoke        # Playwright smoke (dev or preview must be running)
```

Open `http://127.0.0.1:43147` or use Cursor **Preview** (Desktop). Styling needs Tailwind v4 via `postcss.config.mjs` (`@tailwindcss/postcss`). If the page looks like plain text, restart `npm run dev` after `npm install`, or run `npm run preview` for a production build. Preview tunnels are allowed in `next.config.ts` (`allowedDevOrigins`).

## Supabase + TheSportsDB

1. Copy `.env.example` → `.env.local` and fill keys.
2. In Supabase **SQL Editor**, run `supabase/schema.sql`.
3. **Authentication → URL Configuration**: Site URL `http://127.0.0.1:43147`, redirect `http://127.0.0.1:43147/**`.
4. Sign in at `/login`. Ratings/comments post to Supabase when configured.
5. Sync NBA/EPL fixtures: `curl http://127.0.0.1:43147/api/sync/fixtures` (needs `SUPABASE_SERVICE_ROLE_KEY`). Home shows **From TheSportsDB** when rows exist.
6. Cloud Agents: add the same keys under **Environment → Secrets**, run `node scripts/verify-env.mjs` in a **new** agent after Save. Local dev uses `.env.local`.

## What you get

- Boards on the home page, not a mixed match pile
- One rate screen: five sliders + optional take + post
- Sport-specific grades (NBA scoring/defense/playmaking/hustle/clutch, F1 pace/racecraft/tyres/…)
- Ratings stored in the browser

## Languages

EN / 中文 / ES / 日本語. Player names stay in international form.
