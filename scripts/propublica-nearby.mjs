#!/usr/bin/env node
// Free, no-key discovery step — finds real, IRS-registered nonprofits
// actually near a location, using ProPublica's Nonprofit Explorer API
// (public 990 filing data) cross-referenced against real nearby zip codes.
//
// Why this exists: ProPublica's search endpoint only filters by STATE, not
// zip or distance — a "near me" search would otherwise return candidates
// from anywhere in Florida, say, with no way to tell which are actually
// close. This script closes that gap using a free, offline zip-code
// centroid dataset (GeoNames, bundled in data/zip-centroids.json) to
// compute which zips are genuinely within range, then fetches each
// candidate org's real registered address (a second free ProPublica call
// per candidate) to check it against that set.
//
// This only finds WHO is registered nearby — not what they've done. Feed
// promising names into scripts/research.mjs (or manual chat research) to
// find their actual cited accomplishments.
//
// Usage:
//   node scripts/propublica-nearby.mjs "1045 NE 87th St, Miami, FL 33138" --topic "housing"
//   node scripts/propublica-nearby.mjs "El Portal, FL" --topic "historic preservation" --radius 5

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ZIP_DATA_PATH = path.join(__dirname, "..", "data", "zip-centroids.json");

const STATE_NAME_TO_CODE = {
  alabama:"AL", alaska:"AK", arizona:"AZ", arkansas:"AR", california:"CA", colorado:"CO", connecticut:"CT",
  delaware:"DE", florida:"FL", georgia:"GA", hawaii:"HI", idaho:"ID", illinois:"IL", indiana:"IN", iowa:"IA",
  kansas:"KS", kentucky:"KY", louisiana:"LA", maine:"ME", maryland:"MD", massachusetts:"MA", michigan:"MI",
  minnesota:"MN", mississippi:"MS", missouri:"MO", montana:"MT", nebraska:"NE", nevada:"NV",
  "new hampshire":"NH", "new jersey":"NJ", "new mexico":"NM", "new york":"NY", "north carolina":"NC",
  "north dakota":"ND", ohio:"OH", oklahoma:"OK", oregon:"OR", pennsylvania:"PA", "rhode island":"RI",
  "south carolina":"SC", "south dakota":"SD", tennessee:"TN", texas:"TX", utah:"UT", vermont:"VT",
  virginia:"VA", washington:"WA", "west virginia":"WV", wisconsin:"WI", wyoming:"WY",
  "district of columbia":"DC",
};

function haversineMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
  const stateName = (r.address && r.address.state || "").toLowerCase();
  return {
    lat: parseFloat(r.lat), lon: parseFloat(r.lon), displayName: r.display_name,
    stateCode: STATE_NAME_TO_CODE[stateName] || null,
  };
}

function nearbyZips(lat, lon, radiusMiles, zipData) {
  const results = [];
  for (const [zip, [zlat, zlon, state]] of Object.entries(zipData)) {
    const d = haversineMiles(lat, lon, zlat, zlon);
    if (d <= radiusMiles) results.push({ zip, state, distanceMiles: Math.round(d * 10) / 10 });
  }
  return results.sort((a, b) => a.distanceMiles - b.distanceMiles);
}

async function searchProPublica(topic, stateCode) {
  const url = `https://projects.propublica.org/nonprofits/api/v2/search.json?q=${encodeURIComponent(topic)}${stateCode ? `&state[id]=${stateCode}` : ""}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`ProPublica search failed: HTTP ${response.status}`);
  const data = await response.json();
  return Array.isArray(data.organizations) ? data.organizations : [];
}

async function fetchOrgDetail(ein) {
  try {
    const response = await fetch(`https://projects.propublica.org/nonprofits/api/v2/organizations/${ein}.json`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.organization || null;
  } catch {
    return null;
  }
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
}

