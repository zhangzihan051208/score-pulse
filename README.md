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
2. In Supabase **SQL Editor**, run `supabase/schema.sql`. Existing projects: also run `supabase/migrate-profile-fields.sql`, `supabase/migrate-vip.sql`, `supabase/migrate-social.sql`, `supabase/migrate-athlete-profiles.sql`, `supabase/migrate-zones-moderation.sql` (DIY rating zones + comment moderation), and `supabase/migrate-safety.sql` (reports and blocks).
3. **Authentication → URL Configuration**: Site URL `http://127.0.0.1:43147`, redirect `http://127.0.0.1:43147/**`.
4. Sign in at `/login`. Edit nickname, avatar URL, and signature at `/profile`. Ratings/comments post to Supabase when configured.
5. **Soccer + NBA (TheSportsDB)** — set `THESPORTSDB_API_KEY` to your premium key (not `123`).
   - **Every 3 minutes:** pull the latest fixtures for all seven leagues into Supabase (`/api/cron/fixtures` or `GET /api/sync/fixtures?force=1`).
   - **Every 15 minutes:** fill missing lineups (`/api/cron/enrich`).
   - **While someone watches live:** refresh in-play scores at most every **2 minutes** (up to four matches per tick), within the 40/min and 20k/day cap.
   - **Browser:** list and match pages poll on the same 2-minute clock when games are live; kickoff window polls every 60s (reads Supabase until the next upstream refresh).
   - On **Vercel**, `vercel.json` registers those cron paths. Set **`CRON_SECRET`** (and optionally `SYNC_SECRET`) in project env; cron requests must send `Authorization: Bearer …`.
   - Elsewhere: `BASE_URL=https://your-app.example SYNC_SECRET=… scripts/sync-scheduled.sh` on a 3-minute timer.
   - Needs `SUPABASE_SERVICE_ROLE_KEY`. Leagues: **NBA**, **Premier League**, **La Liga**, **Bundesliga**, **Serie A**, **Ligue 1**, **Champions League**.
   - TheSportsDB calls stop at 40/minute and 20,000/day on a private key (8/minute and 1,500/day on the shared `123` key). PandaScore stops at 600/hour. KashRock stops at 8/minute and 1,200/day. A full budget serves the last saved scores and does not call the provider.
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

## Store review

The website can delete an account, report a comment, block a user, and store a match score in Supabase. The phone signs in with the same email through `/api/auth/mobile` and syncs grades through the website APIs. Open match and player pages refresh the published scores and comments every few seconds, so a post on one shows on the other. Set `EXPO_PUBLIC_API_URL` to the public site; local preview uses `http://127.0.0.1:43147`. Ads stay empty.

Operator: 张子函. Support and review email: zhangzihan051208@gmail.com. That address is also the safety-queue admin when `SAFETY_ADMIN_EMAILS` is unset.

VIP product: **看台月卡** / Grandstand Monthly, €7 per month. The website header and `/profile/vip` start a Stripe Checkout subscription. The installed iPhone and Android apps buy the same membership with StoreKit and Play Billing. The phone browser preview uses the website checkout, because a browser cannot open the store sheet.

- App Store product id: `com.grandstand.tribune.vip.monthly`
- Google Play product id: `grandstand_vip_monthly`
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` — card checkout and renewals. Without the secret key the buy button explains that checkout is not configured and does not grant VIP.
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` — the Play Console service account used to verify an Android purchase token.
- Apple receipts are a StoreKit 2 signature checked against Apple's public root certificate. No Apple private key is stored here. The product still has to exist in App Store Connect.

Before a store submission, fill `.env.local` (and the hosted environment) with:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `SAFETY_ADMIN_EMAILS` — the login email that opens `/safety`
- `NEXT_PUBLIC_OPERATOR_NAME` and `NEXT_PUBLIC_SUPPORT_EMAIL` — shown on `/privacy`
- A public site URL for the store privacy field, plus a reviewer test account

Run `supabase/migrate-safety.sql` in that project. If the project was created before profile fields and `rating_mode`, also run `supabase/repair-sync.sql` once. Scores still sync without that column; the daily five-axis cap is stored only after the repair. Account deletion needs the service role key.

Comments are decided before they are stored. Local rules block ads, contact redirects, abuse, sexual or violent text, and spam. Set `OPENAI_API_KEY` and the same text is also sent to OpenAI Moderations (`omni-moderation-latest`). A flagged comment is rejected and never published. A report runs that check again and hides the comment when it fails, or dismisses the report when the text is allowed. Scores are numbers and are not sent. If the key is missing or the moderation service does not answer, the local rules still apply and an uncertain report stays open on `/safety`.

## Phone apps

The phone client lives in `mobile/`. It follows the website at phone scale: matches, boards, zones, clubs, grading, and search. iOS, Android, and the website each keep an empty ad slot. See `mobile/README.md`.

## What you get

- Boards on the home page, not a mixed match pile
- One rate screen: five sliders + optional take + post
- Sport-specific grades (NBA scoring/defense/playmaking/hustle/clutch, F1 pace/racecraft/tyres/…)
- Ratings stored in the browser

## Languages

EN / 中文 / ES / 日本語. Player names stay in international form.
