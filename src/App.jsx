import { useState, useEffect, createContext, useContext } from "react";

// Shared category palette — vivid, distinct hues so a category reads by
// color alone at a glance, and stays constant no matter which skin is active.
const CATEGORIES = [
  { id: "env_health", label: "Environmental Health", icon: "🌬️", color: "#0D9488", bg: "#CCFBF1", border: "#5EEAD4" },
  { id: "climate",    label: "Climate & Energy",     icon: "⚡",  color: "#EA580C", bg: "#FFEDD5", border: "#FDBA74" },
  { id: "land",       label: "Land & Green Space",   icon: "🌳", color: "#16A34A", bg: "#DCFCE7", border: "#86EFAC" },
  { id: "justice",    label: "Community & Justice",  icon: "✊", color: "#7C3AED", bg: "#EDE9FE", border: "#C4B5FD" },
];

const SKINS = {
  civic: {
    id: "civic", appName: "LocalImpact", logo: "🏙️",
    tagline: "Who\'s been fighting for where you live",
    primaryColor: "#0369A1", accentColor: "#F59E0B",
    headerGradient: "linear-gradient(135deg, #0C4A6E 0%, #0284C7 55%, #22D3EE 100%)",
    bgColor: "#F0F9FF", shellBg: "#D6ECF7",
    tintBg: "#E0F2FE", tintBorder: "#7DD3FC",
    menuLabel: "General / Civic",
    menuDesc: "Everyone fighting for your neighborhood",
    tabs: { delivered: "Won for you", inProgress: "Fighting for you" },
    categories: CATEGORIES,
  },
  sierra_club: {
    id: "sierra_club", appName: "LocalImpact", logo: "🌿",
    tagline: "Sierra Club\'s work in your neighborhood",
    primaryColor: "#059669", accentColor: "#F97316",
    headerGradient: "linear-gradient(135deg, #059669 0%, #10B981 55%, #34D399 100%)",
    bgColor: "#F6FDF9", shellBg: "#DCEFE1",
    tintBg: "#E6F9EF", tintBorder: "#9FE6BE",
    menuLabel: "Sierra Club",
    menuDesc: "Sierra Club\'s impact and campaigns",
    tabs: { delivered: "What we\'ve won", inProgress: "Fights in progress", involved: "Get involved" },
    categories: CATEGORIES,
  },
};

const CContext = createContext({});
const SkinContext = createContext({});
function makeC(s) {
  return { bg: s.bgColor, white: "#FFFFFF", forest: "#1E1B2E", green: s.primaryColor,
    headerGradient: s.headerGradient,
    greenLight: s.tintBg, borderGreen: s.tintBorder, border: "#E7E5EF",
    textMid: "#55535F", textLight: "#93909E", amber: s.accentColor };
}


// Lightweight, fully client-side matcher behind the "what do you care about?"
// input — no backend/LLM call, just narrows which categories to show among
// whatever live search already returned for the current location.
const CATEGORY_KEYWORDS = {
  env_health: ["air", "asthma", "pollution", "clean air", "water quality", "drinking water", "diesel", "smog", "toxic", "lead", "chemical", "health", "clean water"],
  climate:    ["climate", "energy", "solar", "wind", "renewable", "carbon", "emissions", "coal", "gas", "power plant", "fossil fuel", "warming", "sea level", "flood"],
  land:       ["park", "parks", "tree", "trees", "green space", "nature", "wildlife", "forest", "waterfront", "hiking", "outdoors", "conservation", "garden"],
  justice:    ["justice", "equity", "community", "low-income", "vulnerable", "frontline", "advocacy", "policy", "organizing", "civic", "fairness"],
};
function matchInterests(text) {
  const q = text.toLowerCase();
  if (!q.trim()) return { categories: [] };
  return {
    categories: Object.keys(CATEGORY_KEYWORDS).filter(id => CATEGORY_KEYWORDS[id].some(kw => q.includes(kw))),
  };
}


