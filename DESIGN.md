# LocalImpact — Product & Technical Design

**"Who's been fighting for where you are, right now."**

This document designs the full mobile app the current React demo (`src/App.jsx`) is a
content prototype for. The demo already proves the core content model — zip-code-level
"Won for you / Happening right now / Get involved" cards, tagged by category and by
organization — with real Sierra Club campaign data. What it doesn't yet do is the thing
the product is named for: tell you, unprompted, standing on a specific corner, what a
nonprofit did *right there*, including work it did indirectly by funding or backing
someone else.

This design closes that gap.

## 1. The core idea

Nonprofit impact is invisible at street level. You walk past a park, a repaved
waterfront, a building that isn't a peaker plant anymore, a water main that didn't
rupture, and there's no marker that says *this exists because an organization spent
years and money making it exist*. LocalImpact turns that invisible history into a
location-triggered notification:

> 🌿 **Sierra Club** · 0.1 mi away
> This stretch of Hudson River Park was industrial waterfront until Sierra Club and
> allies fought for the Hudson River Park Act. Tap to see what happened here.

Two things make this a *location* product rather than a *lookup* product, and two
things make it an *impact* product rather than a generic "here's a park" app:

- **Push, not pull.** The app alerts you as you enter the radius of a real event —
  you don't have to think to open it, the way you would to search a zip code.
- **Geofences, not zip codes.** Impact is pinned to the point or footprint where it
  actually happened (a specific plant, park, courthouse, waterfront segment), not
  smeared across an entire postal code.
- **Causal, not just descriptive.** Every card answers *issue → why it affects you
  here → what the org did → what happened* — the structure the demo already uses.
- **Direct and indirect are both first-class.** An org's own campaign work
  (`sc_only`/`sc_led`) and its role funding, litigating alongside, or amplifying a
  partner org's work (`sc_supported`) are both surfaced, and traced through the org
  graph rather than collapsed into one undifferentiated "helped."

## 2. From the demo to the product: what changes

| | Demo (today) | Product (this design) |
|---|---|---|
| Location granularity | User-picked zip code, 9 Manhattan neighborhoods | GPS point, nationwide, geofenced per impact site |
| Trigger | User opens app, browses tabs | Passive geofence entry → push notification |
| Data shape | `LOCATION_DATA[zip] = { delivered, inProgress, involved }` | Point/polygon-tagged impact records in a spatial index, same card fields |
| Org relationships | `group: "sc_only" \| "sc_supported" \| "other"` on each item | Same distinction, formalized as an org relationship graph (funder → grantee, coalition co-plaintiff, etc.) so "indirect" impact can be traced N hops |
| Orgs shown | Hardcoded `ORGS` dict, Sierra Club-centric | Any nonprofit; user's Interests panel already supports filtering by org and category — extend to org discovery |
| Skins | Manual "civic" vs "sierra_club" lens toggle | Same mechanism, now selectable per-organization partner (an org can license a branded skin over the shared civic dataset) |

