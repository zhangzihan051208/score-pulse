# Grandstand（看台）

A fan tribune for **overseas leagues**. Home opens into boards (NBA, Soccer, **Esports**, NFL, F1, Tennis, UFC). Every board uses the **same rating card**; only the five axes change. English is the default. Chinese, Spanish, Japanese, and **German** ship in the language strip.

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
2. In Supabase **SQL Editor**, run `supabase/schema.sql`. Existing projects: also run `supabase/migrate-profile-fields.sql`, `supabase/migrate-vip.sql`, `supabase/migrate-social.sql`, `supabase/migrate-athlete-profiles.sql`, and `supabase/migrate-zones-moderation.sql` (DIY rating zones + comment moderation).
3. **Authentication → URL Configuration**: Site URL `http://127.0.0.1:43147`, redirect `http://127.0.0.1:43147/**`.
4. Sign in at `/login`. Edit nickname, avatar URL, and signature at `/profile`. Ratings/comments post to Supabase when configured.
5. Sync (two steps — schedules first, rosters on a schedule):
   - **Fixtures (fast):** `curl "http://127.0.0.1:43147/api/sync/fixtures?force=1"` — scores & match list only.
   - **Enrich (rosters):** `curl "http://127.0.0.1:43147/api/sync/enrich?force=1"` — fills player lineups in the background.
   - Optional: set `SYNC_SECRET` and pass `Authorization: Bearer $SYNC_SECRET`. Cron helper: `BASE_URL=https://your-app.example scripts/sync-scheduled.sh`.
   - Needs `SUPABASE_SERVICE_ROLE_KEY` + `THESPORTSDB_API_KEY`. Leagues: **NBA**, **Premier League**, **La Liga**, **Bundesliga**, **Serie A**, **Ligue 1**, **Champions League**.
   - User page loads no longer trigger a full sync; only live score ticks refresh a few in-play matches.
6. Browse league sub-boards under `/boards/soccer/premier-league`, `/boards/soccer/la-liga`, etc. Search teams, matches, and players at `/search`.
7. **Esports:** set **`KASHROCK_API_KEY`** (Sandbox, 500 req/UTC day) and/or `PANDASCORE_API_TOKEN`. **KashRock wins when both are set.** Boards: `/boards/esports` and `/boards/esports/lol`, `/cs2`, `/dota2`, `/valorant`. CS2 live lists pull rosters from map box scores when `player_board` is not cached; lists poll `/api/esports/events?live=1` for enriched cards.
8. Set primary/secondary teams per league at `/my-teams` (home prioritizes primary-team fixtures; full schedule at `/my-teams/soccer-premier-league/schedule`). Run `supabase/migrate-favorite-teams.sql` if `profiles` already exists.
9. Cloud Agents: add the same keys under **Environment → Secrets**, run `node scripts/verify-env.mjs` in a **new** agent after Save. Local dev uses `.env.local`.

### Saving the Cloud Environment (avoid Save errors)

In the dashboard **Install / Start** JSON, use **only** these two keys (do not paste the whole `.cursor/environment.json` if it includes `"name"`):

```json
{
  "install": "npm ci",
  "start": "bash .cursor/start.sh"
}
```

Save **Secrets** in the Secrets tab separately (names like `PANDASCORE_API_TOKEN`, no spaces). If Save still errors, save scripts first, then add secrets one tab at a time.

## Phone apps

The Google Play and App Store client lives in `mobile/`. It ships the honor boards (sport, role, player, club) on the device. See `mobile/README.md` for local runs and store builds.

## What you get

- Boards on the home page, not a mixed match pile
- One rate screen: five sliders + optional take + post
- Sport-specific grades (NBA scoring/defense/playmaking/hustle/clutch, F1 pace/racecraft/tyres/…)
- Ratings stored in the browser

## Languages

EN / 中文 / ES / 日本語. Player names stay in international form.