const TABS = [
  { id:"delivered",  tense:"past"    },
  { id:"inProgress", tense:"present" },
];
const TAB_COLORS = {
  delivered:  { dot:"#0369A1", active:"#0369A1", activeBg:"#E0F2FE", border:"#7DD3FC" },
  inProgress: { dot:"#0369A1", active:"#0369A1", activeBg:"#E0F2FE", border:"#7DD3FC" },
};
const STORY_LABELS = {
  past:    ["The issue","Why it mattered","What was done","What happened"],
  present: ["The issue","Why it matters","What is being done","Where things stand"],
};
// localStorage keys so a manually chosen location and saved criteria stick
// across a page reload instead of silently resetting to the defaults.
const STORAGE_KEYS = {
  location: "localimpact.location",
  geoStatus: "localimpact.geoStatus",
  interests: "localimpact.interests",
};

function readStoredLocation() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.location);
    const savedStatus = window.localStorage.getItem(STORAGE_KEYS.geoStatus);
    if (!raw || savedStatus !== "manual") return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.label !== "string" || typeof parsed.lat !== "number" || typeof parsed.lon !== "number") return null;
    return parsed;
  } catch {}
  return null;
}

function readStoredInterests() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.interests);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      query: typeof parsed.query === "string" ? parsed.query : "",
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
    };
  } catch {}
  return null;
}

// Resolves a typed/dictated location description to a real place via
// /api/geocode (which proxies OpenStreetMap Nominatim server-side). There is
// no local dataset to match against — every location is looked up live,
// every time. Never throws: any failure just resolves to null, so the
// caller's "couldn't find that, do nothing" handling covers it for free.
async function geocodeLocation(text) {
  try {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(text)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.lat == null || data.lon == null || !data.label) return null;
    return { lat: data.lat, lon: data.lon, label: data.label };
  } catch {
    return null;
  }
}

// Same idea, reversed: turns a sensed GPS position into a real place name,
// via the same /api/geocode endpoint in reverse mode.
async function reverseGeocodeLocation(lat, lon) {
  try {
    const res = await fetch(`/api/geocode?lat=${lat}&lon=${lon}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.lat == null || data.lon == null || !data.label) return null;
    return { lat: data.lat, lon: data.lon, label: data.label };
  } catch {
    return null;
  }
}

// Calls the /api/search serverless function — every location and topic is a
// live, web-search-grounded lookup, every time, no static dataset. The
// default — no topic typed yet — is just the location itself: search
// whatever's notable there, the way a search engine would, rather than
// presupposing a fixed set of categories to look for. Never throws: a
// missing API key, a network error, or a bad response all resolve to an
// empty result, so the caller can always just await it.
async function searchLive(topic, locationLabel) {
  const empty = { delivered: [], inProgress: [] };
  try {
    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, locationLabel }),
    });
    if (!res.ok) return empty;
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];
    const toLiveItem = i => ({
      summary: i.summary, issue: i.issue, why: i.why, done: i.done, outcome: i.outcome,
      category: i.category, org: i.org, bulletLink: i.bulletLink, bulletLinkLabel: i.bulletLinkLabel,
      live: true,
    });
    return {
      delivered: items.filter(i => i.tense === "past").map(toLiveItem),
      inProgress: items.filter(i => i.tense === "present").map(toLiveItem),
    };
  } catch {
    return empty;
  }
}

// Every result now comes from live search, so `org` is always the full
// profile returned inline with the story — there's no curated catalog to
// look an id up in anymore.
function OrgSheet({ org, onClose }) {
  const C = useContext(CContext);
  if (!org) return null;
  return (
    <div onClick={onClose} style={{ position:"absolute", inset:0, zIndex:400, background:"rgba(0,0,0,0.4)", display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
      <div onClick={e => e.stopPropagation()} style={{ background:C.white, borderRadius:"20px 20px 0 0", padding:"24px 20px 40px", maxHeight:"75%", overflowY:"auto" }}>
        <div style={{ width:36, height:4, background:C.border, borderRadius:2, margin:"0 auto 20px" }} />
        <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:16 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:C.greenLight, border:`1px solid ${C.borderGreen}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{org.emoji}</div>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:C.forest, marginBottom:3 }}>{org.name}</div>
            <div style={{ fontSize:12, color:C.textLight }}>{org.shortDesc}</div>
          </div>
        </div>
        {[["Who they are", org.about],["What they do", org.what],["How to get involved", org.how]].map(([label, text], i) => (
          <div key={i} style={{ marginBottom:16 }}>
            <div style={{ fontSize:10, fontWeight:700, color:C.green, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>{label}</div>
            <div style={{ fontSize:13, color:C.textMid, lineHeight:1.7 }}>{text}</div>
          </div>
        ))}
        <a href={org.link} target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, width:"100%", padding:14, borderRadius:14, background:C.green, color:C.white, fontSize:14.5, fontWeight:700, textDecoration:"none", boxShadow:`0 6px 16px ${C.green}55` }}>
          Visit {org.name} ↗
        </a>
        <div onClick={onClose} style={{ textAlign:"center", marginTop:14, fontSize:13, color:C.textLight, cursor:"pointer" }}>Close</div>
      </div>
    </div>
  );
}

