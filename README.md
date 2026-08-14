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
  A typed location is matched locally first; if it isn't one of the 13
  curated neighborhoods (e.g. "Fort Lauderdale"), it's geocoded via a free
  OpenStreetMap Nominatim lookup (`api/geocode.js`) and snapped to the
  nearest covered area, the same way GPS sensing works.
- 💾 A manually chosen location and your saved "what do you care about"
  criteria persist in `localStorage` and stay in effect until you change
  them again — surviving page reloads instead of silently resetting.
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

**To enable the Claude-powered version:** set `ANTHROPIC_API_KEY` as an
environment variable in the Vercel project (Project Settings → Environment
Variables), using a key from [the Anthropic Console](https://console.anthropic.com/).
It only runs server-side; the key is never sent to the browser. There's no
local equivalent for `vite dev` — the serverless function only exists once
deployed to Vercel (or run via `vercel dev`), so local development always
sees the fallback below.

**Without a key** (e.g. for testers you invite who don't have your key),
`api/search.js` automatically falls back to
[ProPublica's Nonprofit Explorer API](https://projects.propublica.org/nonprofits/api/) —
free, no key required, and backed by real IRS nonprofit filings. It's a
name/registry search rather than a topic search, so results are framed as
"a registered nonprofit near you, worth looking into" rather than any claim
about what the org has done — there's no filing data to back up an impact
claim, so none is made.

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
- `api/search.js` — a Vercel serverless function using the Anthropic SDK for the live search feature, with a free ProPublica-backed fallback when no key is set
- `api/geocode.js` — a Vercel serverless function proxying OpenStreetMap Nominatim for free geocoding of typed locations
- Deployed on Vercel

## Development

```bash
npm install
npm run dev
```

## Deployment

Push to GitHub. Vercel auto-deploys on every commit.
