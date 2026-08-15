#!/usr/bin/env node
// Offline data-capture tool — NOT part of the deployed app, never runs on
// Vercel, never touches a site visitor. You run this yourself, by hand,
// when you want to add or check a location. It researches real nonprofit
// impact near a place (grounded with real web search, cited, never
// fabricating — same prompt/schema built and tested earlier for the live
// search feature) and writes a draft file for YOU to review before any of
// it goes anywhere near the live app's data.
//
// Usage:
//   GEMINI_API_KEY=... node scripts/research.mjs "1045 NE 87th St, Miami, FL 33138"
//   GEMINI_API_KEY=... node scripts/research.mjs "Hyde Park, Chicago" --topic "clean water"
//
// Get a free key at https://aistudio.google.com/apikey
//
// Output: a draft JSON file in data/drafts/<slug>.json — organizations,
// each with cited accomplishments/planned activities, plus the geocoded
// coordinates of the place you searched (captured now so we have real
// examples to design the geographic-scope model against later, even
// though nothing does anything with that anchor yet).

import fs from "node:fs";
import path from "node:path";

const CATEGORY_IDS = ["env_health", "climate", "land", "justice"];

const LOCALITY_LEVELS = ["hyperlocal", "regional"];

const BULLET_SCHEMA = {
  type: "object",
  properties: {
    category: { type: "string", enum: CATEGORY_IDS },
    text: { type: "string" },
    link: { type: "string" },
    linkLabel: { type: "string" },
    // hyperlocal: this claim would be notably weaker or false for a place
    // 10+ miles away elsewhere in the region — it's genuinely about HERE.
    // regional: true, real, cited — but equally true across the metro
    // area/county. Not wrong to include, just shouldn't outrank something
    // that's actually specific to this exact place. Default to regional
    // unless there's a concrete, specific reason it isn't.
    locality: { type: "string", enum: LOCALITY_LEVELS },
  },
  required: ["category", "text", "link", "linkLabel", "locality"],
  additionalProperties: false,
};

const RESULT_SCHEMA = {
  type: "object",
  properties: {
    organizations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          emoji: { type: "string" },
          overview: { type: "string" },
          link: { type: "string" },
          accomplishments: { type: "array", items: BULLET_SCHEMA },
          plannedActivities: { type: "array", items: BULLET_SCHEMA },
        },
        required: ["name", "emoji", "overview", "link", "accomplishments", "plannedActivities"],
        additionalProperties: false,
      },
    },
  },
  required: ["organizations"],
  additionalProperties: false,
};

function systemPrompt() {
  return `You are a careful local-impact researcher for a civic app. Given a place, and optionally a topic, use web search to identify REAL, VERIFIABLE non-profit organizations, grassroots groups, or regional coalitions with notable impact there. If no topic is given, cover a genuine range of causes there rather than fixating on one.

For each organization, structure your findings as:
- overview: a 1-2 sentence description of who they are and their core mission in this region.
- accomplishments: 2-3 concrete, real-world victories they have achieved (specific laws challenged, policy changes won, funds raised, or programs successfully delivered). Each one is its own bullet with its own citation link.
- plannedActivities: their current campaigns, upcoming projects, or planned initiatives, each paired with the specific, measurable impact they hope to achieve. Each one is its own bullet with its own citation link.

Rules:
- Every bullet must be backed by a specific web page you found via search — put its URL in that bullet's link and a short human-readable label in linkLabel. Never reuse a placeholder or guessed URL.
- Never invent facts, dates, dollar amounts, or outcomes. If a claim can't be backed by a real source you found, drop that bullet rather than guessing.
- Keep bullet language direct, factual, and easy to scan.
- category (per bullet) must be the single best fit from: env_health (environmental health, clean air/water), climate (climate & energy), land (parks, green space, land use), justice (community, racial, or environmental justice, civic advocacy).
- Return at most 4 organizations. If you find fewer well-sourced organizations, return fewer — do not pad with weak or unverifiable ones. An organization with zero verifiable accomplishments or planned activities should be dropped. If you find nothing solid, return an empty organizations array — that is a correct, honest answer.
- Prefer local or regional organizations over large national ones when both exist for the same topic and place.

Grading each bullet's "locality" — this is the most important rule, apply it strictly:
- Ask yourself: "would this exact claim be meaningfully weaker or false for a place 10+ miles away, elsewhere in the same metro area or county?" If yes, tag it "hyperlocal" — it's tied to a specific facility, waterway, district, jurisdiction, or documented neighborhood-specific program near THIS place.
- If the claim is true broadly across the whole metro area/county/state and isn't more true here than anywhere else in it, tag it "regional." A regional claim is still real and worth including — just be honest that it's about the wider area, not this specific place. Default to "regional" whenever you're not certain.
- If a bullet's local relevance depends on a fact about this specific address/block/neighborhood that you could not verify (e.g., whether this exact area has a specific zoning designation, is on septic vs. sewer, sits in a particular flood zone or district), say so explicitly in the bullet's own text — e.g., "if this area is on septic..." — rather than stating it as certain. Do not silently assume a property-specific fact you have not confirmed.`;
}

