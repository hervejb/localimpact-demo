# LocalImpact Demo

**Who's been fighting for where you live.**

A mobile-first web app that surfaces what environmental advocacy organizations have done for specific neighborhoods — what they've won, what's in progress, and how you can get involved.

## Live Demo

Deployed at: *(your Vercel URL goes here)*

## Features

- 📍 Senses your real location via the browser Geolocation API and jumps to
  the nearest covered area (falls back to Upper West Side, Manhattan if
  location is denied or unsupported). Tap the location line to type or
  dictate a different address/city/zip, or revert to your current location.
- 🗂 Two tabs: **Won for you** (completed wins) and **Fighting for you**
  (active campaigns and concrete ways to help)
- 🏷 Issue categories: Environmental Health, Climate & Energy, Land & Green Space, Community & Justice
- 🏢 One link per story: the organization's name, tap to open its profile
- ⚙️ **Preferences** — say what you care about, in your own words, typed or
  dictated. It's matched locally against the curated dataset instantly, and
  in parallel a live, web-search-grounded lookup runs for the same topic at
  your location (see **Live Search** below) — so a topic outside the
  curated categories still returns something instead of nothing.

## Live Search ("ask anything, anywhere")

The curated dataset only covers 4 topics across 13 locations. Typing a topic
that isn't in it (e.g. "racial justice" somewhere with no curated coverage)
calls `api/search.js`, a Vercel serverless function that asks Claude —
grounded with real web search, never fabricating — which real organizations
have worked on that topic near that location, shaped to fit the app's UI.
Live results are labeled "Found via live search — verify before relying on
this" so they're never confused with the editorially curated content.

**To enable it:** set `ANTHROPIC_API_KEY` as an environment variable in the
Vercel project (Project Settings → Environment Variables), using a key from
[the Anthropic Console](https://console.anthropic.com/). Without a key, the
search silently returns nothing extra — the rest of the app is unaffected.
It only runs server-side; the key is never sent to the browser. There's no
local equivalent for `vite dev` — the serverless function only exists once
deployed to Vercel (or run via `vercel dev`), so local development always
sees the graceful empty-result fallback.

## Locations Covered

**Manhattan:** Chelsea · Lower East Side / Chinatown · Tribeca / Financial District ·
West Village / Greenwich Village · Upper West Side · East Harlem ·
Harlem · Upper East Side · Yorkville / Carnegie Hill

**Elsewhere:** Miami Beach, FL · Miami Shores, FL · Hyde Park (Chicago), IL · Brecksville, OH

Coverage is intentionally small for this demo — sensing your location always
snaps to whichever of these is nearest, and shows the distance so it's never
misleading about how close that actually is.

## Tech Stack

- React 18
- Vite
- `api/search.js` — a Vercel serverless function using the Anthropic SDK for the live search feature
- Deployed on Vercel

## Development

```bash
npm install
npm run dev
```

## Deployment

Push to GitHub. Vercel auto-deploys on every commit.
