# LocalImpact Demo

**Who's been fighting for where you live.**

A mobile-first web app that surfaces what nonprofit and civic organizations
have won or are actively fighting for, right where you are — searched live,
every time, for any location on Earth.

## Live Demo

Deployed at: *(your Vercel URL goes here)*

## Features

- 📍 Senses your real location via the browser Geolocation API and reverse-
  geocodes it to a real place name — no fixed list of covered areas, no
  snapping to the nearest of a handful of cities. Tap the location line to
  type or dictate any address, city, or neighborhood instead, or revert to
  your current location.
- 🔎 **Every result is a live, web-search-grounded lookup** — there's no
  curated dataset behind this app. Landing on a location (or changing it)
  searches for real organizations working there across environmental
  health, climate, land, and community/justice; saving "what do you care
  about" narrows that same live search to your specific topic. See **How
  Search Works** below.
- 💾 A manually chosen location and your saved "what do you care about"
  criteria persist in `localStorage` and stay in effect until you change
  them again — surviving page reloads instead of silently resetting.
- 🗂 Two tabs: **Won for you** (completed wins) and **Fighting for you**
  (active campaigns and concrete ways to help)
- 🏷 Issue categories: Environmental Health, Climate & Energy, Land & Green Space, Community & Justice
- 🏢 One link per story: the organization's name, tap to open its profile,
  plus a source citation link on every claim
- ⚙️ **Preferences** — say what you care about, in your own words, typed or
  dictated. Also narrows which categories are shown among whatever the live
  search already returned, entirely client-side.

## How Search Works

`api/search.js` asks Claude — grounded with real web search, never
fabricating — which real organizations have won or are fighting for a given
topic near a given place, structured as: an overview of who the org is,
2-3 specific, individually-cited accomplishments, and individually-cited
planned activities with their proposed impact. Every claim carries a real
source link. Results are labeled "🔎 Found via live search — verify before
relying on this."

Landing on a location without a specific topic set runs a default broad
query (environmental health, climate, land, and community/justice) so the
tabs aren't empty on first load. Saving a specific topic in Preferences
re-runs the search scoped to exactly that.

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

Since every location and every topic change is now a real, billed API call
once a key is set, `api/search.js` should not be exposed to public,
unlimited traffic without a rate limit and a spending cap set in the
Anthropic Console — neither is built yet.

## Location Resolution

`api/geocode.js` proxies OpenStreetMap's free Nominatim service in two
modes: forward (typed text → coordinates + a place name) and reverse
(GPS coordinates → a place name). There's no coverage limit — any location
on Earth that Nominatim can resolve works.

## Tech Stack

- React 18
- Vite
- `api/search.js` — a Vercel serverless function using the Anthropic SDK for live organization search, with a free ProPublica-backed fallback when no key is set
- `api/geocode.js` — a Vercel serverless function proxying OpenStreetMap Nominatim for free forward/reverse geocoding
- Deployed on Vercel

## Development

```bash
npm install
npm run dev
```

Note: `/api/*` functions aren't served by `vite dev` — local development
needs `vercel dev`, or a deployed preview, to see live search and geocoding
actually run.

## Deployment

Push to GitHub. Vercel auto-deploys on every commit.