function userPrompt(topic, locationLabel) {
  return topic
    ? `Please research and identify non-profit organizations, grassroots groups, or regional coalitions working on the following topic(s): ${topic}, within the following geographical area: ${locationLabel}.`
    : `Please research and identify non-profit organizations, grassroots groups, or regional coalitions with notable recent impact within the following geographical area: ${locationLabel}. Cover a genuine range of causes there rather than fixating on one.`;
}

// Free, no-key geocoding — same OpenStreetMap Nominatim service the app's
// own api/geocode.js uses, called directly here since this script runs
// outside Vercel.
async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "LocalImpact-Demo-Research-Tool/1.0 (https://github.com/hervejb/localimpact-demo)",
      "Accept-Language": "en",
    },
  });
  if (!response.ok) throw new Error(`Geocoding failed: HTTP ${response.status}`);
  const results = await response.json();
  if (!Array.isArray(results) || !results.length) throw new Error(`Could not geocode "${query}" — try a more specific address or place name.`);
  const r = results[0];
  return { lat: parseFloat(r.lat), lon: parseFloat(r.lon), displayName: r.display_name };
}

async function researchGemini(apiKey, topic, locationLabel) {
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      model: "gemini-3.6-flash",
      system_instruction: systemPrompt(),
      input: userPrompt(topic, locationLabel),
      tools: [{ type: "google_search" }],
      response_format: { type: "text", mime_type: "application/json", schema: RESULT_SCHEMA },
    }),
  });
  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`Gemini API error (HTTP ${response.status}): ${raw}`);
  }
  const data = JSON.parse(raw);
  const steps = Array.isArray(data.steps) ? data.steps : [];
  const modelOutput = steps.find(s => s.type === "model_output");
  const textPart = modelOutput && Array.isArray(modelOutput.content)
    ? modelOutput.content.find(c => c.type === "text")
    : null;
  if (!textPart || !textPart.text) {
    throw new Error(`Unexpected Gemini response shape — no model_output text found. Full response:\n${raw}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(textPart.text);
  } catch (e) {
    throw new Error(`Gemini didn't return valid JSON. Raw text:\n${textPart.text}`);
  }
  return Array.isArray(parsed.organizations) ? parsed.organizations : [];
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
}

async function main() {
  const args = process.argv.slice(2);
  const topicIdx = args.indexOf("--topic");
  const topic = topicIdx >= 0 ? args[topicIdx + 1] : "";
  const locationQuery = (topicIdx >= 0 ? args.slice(0, topicIdx) : args).join(" ").trim();

  if (!locationQuery) {
    console.error('Usage: GEMINI_API_KEY=... node scripts/research.mjs "<location>" [--topic "<topic>"]');
    process.exit(1);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set. Get a free key at https://aistudio.google.com/apikey and run:\n  GEMINI_API_KEY=your-key node scripts/research.mjs \"...\"");
    process.exit(1);
  }

  console.log(`Geocoding "${locationQuery}"...`);
  const geo = await geocode(locationQuery);
  console.log(`  -> ${geo.displayName}\n  -> ${geo.lat}, ${geo.lon}`);

  console.log(`\nResearching${topic ? ` "${topic}"` : " (no topic — broad scan)"} near ${geo.displayName}...`);
  const organizations = await researchGemini(apiKey, topic, geo.displayName);

  // Hyperlocal first within each list — a claim genuinely about this place
  // should outrank one that's just true regionally, not sit alongside it
  // with equal weight.
  const byLocality = (a, b) => (a.locality === "hyperlocal" ? 0 : 1) - (b.locality === "hyperlocal" ? 0 : 1);
  for (const org of organizations) {
    org.accomplishments = [...(org.accomplishments || [])].sort(byLocality);
    org.plannedActivities = [...(org.plannedActivities || [])].sort(byLocality);
  }

  const draft = {
    query: locationQuery,
    topic: topic || null,
    capturedAt: new Date().toISOString(),
    capturedNear: { lat: geo.lat, lon: geo.lon, displayName: geo.displayName },
    organizations,
  };

  const draftsDir = path.join(process.cwd(), "data", "drafts");
  fs.mkdirSync(draftsDir, { recursive: true });
  const filename = `${slugify(locationQuery)}${topic ? "-" + slugify(topic) : ""}.json`;
  const filepath = path.join(draftsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(draft, null, 2));

  console.log(`\n${organizations.length} organization(s) found. Draft written to ${path.relative(process.cwd(), filepath)}\n`);
  for (const org of organizations) {
    console.log(`- ${org.name} (${org.accomplishments.length} accomplishment(s), ${org.plannedActivities.length} planned)`);
    for (const b of [...org.accomplishments, ...org.plannedActivities]) {
      console.log(`    [${b.locality === "hyperlocal" ? "📍 hyperlocal" : "🌐 regional  "}] [${b.category}] ${b.text}`);
      console.log(`      source: ${b.link}`);
    }
  }
  console.log(`\nReview every citation link before trusting this — grounded search still occasionally overstates or misreads a source.`);
  console.log(`Also sanity-check the locality tags: "regional" bullets are honest, but shouldn't dominate a location's list — if everything comes back regional, the search may need a tighter, more specific topic or a smaller place name.`);
}

main().catch(err => {
  console.error(`\nFailed: ${err.message}`);
  process.exit(1);
});
