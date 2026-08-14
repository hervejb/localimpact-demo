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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // No key configured — fail open with an empty result, not an error.
    res.status(200).json({ items: [] });
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