function StoryCard({ item, tense, tabId, onOrgClick }) {
  const C = useContext(CContext);
  const [open, setOpen] = useState(false);
  const cat = CATEGORIES.find(c => c.id === item.category) || { color: TAB_COLORS[tabId].active };
  const labels = STORY_LABELS[tense];
  const storyFields = [item.issue, item.why, item.done, item.outcome];
  const org = item.org;
  return (
    <div style={{ marginBottom:12 }}>
      <div onClick={() => setOpen(!open)}
        style={{ cursor:"pointer", background:C.white, borderRadius:16, borderLeft:`5px solid ${cat.color}`,
          boxShadow: open ? `0 6px 16px ${cat.color}30` : "0 1px 3px rgba(30,20,50,0.07)",
          padding:"14px 14px 14px 13px", transition:"box-shadow 0.15s" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
          <span style={{ flex:1, fontSize:15, fontWeight:650, lineHeight:1.5, color:C.forest }}>{item.summary}</span>
          <span style={{ color:cat.color, fontSize:17, fontWeight:700, flexShrink:0, width:20, textAlign:"center", lineHeight:1 }}>{open ? "−" : "+"}</span>
        </div>
        <div style={{ fontSize:10, fontWeight:700, color:C.textLight, marginTop:6 }}>🔎 Found via live search — verify before relying on this</div>
        {org && (
          <div onClick={e => { e.stopPropagation(); onOrgClick(org); }}
            style={{ display:"flex", alignItems:"center", gap:7, marginTop:8, cursor:"pointer" }}>
            <span style={{ fontSize:14 }}>{org.emoji}</span>
            <span style={{ fontSize:12.5, fontWeight:700, color:C.green }}>{org.name}</span>
            <span style={{ fontSize:11, color:C.textLight, marginLeft:"auto" }}>→</span>
          </div>
        )}
      </div>
      {open && (
        <div style={{ marginTop:6, background:C.white, borderLeft:`5px solid ${cat.color}`, borderRadius:16, padding:16, fontSize:13.5, lineHeight:1.75, color:C.textMid, boxShadow:"0 1px 3px rgba(30,20,50,0.06)" }}>
          {storyFields.map((text, i) => text && (
            <div key={i} style={{ marginBottom:i < 3 ? 14 : 0 }}>
              <div style={{ fontSize:10, fontWeight:800, color:cat.color, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:4 }}>{labels[i]}</div>
              <div>{text}</div>
            </div>
          ))}
          {item.bulletLink && (
            <a href={item.bulletLink} target="_blank" rel="noopener noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:4, marginTop:4, fontSize:12.5, fontWeight:700, color:cat.color, textDecoration:"none", borderBottom:`1px solid ${cat.border || C.borderGreen}`, paddingBottom:1 }}>
              ↗ {item.bulletLinkLabel || "Source"}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function CategoryGroupedList({ items, tense, tabId, interests, onOrgClick }) {
  const C    = useContext(CContext);
  const skin = useContext(SkinContext);
  return (
    <div>
      {skin.categories.map((cat, ci) => {
        const catItems = items.filter(item =>
          item.category === cat.id &&
          (interests.categories.length === 0 || interests.categories.includes(cat.id))
        );
        if (catItems.length === 0) return null;
        return (
          <div key={cat.id}>
            {ci > 0 && <div style={{ height:14 }} />}
            <div style={{ marginBottom:12 }}>
              <span style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:11, fontWeight:800, letterSpacing:"0.03em", color:"#fff", background:cat.color, padding:"5px 12px 5px 8px", borderRadius:20, boxShadow:`0 2px 6px ${cat.color}55` }}>
                <span style={{ fontSize:13 }}>{cat.icon}</span>{cat.label}
              </span>
            </div>
            {catItems.map((item, i) => <StoryCard key={i} item={item} tense={tense} tabId={tabId} onOrgClick={onOrgClick} />)}
          </div>
        );
      })}
    </div>
  );
}

// One question, one box, one Save. Typing (or dictating) what someone cares
// about kicks off a live search at the current location on Save — no local
// dataset, no checklists, just a real lookup for exactly what was typed.
function PreferencesPanel({ interests, onSave, onClose }) {
  const C = useContext(CContext);
  const [query, setQuery]         = useState(interests.query || "");
  const [listening, setListening] = useState(false);
  const speechSupported = typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const dictate = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || listening) return;
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = e => {
      const transcript = e.results[0][0].transcript;
      setQuery(prev => (prev.trim() ? `${prev.trim()}, ${transcript}` : transcript));
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    setListening(true);
    recognition.start();
  };

  const save = () => {
    const matched = matchInterests(query);
    onSave({ query, categories: matched.categories });
  };

  return (
    <div style={{ position:"absolute", inset:0, zIndex:300, background:C.bg, display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"52px 20px 16px", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ fontFamily:"Fraunces, serif", fontSize:18, fontWeight:700, color:C.forest }}>Preferences</div>
        <div onClick={onClose} style={{ width:30, height:30, borderRadius:"50%", background:C.greenLight, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:13, color:C.textMid }}>✕</div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"4px 20px 100px" }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.textLight, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:4 }}>What do you care about?</div>
        <div style={{ fontSize:12, color:C.textLight, marginBottom:14 }}>Type or say it in your own words.</div>
        <div style={{ position:"relative" }}>
          <textarea value={query} onChange={e => setQuery(e.target.value)} rows={7}
            placeholder="e.g. clean air, parks and trees near me, climate change, protecting local wildlife…"
            spellCheck="true" autoCapitalize="sentences" autoCorrect="on"
            style={{ width:"100%", minHeight:190, border:`1.5px solid ${C.border}`, borderRadius:16, background:C.white, fontSize:15, lineHeight:1.6, color:C.forest, fontFamily:"Inter, sans-serif", padding:"16px 52px 16px 16px", resize:"vertical" }} />
          {speechSupported && (
            <div onClick={dictate} title="Dictate" style={{ position:"absolute", right:10, bottom:10, width:38, height:38, borderRadius:"50%", background:listening ? C.amber : C.greenLight, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", boxShadow:"0 2px 6px rgba(0,0,0,0.12)" }}>
              <span style={{ fontSize:16 }}>{listening ? "●" : "🎙️"}</span>
            </div>
          )}
        </div>
      </div>
      <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"16px 20px 32px", background:C.bg, borderTop:`1px solid ${C.border}` }}>
        <div onClick={save} style={{ background:C.green, borderRadius:14, padding:14, textAlign:"center", fontSize:15, fontWeight:700, color:"#fff", cursor:"pointer", boxShadow:`0 6px 16px ${C.green}55` }}>Save</div>
      </div>
    </div>
  );
}

// Type or dictate a location description (address, city, zip, neighborhood)
// and it's geocoded live — no local dataset to check first. Or fall back to
// re-sensing GPS via "Use my current location".
function LocationModal({ onSelectLocation, onUseCurrentLocation, onClose }) {
  const C = useContext(CContext);
  const [query, setQuery]         = useState("");
  const [listening, setListening] = useState(false);
  const [saving, setSaving]       = useState(false);
  const speechSupported = typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const dictate = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || listening) return;
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = e => setQuery(e.results[0][0].transcript);
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    setListening(true);
    recognition.start();
  };

  const save = async () => {
    if (saving || !query.trim()) return;
    setSaving(true);
    const resolved = await geocodeLocation(query);
    setSaving(false);
    if (resolved) onSelectLocation(resolved);
    onClose();
  };

  return (
    <div style={{ position:"absolute", inset:0, zIndex:300, background:C.bg, display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"52px 20px 16px", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ fontFamily:"Fraunces, serif", fontSize:18, fontWeight:700, color:C.forest }}>Change location</div>
        <div onClick={onClose} style={{ width:30, height:30, borderRadius:"50%", background:C.greenLight, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:13, color:C.textMid }}>✕</div>
      </div>
      <div style={{ flex:1, padding:"4px 20px 20px" }}>
        <div style={{ fontSize:12, color:C.textLight, marginBottom:14 }}>Type or say an address, city, or zip code.</div>
        <div style={{ display:"flex", alignItems:"center", gap:8, background:C.white, border:`1.5px solid ${C.border}`, borderRadius:14, padding:"4px 6px 4px 14px" }}>
          <input autoFocus value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && save()}
            placeholder="e.g. Miami Beach, 10025, Hyde Park…" spellCheck="true" autoCapitalize="words"
            style={{ flex:1, minWidth:0, border:"none", outline:"none", background:"transparent", fontSize:14, color:C.forest, fontFamily:"Inter, sans-serif", padding:"10px 0" }} />
          {speechSupported && (
            <div onClick={dictate} title="Dictate" style={{ width:34, height:34, borderRadius:"50%", flexShrink:0, background:listening ? C.amber : C.greenLight, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
              <span style={{ fontSize:14 }}>{listening ? "●" : "🎙️"}</span>
            </div>
          )}
        </div>

        <div onClick={save} style={{ marginTop:14, background:C.green, borderRadius:14, padding:14, textAlign:"center", fontSize:15, fontWeight:700, color:"#fff", cursor:"pointer", boxShadow:`0 6px 16px ${C.green}55`, opacity:saving ? 0.7 : 1 }}>{saving ? "Finding…" : "Save"}</div>

        <div style={{ display:"flex", alignItems:"center", gap:10, margin:"22px 0" }}>
          <div style={{ flex:1, height:1, background:C.border }} />
          <span style={{ fontSize:11, color:C.textLight, fontWeight:700, letterSpacing:"0.05em" }}>OR</span>
          <div style={{ flex:1, height:1, background:C.border }} />
        </div>

        <div onClick={() => { onUseCurrentLocation(); onClose(); }}
          style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, border:`1.5px solid ${C.borderGreen}`, background:C.greenLight, borderRadius:14, padding:14, cursor:"pointer" }}>
          <span style={{ fontSize:15 }}>📍</span>
          <span style={{ fontSize:14, fontWeight:700, color:C.green }}>Use my current location</span>
        </div>
      </div>
    </div>
  );
}

