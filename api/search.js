// Vercel serverless function — the "underlying prompt that generates data."
//
// Given a location, and optionally a topic, asks Claude (grounded with live
// web search) which real organizations have notable impact there, and
// returns it shaped to exactly what the UI's StoryCard/OrgSheet components
// need. No topic means "what's notable here" — location is the only
// required input; every call is a fresh, live lookup, not a cached dataset.
//
// Requires ANTHROPIC_API_KEY set as an environment variable in the Vercel
// project (Project Settings -> Environment Variables). Never exposed to the
// client — this file only runs server-side. If the key isn't set, or the
// call fails for any reason, this returns an empty result rather than an
// error, so the app degrades to the ProPublica fallback (topic only) or
// simply shows nothing.

const Anthropic = require("@anthropic-ai/sdk");

const CATEGORY_IDS = ["env_health", "climate", "land", "justice"];

// Asks Claude for results shaped per-ORGANIZATION (overview, then separate
// lists of accomplishment and planned-activity bullets, each individually
// cited) rather than one flat list of items — this is what actually
// produces multiple well-sourced bullets per org instead of a single thin
// summary. Each bullet is flattened into the client's existing "items"
// shape below (toItems), so the UI code needing no changes: a bullet under
// accomplishments becomes a "past" item, a bullet under plannedActivities
// becomes a "present" item, both carrying the same org info and their own
// individual citation link.
const BULLET_SCHEMA = {
  type: "object",
  properties: {
    category: { type: "string", enum: CATEGORY_IDS },
    text: { type: "string" },
    link: { type: "string" },
    linkLabel: { type: "string" },
  },
  required: ["category", "text", "link", "linkLabel"],
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

// Flattens the per-organization schema above into the flat item list the
// client already knows how to render (searchLive in App.jsx). issue/why are
// left blank — the bullet's own text plus its citation is the whole point,
// there's no separate "issue" narrative in this format.
function orgsToItems(organizations) {
  const items = [];
  for (const rawOrg of organizations.slice(0, 4)) {
    const org = {
      name: rawOrg.name,
      emoji: rawOrg.emoji || "🏢",
      shortDesc: rawOrg.overview,
      about: rawOrg.overview,
      what: rawOrg.overview,
      how: `Visit their site to find ways to volunteer or donate.`,
      link: rawOrg.link,
    };
    for (const b of (rawOrg.accomplishments || []).slice(0, 3)) {
      items.push({ tense: "past", category: b.category, summary: b.text, issue: "", why: "", done: b.text, outcome: "", bulletLink: b.link, bulletLinkLabel: b.linkLabel, org });
    }
    for (const b of (rawOrg.plannedActivities || []).slice(0, 3)) {
      items.push({ tense: "present", category: b.category, summary: b.text, issue: "", why: "", done: "", outcome: b.text, bulletLink: b.link, bulletLinkLabel: b.linkLabel, org });
    }
  }
  return items;
}

// Free fallback data source, used only when ANTHROPIC_API_KEY isn't set —
// e.g. so testers you invite can try the "ask anything anywhere" flow
// without needing your paid key. ProPublica's Nonprofit Explorer is free,
// needs no key, and covers every US 501(c)(3)'s IRS filings, but it's a
// name/registry search, not a topic search — it can't tell you who "fought
// for" something, only who's registered and roughly what field they're in.
// So results here are deliberately framed as "a registered nonprofit near
// you, worth looking into" rather than any claim about what they did —
// there's no filing data to back up an impact claim, so we don't make one.
function stateCodeFromLabel(locationLabel) {
  const m = /,\s*([A-Z]{2})\s*$/.exec((locationLabel || "").trim());
  return m ? m[1] : null;
}

async function searchProPublica(topic, locationLabel) {
  // ProPublica only supports a name/keyword search, not a "browse everything
  // near here" query — with no topic to search by, there's nothing sensible
  // to ask it. An empty result here is honest, not a failure.
  if (!topic) return [];
  const state = stateCodeFromLabel(locationLabel);
  const url = `https://projects.propublica.org/nonprofits/api/v2/search.json?q=${encodeURIComponent(topic)}${state ? `&state[id]=${state}` : ""}`;
  const response = await fetch(url);
  if (!response.ok) return [];
  const data = await response.json();
  const orgs = Array.isArray(data.organizations) ? data.organizations.slice(0, 4) : [];
  return orgs.map(org => {
    const city = org.city || "";
    const state = org.state || "";
    const place = [city, state].filter(Boolean).join(", ");
    return {
      tense: "present",
      category: "justice",
      summary: `${org.name} is a nonprofit registered ${place ? `in ${place}` : "near you"} — worth looking into for ${topic}.`,
      issue: "", why: "", done: "", outcome: "",
      bulletLink: `https://projects.propublica.org/nonprofits/organizations/${org.ein}`,
      bulletLinkLabel: "View filings on ProPublica",
      org: {
        name: org.name,
        emoji: "🏢",
        shortDesc: `Nonprofit registered ${place ? `in ${place}` : ""}.`.trim(),
        about: "Registered as a tax-exempt organization with the IRS. See its public filings for mission and finances.",
        what: "ProPublica's Nonprofit Explorer has its filed Form 990s — the most reliable public record of what it reports doing.",
        how: "Look up current contact info from its filings or website to ask about volunteering or donating.",
        link: `https://projects.propublica.org/nonprofits/organizations/${org.ein}`,
      },
    };
  });
}

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
- Prefer local or regional organizations over large national ones when both exist for the same topic and place.`;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ items: [] });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const topic = (body && body.topic || "").toString().trim().slice(0, 300);
  const locationLabel = (body && body.locationLabel || "").toString().trim().slice(0, 200);

  // Location is the one thing every search is anchored to — the default,
  // with no topic typed, is simply "what's notable here," the way arriving
  // somewhere with a search engine and no query in mind still shows results
  // for that place. A topic narrows it; it's never required to search at all.
  if (!locationLabel) {
    res.status(200).json({ items: [] });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // No Claude key configured — fall back to a free, no-key data source so
    // testers without your key still see something real, instead of just
    // an empty result.
    try {
      const items = await searchProPublica(topic, locationLabel);
      res.status(200).json({ items });
    } catch {
      res.status(200).json({ items: [] });
    }
    return;
  }

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 8192,
      system: systemPrompt(),
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 12 }],
      output_config: { format: { type: "json_schema", schema: RESULT_SCHEMA } },
      messages: [
        {
          role: "user",
          content: topic
            ? `Please research and identify non-profit organizations, grassroots groups, or regional coalitions working on the following topic(s): ${topic}, within the following geographical area: ${locationLabel}.`
            : `Please research and identify non-profit organizations, grassroots groups, or regional coalitions with notable recent impact within the following geographical area: ${locationLabel}. Cover a genuine range of causes there rather than fixating on one.`,
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      res.status(200).json({ items: [] });
      return;
    }

    const textBlocks = (response.content || []).filter(b => b.type === "text");
    const lastText = textBlocks.length ? textBlocks[textBlocks.length - 1].text : null;
    if (!lastText) {
      res.status(200).json({ items: [] });
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(lastText);
    } catch {
      res.status(200).json({ items: [] });
      return;
    }

    const organizations = Array.isArray(parsed.organizations) ? parsed.organizations : [];
    res.status(200).json({ items: orgsToItems(organizations) });
  } catch (err) {
    res.status(200).json({ items: [] });
  }
};
