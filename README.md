# Sideline

A Hupu-style sports forum for **overseas leagues**. Home opens into boards (NBA, Soccer, NFL, F1, Tennis, UFC). Every board uses the **same rating card**; only the five axes change. English is the default. Chinese, Spanish, and Japanese ship in the language strip.

## Run

```bash
npm install
npm run dev          # dev on http://127.0.0.1:43147
npm run preview      # production build + serve (most stable for QA)
npm run smoke        # Playwright smoke (dev or preview must be running)
```

Open `http://127.0.0.1:43147`. If buttons or language feel dead in dev, use `npm run preview` — Next.js blocks some dev assets until `allowedDevOrigins` is set (already in `next.config.ts`).

## What you get

- Boards on the home page, not a mixed match pile
- One rate screen: five sliders + optional take + post
- Sport-specific grades (NBA scoring/defense/playmaking/hustle/clutch, F1 pace/racecraft/tyres/…)
- Ratings stored in the browser

## Languages

EN / 中文 / ES / 日本語. Player names stay in international form.