// Shown while a live search is in flight — every location change and every
// topic save triggers one, since there's no static dataset to show while
// waiting anymore.
function SearchInterstitial({ topic, locationLabel }) {
  const C = useContext(CContext);
  const trimmed = topic?.trim();
  const subtitle = trimmed
    ? `Searching for "${trimmed.length > 60 ? trimmed.slice(0, 60) + "…" : trimmed}"${locationLabel ? ` near ${locationLabel}` : ""}`
    : locationLabel ? `Searching near ${locationLabel}` : null;
  return (
    <div style={{ position:"absolute", inset:0, zIndex:500, background:C.headerGradient, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 40px", textAlign:"center" }}>
      <div style={{ fontSize:38, marginBottom:16, animation:"pulse 1.1s ease-in-out infinite" }}>🔍</div>
      <div style={{ fontFamily:"Fraunces, serif", fontSize:17, fontWeight:700, color:"#fff", marginBottom:6 }}>Finding who's fighting for you</div>
      {subtitle && <div style={{ fontSize:12, color:"rgba(255,255,255,0.8)" }}>{subtitle}</div>}
    </div>
  );
}

export default function App() {
  const [skinId]                          = useState("civic");
  const [initialManualLocation]           = useState(() => readStoredLocation());
  const [location, setLocation]           = useState(initialManualLocation);
  const [activeTab, setActiveTab]         = useState("delivered");
  const [searching, setSearching]         = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [activeOrg, setActiveOrg]         = useState(null);
  const [interests, setInterests]         = useState(() => readStoredInterests() || { query:"", categories:[] });
  const [geo, setGeo]                     = useState(() => initialManualLocation ? { status:"manual" } : { status:"locating" });
  const [loading, setLoading]             = useState(false);
  const [results, setResults]             = useState({ delivered:[], inProgress:[] });

  const skin = SKINS[skinId];
  const C    = makeC(skin);

  // Every location resolution ends here: a live search for the current (or
  // default) topic at that place. No static dataset backs any of this up.
  const runSearch = async (loc, topic) => {
    setLoading(true);
    const live = await searchLive(topic, loc.label);
    setResults(live);
    setLoading(false);
  };

  const locateMe = () => {
    if (!("geolocation" in navigator)) { setGeo({ status:"unsupported" }); return; }
    setGeo({ status:"locating" });
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords;
        const resolved = await reverseGeocodeLocation(latitude, longitude);
        if (!resolved) { setGeo({ status:"unsupported" }); return; }
        setLocation(resolved);
        setActiveTab("delivered");
        setGeo({ status:"sensed" });
        runSearch(resolved, interests.query);
      },
      () => setGeo({ status:"denied" }),
      { enableHighAccuracy:false, timeout:8000, maximumAge:5 * 60 * 1000 }
    );
  };

  // On mount: resume a persisted manual location with a fresh search, or
  // auto-sense via GPS if none was saved.
  useEffect(() => {
    if (initialManualLocation) runSearch(initialManualLocation, interests.query);
    else locateMe();
  }, []);

  // Persist the location choice so a page reload (routine on mobile — a
  // backgrounded or revisited tab) doesn't silently reset it. A manual pick
  // is remembered; explicitly re-sensing clears it so future reloads go
  // back to auto-sensing.
  useEffect(() => {
    try {
      if (geo.status === "manual" && location) {
        window.localStorage.setItem(STORAGE_KEYS.location, JSON.stringify(location));
        window.localStorage.setItem(STORAGE_KEYS.geoStatus, "manual");
      } else if (geo.status === "sensed") {
        window.localStorage.removeItem(STORAGE_KEYS.location);
        window.localStorage.removeItem(STORAGE_KEYS.geoStatus);
      }
    } catch {}
  }, [location, geo.status]);

  // Persist "what you care about" the same way, so it survives a reload too.
  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEYS.interests, JSON.stringify(interests)); } catch {}
  }, [interests]);

  const handleSelectLocation = loc => {
    setLocation(loc);
    setActiveTab("delivered");
    setGeo({ status:"manual" });
    runSearch(loc, interests.query);
  };

  const handleSavePreferences = updated => {
    setInterests(updated);
    setShowPreferences(false);
    if (location) runSearch(location, updated.query);
  };

  const tab          = TABS.find(t => t.id === activeTab);
  const items         = results[activeTab] || [];
  const hasPrefs      = interests.categories.length > 0;
  const noResultsHere = !loading && !!location && items.length === 0;
  const noLocationYet = !loading && !location && (geo.status === "denied" || geo.status === "unsupported");

  const locationLabel = location?.label || (geo.status === "locating" ? "Finding your location…" : "Set your location");
  return (
    <CContext.Provider value={C}>
    <SkinContext.Provider value={skin}>
    <div style={{ minHeight:"100vh", background:skin.shellBg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 20px", fontFamily:"Inter, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,900&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing:border-box; } ::-webkit-scrollbar { display:none; } input:focus, textarea:focus { outline:none; } a:hover { opacity:0.8; }
        @keyframes pulse { 0%, 100% { transform:scale(1); opacity:1; } 50% { transform:scale(1.15); opacity:0.7; } }
      `}</style>

      <div style={{ width:375, height:812, background:C.bg, borderRadius:52, flexShrink:0, boxShadow:"0 0 0 2px #C8C4BC, 0 0 0 4px #B0ACA4, 0 40px 80px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(255,255,255,0.7)", position:"relative", overflow:"hidden", display:"flex", flexDirection:"column" }}>

        <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:120, height:30, background:"rgba(0,0,0,0.28)", borderRadius:"0 0 20px 20px", zIndex:100 }} />

        <div style={{ background:C.headerGradient, flexShrink:0, borderRadius:"0 0 26px 26px", paddingBottom:18, boxShadow:"0 4px 20px rgba(0,0,0,0.12)" }}>
          <div style={{ height:30, display:"flex", alignItems:"flex-end", justifyContent:"flex-end", padding:"0 24px 6px" }}>
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.85)" }}>●●●● WiFi 87%</span>
          </div>

          <div style={{ padding:"6px 20px 0" }}>
            <div style={{ fontFamily:"Fraunces, serif", fontSize:21, fontWeight:900, color:"#fff", letterSpacing:"-0.02em", marginBottom:2 }}>
              {skin.logo} {skin.appName}
            </div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.85)" }}>{skin.tagline}</div>
            <div style={{ marginTop:12, display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
              <div onClick={() => setSearching(true)} title="Tap to change location" style={{ display:"flex", alignItems:"baseline", flexWrap:"wrap", gap:"2px 6px", cursor:"pointer" }}>
                <span style={{ fontSize:12, color:"#fff", alignSelf:"center", opacity:geo.status === "locating" ? 0.6 : 1 }}>📍</span>
                <span style={{ fontSize:14, fontWeight:700, color:"#fff" }}>{locationLabel}</span>
              </div>
              <div onClick={() => setShowPreferences(true)} title="Your topics" style={{ flexShrink:0, display:"flex", alignItems:"center", gap:5, cursor:"pointer" }}>
                <span style={{ fontSize:12.5, fontWeight:700, color:"#fff" }}>Your topics</span>
                {hasPrefs && <span style={{ width:7, height:7, borderRadius:"50%", background:C.amber, flexShrink:0 }} />}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display:"flex", flexShrink:0, margin:"16px 20px 0", background:C.greenLight, borderRadius:999, padding:4, gap:4 }}>
          {TABS.map(t => {
            const tc = TAB_COLORS[t.id];
            const isActive = activeTab === t.id;
            return (
              <div key={t.id} onClick={() => setActiveTab(t.id)} style={{ flex:1, textAlign:"center", padding:"8px 4px", fontSize:11, fontWeight:800, borderRadius:999, color:isActive ? "#fff" : C.textMid, background:isActive ? tc.active : "transparent", boxShadow:isActive ? `0 3px 8px ${tc.active}66` : "none", cursor:"pointer", lineHeight:1.3, transition:"background 0.15s" }}>
                {skin.tabs[t.id]}
              </div>
            );
          })}
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"16px 20px 32px" }}>
          {noLocationYet && (
            <div style={{ background:C.greenLight, border:`1px solid ${C.borderGreen}`, borderRadius:12, padding:"10px 14px", marginBottom:14, fontSize:12, color:C.textMid, lineHeight:1.4 }}>
              We couldn't find your location. Tap the location line above to set one.
            </div>
          )}
          {noResultsHere && (
            <div style={{ background:C.greenLight, border:`1px solid ${C.borderGreen}`, borderRadius:12, padding:"10px 14px", marginBottom:14, fontSize:12, color:C.textMid, lineHeight:1.4 }}>
              Nothing found {interests.query?.trim() ? `for "${interests.query.length > 50 ? interests.query.slice(0, 50) + "…" : interests.query}" ` : ""}near {location.label} yet. Try a different topic or location.
            </div>
          )}
          <CategoryGroupedList items={items} tense={tab.tense} tabId={activeTab} interests={interests} onOrgClick={setActiveOrg} />
        </div>

        {searching       && <LocationModal     onSelectLocation={handleSelectLocation} onUseCurrentLocation={locateMe} onClose={() => setSearching(false)} />}
        {activeOrg       && <OrgSheet          org={activeOrg} onClose={() => setActiveOrg(null)} />}
        {showPreferences && <PreferencesPanel  interests={interests} onSave={handleSavePreferences} onClose={() => setShowPreferences(false)} />}
        {loading         && <SearchInterstitial topic={interests.query} locationLabel={location?.label} />}

      </div>

      <div style={{ marginTop:16, fontSize:11, color:"#999", letterSpacing:"0.06em", textTransform:"uppercase", textAlign:"center" }}>
        Live search, every time
        {geo.status === "sensed"      && " · using your location"}
        {geo.status === "denied"      && " · location off"}
        {geo.status === "unsupported" && " · location unavailable"}
        {geo.status === "manual"      && " · manually selected"}
        {geo.status === "locating"    && " · locating…"}
      </div>
    </div>
    </SkinContext.Provider>
    </CContext.Provider>
  );
}
