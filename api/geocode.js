// Vercel serverless function — the real-time location resolver, using
// OpenStreetMap's free Nominatim service. There is no local dataset behind
// this: every typed location and every sensed GPS position is looked up
// live, every time, the same way a Google search would.
//
// Two modes, both returning { lat, lon, label }:
//   GET /api/geocode?q=<text>        forward: text -> coordinates
//   GET /api/geocode?lat=&lon=       reverse: coordinates -> a real place name
//
// Nominatim is free and needs no API key, but its usage policy requires a
// real identifying User-Agent — set here since this runs server-side, which
// also avoids a browser CORS/User-Agent restriction. Never throws to the
// caller: any failure just resolves to nulls, so the client's "couldn't
// find that" handling covers it for free.

const HEADERS = {
  "User-Agent": "LocalImpact-Demo/1.0 (https://github.com/hervejb/localimpact-demo)",
  "Accept-Language": "en",
};

const EMPTY = { lat: null, lon: null, label: null };

// Builds a short, human-readable label ("Chelsea, New York" or "Miami
// Beach, Florida") from Nominatim's address breakdown, instead of exposing
// its much longer full display_name.
function buildLabel(address, fallback) {
  if (!address) return fallback || null;
  const neighborhood = address.neighbourhood || address.suburb || address.quarter;
  const city = address.city || address.town || address.village || address.county;
  const parts = [neighborhood, city, address.state].filter(Boolean);
  // Drop consecutive duplicates — e.g. New York City's state is itself
  // named "New York", which would otherwise repeat as "New York, New York".
  const deduped = parts.filter((p, i) => p !== parts[i - 1]);
  return deduped.length ? deduped.join(", ") : (fallback || null);
}

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json(EMPTY);
    return;
  }

  const query = req.query || {};
  const lat = query.lat != null ? parseFloat(query.lat) : null;
  const lon = query.lon != null ? parseFloat(query.lon) : null;
  const q = (query.q || "").toString().trim().slice(0, 200);

  try {
    if (lat != null && lon != null && !Number.isNaN(lat) && !Number.isNaN(lon)) {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${lat}&lon=${lon}`;
      const response = await fetch(url, { headers: HEADERS });
      if (!response.ok) { res.status(200).json(EMPTY); return; }
      const result = await response.json();
      if (!result || result.lat == null) { res.status(200).json(EMPTY); return; }
      res.status(200).json({ lat: parseFloat(result.lat), lon: parseFloat(result.lon), label: buildLabel(result.address, result.display_name) });
      return;
    }

    if (!q) { res.status(200).json(EMPTY); return; }
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(q)}`;
    const response = await fetch(url, { headers: HEADERS });
    if (!response.ok) { res.status(200).json(EMPTY); return; }
    const results = await response.json();
    if (!Array.isArray(results) || !results.length) { res.status(200).json(EMPTY); return; }
    const result = results[0];
    res.status(200).json({ lat: parseFloat(result.lat), lon: parseFloat(result.lon), label: buildLabel(result.address, result.display_name) });
  } catch (err) {
    res.status(200).json(EMPTY);
  }
};
