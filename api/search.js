// Vercel serverless function — the "underlying prompt that generates data."
//
// Given a topic and a location, asks Claude (grounded with live web search)
// which real organizations have worked on that topic there, and returns it
// shaped to exactly what the UI's StoryCard/OrgSheet components need.
//
// Requires ANTHROPIC_API_KEY set as an environment variable in the Vercel
// project (Project Settings -> Environment Variables). Never exposed to the
// client — this file only runs server-side. If the key isn't set, or the
// call fails for any reason, this returns an empty result rather than an
// error, so the app just falls back to whatever's in the static dataset.

const Anthropic = require("@anthropic-ai/sdk");

const CATEGORY_IDS = ["env_health", "climate", "land", "justice"];

const RESULT_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          tense: { type: "string", enum: ["past", "present"] },
          category: { type: "string", enum: CATEGORY_IDS },
          summary: { type: "string" },
          issue: { type: "string" },
          why: { type: "string" },
          done: { type: "string" },
          outcome: { type: "string" },
          bulletLink: { type: "string" },
          bulletLinkLabel: { type: "string" },
          org: {
            type: "object",
            properties: {
              name: { type: "string" },
              emoji: { type: "string" },
              shortDesc: { type: "string" },
              about: { type: "string" },
              what: { type: "string" },
              how: { type: "string" },
              link: { type: "string" },
            },
            required: ["name", "emoji", "shortDesc", "about", "what", "how", "link"],
            additionalProperties: false,
          },
        },
        required: ["tense", "category", "summary", "issue", "why", "done", "outcome", "bulletLink", "bulletLinkLabel", "org"],
        additionalProperties: false,
      },
    },
  },
  required: ["items"],
  additionalProperties: false,
};

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
  return `You are a careful local-impact researcher for a civic app. Given a topic and a place, use web search to find REAL, VERIFIABLE nonprofit or civic organizations that have worked on that topic in or near that place.

Rules:
- Every item must be backed by a specific web page you found via search. Put that page's URL in bulletLink and a short human-readable label for it in bulletLinkLabel.
- Never invent facts, dates, dollar amounts, or outcomes. If you can't verify a specific claim, leave that item out rather than guessing.
- "tense: past" means a completed, verifiable win. "tense: present" means a genuinely active, ongoing effort you found real evidence for.
- category must be the single best fit from: env_health (environmental health, clean air/water), climate (climate & energy), land (parks, green space, land use), justice (community, racial, or environmental justice, civic advocacy).
- The org fields describe the ORGANIZATION itself, not the event — about/what/how should read like a short, accurate org bio, sourced from the org's own site or reliable coverage.
- Return at most 4 items. If you find fewer than 4 well-sourced results, return fewer — do not pad with weak or unverifiable ones. If you find nothing solid, return an empty items array. An empty result is a correct, honest answer.
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
  const zip = (body && body.zip || "").toString().trim().slice(0, 20);

  if (!topic) {
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
      max_tokens: 4096,
      system: systemPrompt(),
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 6 }],
      output_config: { format: { type: "json_schema", schema: RESULT_SCHEMA } },
      messages: [
        {
          role: "user",
          content: `Topic: ${topic}\nLocation: ${locationLabel || "unknown"}${zip ? ` (${zip})` : ""}\n\nWhich organizations have fought for ${topic} in or near ${locationLabel || "this location"}? Return the data needed to support the app's UI.`,
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

    const items = Array.isArray(parsed.items) ? parsed.items.slice(0, 4) : [];
    res.status(200).json({ items });
  } catch (err) {
    res.status(200).json({ items: [] });
  }
};
