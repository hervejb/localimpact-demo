// Vercel serverless function — free geocoding fallback for the "type or
// dictate a location" flow, using OpenStreetMap's Nominatim.
//
// The client already does local fuzzy matching against the 13 curated
// locations first (matchLocationQuery in App.jsx). This only runs when that
// fails — e.g. someone types "Fort Lauderdale" or a street address that
// isn't one of the curated neighborhood names. It geocodes the text to real
// coordinates so the app can snap to the nearest covered location exactly
// like GPS sensing does, instead of silently finding nothing.
//
// Nominatim is free and needs no API key, but its usage policy requires a
// real identifying User-Agent — set here since this runs server-side, which
// also avoids a browser CORS/User-Agent restriction. Never throws to the
// caller: any failure just resolves to { lat: null, lon: null }.

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ lat: null, lon: null });
    return;
  }

  const q = (req.query && req.query.q || "").toString().trim().slice(0, 200);
  if (!q) {
    res.status(200).json({ lat: null, lon: null });
    return;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "LocalImpact-Demo/1.0 (https://github.com/hervejb/localimpact-demo)",
        "Accept-Language": "en",
      },
    });
    if (!response.ok) {
      res.status(200).json({ lat: null, lon: null });
      return;
    }
    const results = await response.json();
    if (!Array.isArray(results) || !results.length) {
      res.status(200).json({ lat: null, lon: null });
      return;
    }
    const { lat, lon } = results[0];
    res.status(200).json({ lat: parseFloat(lat), lon: parseFloat(lon) });
  } catch (err) {
    res.status(200).json({ lat: null, lon: null });
  }
};