The demo's data shape barely needs to change — `summary / issue / why / done /
outcome / bulletLink / group / category / orgId` is exactly the right unit of
content. What's new is *where it lives* (geocoded, not zip-bucketed) and *how it
reaches the user* (geofence trigger, not manual search).

## 3. User experience

### 3.1 Passive discovery (the core loop)
1. App runs a background geofencing service (not continuous GPS — see §5.2).
2. User crosses into a ~150m radius around an impact site.
3. OS push notification fires: org icon, one-line summary, distance.
4. Tap opens the same card UI as the demo's list view — issue / why / done /
   outcome / link — plus a small map showing exactly where they're standing
   relative to what happened.
5. Snoozeable and mutable: "Don't alert me for this category" / "Mute this org"
   feed straight into the existing Interests panel, which already has the
   category/org toggle UI built.

### 3.2 Active exploration (map + list, same as today)
- A map view (new) shows pins for every impact site within the visible area —
  this is the natural map-based sibling to the demo's `SearchModal`
  neighborhood list.
- The three-tab structure (`Won for you` / `Happening right now` / `Get
  involved`) is retained exactly, now scoped to "near me" instead of "in this
  zip."
- Org sheets (`OrgSheet`, already built) stay as the org-detail surface —
  about / what they do / how to get involved / link.

### 3.3 Indirect impact, made visible
When a card represents indirect impact (`group: "sc_supported"`), the UI should
say who actually did the primary work and how the org connected to it —
this is already in the copy (e.g. "Sierra Club is supporting Miami
Waterkeeper's federal challenge") but should become a structured, tappable
relationship, not just prose: **Primary actor → org's role (funder / co-plaintiff /
coalition member / amplifier) → org**. Tapping either org opens its `OrgSheet`.
This is the single highest-leverage UI change over the demo: it's the
difference between "Sierra Club did this" and "here's the actual chain of
who did what," which is more honest and more interesting.

### 3.4 Personalization
The demo's Interests panel (categories + orgs) becomes the alert filter:
unmuted categories/orgs generate push notifications; muted ones stay
available in the map/list view but silent. This reuses existing UI, not new
UI.

## 4. Data model

Extend the demo's per-zip bucket into geocoded, independently addressable
impact records:

```
ImpactEvent {
  id
  orgId              -> Org               // primary implementer
  supportingOrgIds[]  -> Org[]              // funders, co-plaintiffs, coalition members
  relationship         "led" | "funded" | "co_litigated" | "coalition_member" | "amplified"
  category             one of the existing category ids (env_health, climate, land, justice, ...)
  status                "delivered" | "in_progress" | "involved_action"
  geo                   { type: "point" | "polygon", coordinates, radiusMeters? }
  placeName             "Turkey Point Nuclear Plant" / "Hudson River Park, Pier 26"
  summary, issue, why, done, outcome     // same fields as the demo, unchanged
  links[]                { url, label }
  dateRange              { start, end? }   // for "in progress" recency and sorting
}

Org {
  id, name, emoji, shortDesc, about, what, how, link
  parentOrgId?           // e.g. sc_nyc's parent is sc_atlantic
  fundingRelationships[]  { toOrgId, type: "grants_to" | "member_of" | "coalition_partner" }
}
```

`relationship` + `fundingRelationships` are what let the app answer "indirect"
impact honestly: an event can be organized around one org's geofence radius
even when that org's own role was purely financial, and the UI can render the
true chain instead of flattening it.

### Geocoding pipeline
The demo's data was clearly hand-written/LLM-assisted per zip. For the
product, each `ImpactEvent` needs one real coordinate or footprint, not a zip
centroid. Practical sourcing, roughly in order of effort:
1. **Nonprofit-supplied structured data** — partner orgs (Sierra Club chapters,
   local land trusts, etc.) submit event + location directly. Best quality,
   requires partnership relationships.
2. **Public record mining** — court dockets, agency dockets (NRC, PUCO, city
   planning ULURP filings), press releases — geocoded via place-name
   extraction against a places API, human-reviewed before publish.
3. **Existing org content** — org blog posts/annual reports, LLM-extracted
   into the `ImpactEvent` shape (this is effectively what generated the demo
   data), geocoded, then reviewed. This is the fastest path to seed a city,
   but needs an editorial review step before anything ships — misplacing a
   pin or overstating an org's role is a credibility risk for both the app
   and the org.

## 5. System architecture

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Mobile app │◄────►│   API (REST/GQL)  │◄────►│  PostGIS-backed  │
│ (RN/Swift/  │      │  - nearby query   │      │  events + orgs   │
│  Kotlin)    │      │  - org graph      │      │  spatial index   │
└──────┬──────┘      │  - user prefs     │      └─────────────────┘
       │             └────────┬─────────┘
       │ geofence                │
       │ registrations           │ content pipeline
       ▼                         ▼
┌─────────────┐      ┌──────────────────┐
│  OS geofence│      │  Ingestion:       │
│  APIs       │      │  partner feeds +  │
│ (iOS region │      │  public records + │
│  monitoring,│      │  editorial review │
│  Android    │      └──────────────────┘
│  Geofencing │
│  Client)    │
└─────────────┘
       │
       ▼
  Push notification
  (APNs / FCM)
```

### 5.1 Client
React Native (reuses the demo's React component logic almost directly —
`CategoryGroupedList`, `OrgSheet`, `InterestsPanel`, `SearchModal` all port
with minimal change) for iOS/Android, or native if platform-specific
background geofencing behavior becomes a bottleneck. The demo's card
rendering, tab structure, and skin system carry over as-is.

