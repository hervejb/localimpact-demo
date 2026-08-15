# LocalImpact Demo

**Who's been fighting for where you live.**

A mobile-first web app: open it in your neighborhood, and it shows what
nonprofit and civic organizations have already won there, what they're
fighting for now, and a direct way to learn more, connect, donate,
volunteer, or share.

## Live Demo

Deployed at: *(your Vercel URL goes here)*

## Features

- 📍 Senses your real location automatically via the browser Geolocation
  API and snaps to the nearest covered neighborhood — no setup, no typing,
  just open the app. Tap the location line to type or dictate a different
  address/city/zip instead (falls back to a free geocode lookup if it isn't
  one of the curated neighborhoods), or revert to your current location.
- 🗂 Two tabs: **Won for you** (completed wins) and **Fighting for you**
  (active campaigns and concrete ways to help) — all hand-authored, cited,
  real content. No live API calls, no network wait, nothing to configure.
- 🏷 Issue categories: Environmental Health, Climate & Energy, Land & Green Space, Community & Justice
- 🏢 Every story links to its organization's profile — who they are, what
  they do, and how to get involved — plus four direct actions: **Connect**,
  **Donate**, **Volunteer**, and **Share** (via the device's native share
  sheet, or a clipboard-copy fallback).
- 💾 A manually chosen location and your saved "what do you care about"
  criteria persist in `localStorage` and stay in effect until you change
  them again — surviving page reloads instead of silently resetting.
- ⚙️ **Preferences** — say what you care about, in your own words, typed or
  dictated. Matched locally and instantly against the dataset's categories;
  no network call, no delay.

## Why Static, Not Live

Earlier versions of this app tried live, AI-generated search on every
location and topic — but chasing "real-time, works anywhere, and free" at
once meant juggling three different API providers, billing risk, rate
limits, and empty results whenever a key wasn't configured. That added a
lot of fragility for a prototype whose core idea doesn't need it: sense
where you are, show real local impact, make it easy to act. So the app
went back to a curated, hand-authored dataset — generated and verified
once, not regenerated live per visitor. It's instant, free, and never
returns nothing.

The tradeoff: coverage is intentionally small (13 neighborhoods, listed
below) rather than "anywhere on Earth." Growing it means adding more
hand-verified locations to `LOCATION_DATA` in `src/App.jsx`, not flipping
on a live API.

## Location Resolution

`api/geocode.js` proxies OpenStreetMap's free Nominatim service (no key,
no cost) so a typed location that isn't one of the 13 curated
neighborhoods (e.g. "Fort Lauderdale") still resolves to real coordinates
and snaps to the nearest covered one, the same way GPS sensing does.

## Locations Covered

**Manhattan:** Chelsea · Lower East Side / Chinatown · Tribeca / Financial District ·
West Village / Greenwich Village · Upper West Side · East Harlem ·
Harlem · Upper East Side · Yorkville / Carnegie Hill

**Elsewhere:** Miami Beach, FL · Miami Shores, FL · Hyde Park (Chicago), IL · Brecksville, OH

## Tech Stack

- React 18
- Vite
- `api/geocode.js` — a Vercel serverless function proxying OpenStreetMap Nominatim for free geocoding of typed locations
- Deployed on Vercel

## Development

```bash
npm install
npm run dev
```

## Deployment

Push to GitHub. Vercel auto-deploys on every commit.
