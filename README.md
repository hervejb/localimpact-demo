# LocalImpact Demo

**Who's been fighting for where you live.**

A mobile-first web app that surfaces what environmental advocacy organizations have done for specific neighborhoods — what they've won, what's in progress, and how you can get involved.

## Live Demo

Deployed at: *(your Vercel URL goes here)*

## Features

- 📍 Senses your real location via the browser Geolocation API and jumps to the
  nearest covered area, showing how far away it actually is (falls back to
  Upper West Side, Manhattan if location is denied or unsupported)
- 📰 A location-aware headline banner surfaces the single strongest story for
  wherever you are, tap to jump straight into it
- 🌿 Two skins: General/Civic and Sierra Club branded
- 🗂 Three tabs: Won for you · Happening right now · Learn more & act
- 🏷 Issue categories: Environmental Health, Climate & Energy, Land & Green Space, Community & Justice
- 🔍 Manual search across all covered locations
- ⚙️ Interest filters by topic and organization
- 🏢 Org badges on every bullet — tap to learn about each organization

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
- Deployed on Vercel

## Development

```bash
npm install
npm run dev
```

## Deployment

Push to GitHub. Vercel auto-deploys on every commit.