### 5.2 Geofencing, not tracking
This is the most important constraint in the whole design: **the app should
never receive a raw, continuous GPS stream server-side.**
- Use OS-native geofencing (iOS `CLLocationManager` region monitoring,
  Android `Geofencing Client`) — the OS wakes the app only on boundary
  crossing, at OS-managed power cost, not app-managed polling.
- The client downloads geofence definitions for the user's metro area/region
  in the background (updated periodically or on significant location
  change), registers a bounded number of them locally (iOS caps ~20
  concurrent regions per app — needs a windowing strategy keyed to the
  user's current area, not "register everything").
- Location never needs to leave the device except as a coarse region (metro
  area) to fetch the relevant geofence set. No fine-grained location log is
  sent to or stored on the server.

### 5.3 Backend
- Spatial queries (`nearby(lat, lng, radius)`, `withinBounds(bbox)`) via
  PostGIS.
- Org graph queries for the relationship-chain UI (§3.3) — a handful of
  joins, doesn't need a graph database at this scale.
- Editorial/CMS layer for the ingestion pipeline in §4, since public-record
  and org-content-derived events need human review before publish.

## 6. Privacy

- Geofencing is opt-in, explained concretely at the permission prompt ("we
  use this to alert you within ~150m of a place with a story, and never
  store your location history").
- No location history is retained server-side; only which geofence *set* was
  downloaded (metro-area granularity) for the purpose of syncing new events.
- Muting an org/category is immediate and local; it also stops future
  geofence registrations for that org/category so the client doesn't even
  hold data it won't alert on.
- No location data is sold, shared with, or made queryable by the nonprofit
  partners themselves — orgs get aggregate, anonymized "N alerts fired near
  this event" analytics, not who received them.

## 7. Content integrity

Because this app makes factual claims about what a specific 501(c)(3) did,
and ties those claims to organizations by name:
- Every `ImpactEvent` needs a source link (the demo already has
  `bulletLink`/`links[]` — keep this mandatory, not optional).
- The `relationship` field must be conservative: don't render "led" unless a
  primary source supports it; default ambiguous cases to `"coalition_member"`
  or `"amplified"` rather than overstating an org's role.
- A correction/dispute path (both for orgs disputing their own attribution
  and for users flagging inaccuracies) is a v1 requirement, not a
  nice-to-have, given the app is making public claims about real
  organizations' track records.

## 8. Rollout plan

1. **Phase 0 (done):** Web demo — zip-scoped browsing, hand-curated Sierra
   Club data, skin system, org sheets. Proves the content model.
2. **Phase 1 — Map, not zip search:** Turn the demo into a real map view with
   geocoded pins for the same dataset, no native app yet (PWA). Proves the
   geocoding pipeline and validates pin density is worth alerting on.
3. **Phase 2 — Native app, manual check-in alerts:** Ship iOS/Android app
   with geofencing for a single metro area (e.g. NYC, reusing existing
   data), foreground-only alerts first (safer to ship, easier to debug than
   background wake behavior) before enabling background geofence pushes.
4. **Phase 3 — Background alerts + second org partner:** Turn on background
   geofencing; onboard a second nonprofit (different cause area) to prove
   the org/skin model generalizes beyond Sierra Club and beyond
   environmental causes.
5. **Phase 4 — Self-serve org onboarding:** Let nonprofits submit their own
   `ImpactEvent`s through a partner portal, subject to the editorial review
   step in §4, to scale content beyond what a small editorial team can
   hand-curate.

## 9. Open questions

- **Density/noise tuning:** in a dense city with many overlapping geofences,
  what's the alert frequency ceiling before it feels like spam? Likely needs
  a daily cap and a "batch into one summary" fallback rather than one push
  per crossing.
- **Attribution disputes:** what's the process when an org disagrees with
  how its role is characterized, especially on `"in_progress"` items where
  the outcome isn't settled?
- **Monetization:** partner-org licensing of a branded skin (as the demo
  already models) is the most obvious path, but needs to not create pressure
  to inflate a paying partner's role over accuracy (§7 exists partly to
  guard against this).