async function main() {
  const args = process.argv.slice(2);
  const topicIdx = args.indexOf("--topic");
  const radiusIdx = args.indexOf("--radius");
  const topic = topicIdx >= 0 ? args[topicIdx + 1] : "";
  const radiusMiles = radiusIdx >= 0 ? parseFloat(args[radiusIdx + 1]) : 10;
  const excludeIdx = [topicIdx, topicIdx + 1, radiusIdx, radiusIdx + 1].filter(i => i >= 0);
  const locationQuery = args.filter((_, i) => !excludeIdx.includes(i)).join(" ").trim();

  if (!locationQuery || !topic) {
    console.error('Usage: node scripts/propublica-nearby.mjs "<location>" --topic "<topic>" [--radius <miles>]');
    process.exit(1);
  }

  console.log(`Geocoding "${locationQuery}"...`);
  const geo = await geocode(locationQuery);
  console.log(`  -> ${geo.displayName}\n  -> ${geo.lat}, ${geo.lon} (state: ${geo.stateCode || "unknown"})`);

  console.log(`\nLoading zip-code centroid data...`);
  const zipData = JSON.parse(fs.readFileSync(ZIP_DATA_PATH, "utf8"));
  const nearby = nearbyZips(geo.lat, geo.lon, radiusMiles, zipData);
  const nearbyZipSet = new Set(nearby.map(z => z.zip));
  console.log(`  -> ${nearby.length} zip code(s) within ${radiusMiles} miles`);

  console.log(`\nSearching ProPublica for "${topic}" in ${geo.stateCode || "all states"}...`);
  const candidates = await searchProPublica(topic, geo.stateCode);
  const toCheck = candidates.slice(0, 20);
  console.log(`  -> ${candidates.length} statewide candidate(s), checking the top ${toCheck.length} for actual proximity...`);

  // A PO Box tells you almost nothing about where an org actually operates
  // — it's a materially weaker signal of real local presence than a street
  // address, even though both pass the same zip-radius check. Flag it
  // automatically rather than relying on a human to notice every time.
  const isPoBox = address => /^\s*(p\.?\s*o\.?\s*box|post office box)\b/i.test(address || "");

  const nearbyOrgs = [];
  for (const c of toCheck) {
    const detail = await fetchOrgDetail(c.ein);
    if (!detail || !detail.zipcode) continue;
    const orgZip = detail.zipcode.slice(0, 5);
    if (nearbyZipSet.has(orgZip)) {
      const zipInfo = nearby.find(z => z.zip === orgZip);
      const poBox = isPoBox(detail.address);
      nearbyOrgs.push({
        ein: c.ein, name: detail.name, address: detail.address, city: detail.city,
        state: detail.state, zip: orgZip, distanceMiles: zipInfo.distanceMiles,
        nteeCode: detail.ntee_code,
        link: `https://projects.propublica.org/nonprofits/organizations/${c.ein}`,
        addressConfidence: poBox ? "low (PO Box — not a real street presence)" : "normal",
      });
    }
  }
  nearbyOrgs.sort((a, b) => a.distanceMiles - b.distanceMiles);

  console.log(`\n${nearbyOrgs.length} of ${toCheck.length} checked candidate(s) are actually within ${radiusMiles} miles:\n`);
  if (!nearbyOrgs.length) {
    console.log(`None of the statewide candidates for "${topic}" are actually nearby — an honest result. ProPublica's registry may just not have a matching org close to this address; try a broader topic, a larger --radius, or a plain web search instead.`);
  }
  for (const o of nearbyOrgs) {
    const flag = o.addressConfidence !== "normal" ? `  ⚠️  ${o.addressConfidence}` : "";
    console.log(`- ${o.name} — ${o.distanceMiles} mi away${flag}`);
    console.log(`    ${o.address}, ${o.city}, ${o.state} ${o.zip}  [NTEE ${o.nteeCode || "?"}]`);
    console.log(`    ${o.link}`);
  }

  const draftsDir = path.join(process.cwd(), "data", "drafts");
  fs.mkdirSync(draftsDir, { recursive: true });
  const filepath = path.join(draftsDir, `propublica-nearby-${slugify(locationQuery)}-${slugify(topic)}.json`);
  fs.writeFileSync(filepath, JSON.stringify({
    query: locationQuery, topic, radiusMiles, capturedAt: new Date().toISOString(),
    capturedNear: { lat: geo.lat, lon: geo.lon, displayName: geo.displayName },
    statewideCandidateCount: candidates.length, checkedCount: toCheck.length,
    nearbyOrganizations: nearbyOrgs,
  }, null, 2));
  console.log(`\nWritten to ${path.relative(process.cwd(), filepath)}`);
  console.log(`This only confirms WHO is registered nearby, not what they've done — research any promising name here the same way we've done manually before finding a real citation.`);
}

main().catch(err => {
  console.error(`\nFailed: ${err.message}`);
  process.exit(1);
});
