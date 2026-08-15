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

const ORGS = {
  sc_atlantic: { id:"sc_atlantic", name:"Sierra Club Atlantic", emoji:"🌿", shortDesc:"Regional environmental advocacy",
    about:"The Sierra Club Atlantic Chapter covers New York, New Jersey, and nearby states. Founded in 1892, it is America\'s oldest and largest grassroots environmental organization.",
    what:"The Chapter campaigns for clean energy, clean air, clean water, and protected public lands through litigation, legislation, and community organizing.",
    how:"Attend local group meetings, join campaigns, volunteer for outings and advocacy events, or donate.",
    link:"https://www.sierraclub.org/atlantic" },
  sc_nyc: { id:"sc_nyc", name:"Sierra Club NYC Group", emoji:"🌿", shortDesc:"Manhattan & NYC environmental advocacy",
    about:"The NYC Group is Sierra Club\'s local chapter for the five boroughs, organizing residents around urban environmental issues.",
    what:"The NYC Group runs outings, advocates at Community Boards and City Hall, and mobilizes members around local campaigns.",
    how:"Attend open monthly meetings, join a campaign committee, or volunteer for river monitoring.",
    link:"https://www.sierraclub.org/atlantic/nyc" },
  sc_florida: { id:"sc_florida", name:"Sierra Club Florida", emoji:"🌿", shortDesc:"Statewide environmental advocacy in Florida",
    about:"Sierra Club Florida is the state chapter covering Florida, organizing on coastal resilience, clean water, and public lands protection statewide.",
    what:"The Chapter campaigns on wetlands and coastal protection, nuclear and utility oversight, and sea level rise adaptation through litigation, legislation, and coalition advocacy.",
    how:"Join a local group, attend public comment periods on state and municipal proposals, or donate.",
    link:"https://www.sierraclub.org/florida" },
  sc_illinois: { id:"sc_illinois", name:"Sierra Club Illinois", emoji:"🌿", shortDesc:"Statewide environmental advocacy in Illinois",
    about:"Sierra Club Illinois is the state chapter, a founding member of the Illinois Clean Jobs Coalition and active on clean energy, air quality, and water advocacy statewide.",
    what:"The Chapter campaigns for clean energy legislation, coal and fossil fuel plant accountability, and clean water protections through coalition organizing and legislative advocacy.",
    how:"Sign up for action alerts, join a local group, or volunteer for a campaign.",
    link:"https://www.sierraclub.org/illinois" },
  sc_ohio: { id:"sc_ohio", name:"Sierra Club Ohio", emoji:"🌿", shortDesc:"Statewide environmental advocacy in Ohio",
    about:"Sierra Club Ohio is the state chapter, engaged in utility oversight at the Public Utilities Commission of Ohio and water quality advocacy around Lake Erie and its watershed.",
    what:"The Chapter campaigns on utility rate cases, clean energy jobs, and agricultural runoff regulation through coalition advocacy and public utility proceedings.",
    how:"Sign up for action alerts, testify at PUCO hearings, or volunteer for a campaign.",
    link:"https://www.sierraclub.org/ohio" },
  weact: { id:"weact", name:"WE ACT for Env. Justice", emoji:"✊", shortDesc:"Environmental justice in Northern Manhattan",
    about:"WE ACT was founded in 1988 in West Harlem and is one of the oldest environmental justice organizations in the country.",
    what:"WE ACT organizes communities affected by pollution to demand policy change across air quality, climate resilience, and transportation equity.",
    how:"Attend community meetings, volunteer for outreach and advocacy events, or donate.",
    link:"https://www.weact.org" },
  ny_renews: { id:"ny_renews", name:"NY Renews", emoji:"⚡", shortDesc:"Statewide clean energy & climate justice",
    about:"NY Renews is a coalition of 300+ organizations that passed the CLCPA in 2019 — one of the strongest climate laws in the country.",
    what:"NY Renews advocates for equitable clean energy implementation and holds state agencies accountable for the CLCPA\'s equity requirements.",
    how:"Join a member organization, attend lobby days in Albany, or support member groups financially.",
    link:"https://www.nyrenews.org" },
  riverside_park: { id:"riverside_park", name:"Riverside Park Conservancy", emoji:"🌳", shortDesc:"Stewardship of Riverside Park",
    about:"The Conservancy partners with NYC Parks to maintain and advocate for Riverside Park — 4 miles of Hudson River parkland on the Upper West Side.",
    what:"The Conservancy runs environmental stewardship programs, community events, and advocates to protect the park from development.",
    how:"Volunteer for tree planting and cleanup events. Attend public meetings when park issues are on the agenda.",
    link:"https://www.riversideparknyc.org/volunteer" },
  hrp: { id:"hrp", name:"Hudson River Park Trust", emoji:"🌊", shortDesc:"Public stewardship of Hudson River Park",
    about:"The Trust manages Hudson River Park — a 550-acre public greenway from Battery Park City to 59th Street.",
    what:"The Trust manages piers, ecological restoration, and public programming along Manhattan\'s West Side waterfront.",
    how:"Volunteer for shoreline cleanup and oyster restoration. Attend Trust public meetings to advocate for park protection.",
    link:"https://www.hudsonriverpark.org" },
  central_park: { id:"central_park", name:"Central Park Conservancy", emoji:"🌿", shortDesc:"Stewardship of Central Park",
    about:"The Conservancy manages Central Park under contract with NYC, funding 75% of the park\'s annual budget.",
    what:"The Conservancy runs ecological restoration, tree care, and landscape stewardship across 843 acres.",
    how:"Volunteer for tree planting and woodland restoration. Donate to support stewardship programs.",
    link:"https://www.centralparknyc.org" },
  les_ecology: { id:"les_ecology", name:"LES Ecology Center", emoji:"♻️", shortDesc:"Environmental stewardship on the Lower East Side",
    about:"The LES Ecology Center has run community composting, environmental education, and waterfront stewardship on the Lower East Side since 1996.",
    what:"The Center operates compost sites, environmental monitoring, and advocacy around waterfront access and climate resilience.",
    how:"Volunteer at compost sites, participate in waterfront cleanups, or donate.",
    link:"https://www.lesecologycenter.org" },
  trees_ny: { id:"trees_ny", name:"Trees New York", emoji:"🌲", shortDesc:"Urban forest stewardship across NYC",
    about:"Trees New York has been planting and caring for NYC\'s urban forest since 1976, training volunteer Citizen Pruners citywide.",
    what:"Trees New York plants street trees, trains volunteers, and advocates for urban forestry investment.",
    how:"Train as a Citizen Pruner. Volunteer for planting events. Adopt a tree on your block.",
    link:"https://www.treesny.org" },
  nyc_planning: { id:"nyc_planning", name:"NYC City Planning", emoji:"🏙️", shortDesc:"NYC land use, zoning & coastal resilience",
    about:"The NYC Department of City Planning manages land use and development across the five boroughs including coastal resilience planning.",
    what:"NYC Planning manages ULURP zoning decisions and resilience projects including the Lower Manhattan Coastal Resilience plan.",
    how:"Attend public scoping meetings. Submit written comments during ULURP review periods.",
    link:"https://www.nyc.gov/site/planning/index.page" },
  nyc_buildings: { id:"nyc_buildings", name:"NYC Buildings (LL97)", emoji:"🏗️", shortDesc:"Building emissions & Local Law 97",
    about:"The NYC Dept of Buildings administers Local Law 97 — the city\'s landmark building carbon emissions cap.",
    what:"DOB tracks LL97 compliance, issues penalties, and provides resources for building owners planning retrofits.",
    how:"Look up your building\'s LL97 compliance status online. Contact your building owner and Council member if non-compliant.",
    link:"https://www.nyc.gov/site/buildings/index.page" },
  cb8: { id:"cb8", name:"Community Board 8", emoji:"🏛️", shortDesc:"Upper East Side community governance",
    about:"CB8 is the advisory body for the Upper East Side (59th-96th St), reviewing land use and environmental issues.",
    what:"CB8 reviews development proposals and environmental issues including East River waterfront projects.",
    how:"Attend monthly meetings, speak during public comment, or apply for an open board seat.",
    link:"https://www.cb8m.com" },
  cb11: { id:"cb11", name:"Community Board 11", emoji:"🏛️", shortDesc:"East Harlem community governance",
    about:"CB11 is the advisory body for East Harlem (96th-142nd St), reviewing development and environmental issues.",
    what:"CB11 reviews development proposals and environmental issues including coastal resilience and park development in East Harlem.",
    how:"Attend monthly meetings open to the public. Register to speak during public comment.",
    link:"https://www.cb11m.org" },
};

// Lightweight, fully client-side matcher behind the "what do you care about?"
// input — no backend/LLM call. Good enough for a handful of topics and orgs;
// a larger org catalog would want real classification instead of substring hits.
const CATEGORY_KEYWORDS = {
  env_health: ["air", "asthma", "pollution", "clean air", "water quality", "drinking water", "diesel", "smog", "toxic", "lead", "chemical", "health", "clean water"],
  climate:    ["climate", "energy", "solar", "wind", "renewable", "carbon", "emissions", "coal", "gas", "power plant", "fossil fuel", "warming", "sea level", "flood"],
  land:       ["park", "parks", "tree", "trees", "green space", "nature", "wildlife", "forest", "waterfront", "hiking", "outdoors", "conservation", "garden"],
  justice:    ["justice", "equity", "community", "low-income", "vulnerable", "frontline", "advocacy", "policy", "organizing", "civic", "fairness"],
};
const ORG_KEYWORDS = {
  sc_atlantic:    ["sierra club", "public lands", "regional advocacy", "litigation"],
  sc_nyc:         ["sierra club", "nyc group", "manhattan", "local advocacy"],
  sc_florida:     ["sierra club", "florida", "sierra club florida"],
  sc_illinois:    ["sierra club", "illinois", "sierra club illinois"],
  sc_ohio:        ["sierra club", "ohio", "sierra club ohio"],
  weact:          ["environmental justice", "harlem", "we act", "asthma", "air quality"],
  ny_renews:      ["clean energy", "climate justice", "renewable", "coalition", "clcpa"],
  riverside_park: ["riverside park", "park", "green space", "waterfront"],
  hrp:            ["hudson river park", "waterfront", "pier", "river"],
  central_park:   ["central park", "park", "tree", "green space"],
  les_ecology:    ["composting", "recycling", "lower east side", "environmental education"],
  trees_ny:       ["urban forest", "tree", "planting", "pruner"],
};
function matchInterests(text) {
  const q = text.toLowerCase();
  if (!q.trim()) return { categories: [], orgs: [] };
  return {
    categories: Object.keys(CATEGORY_KEYWORDS).filter(id => CATEGORY_KEYWORDS[id].some(kw => q.includes(kw))),
    orgs:       Object.keys(ORG_KEYWORDS).filter(id => ORG_KEYWORDS[id].some(kw => q.includes(kw))),
  };
}

const LOCATION_DATA = {
  "33140": {
    "location": "Miami Beach, FL",
    "coords": { "lat": 25.8267, "lon": -80.1208 },
    "neighborhoods": [
      "South Beach",
      "Mid-Beach",
      "North Beach"
    ],
    "delivered": [
      {
        "summary": "Limited Turkey Point's nuclear license, protecting the aquifer your tap water comes from.",
        "issue": "FPL sought to extend Turkey Point's nuclear operating license to 2053. The plant's cooling canals had already created a saltwater plume contaminated with tritium drifting toward the Biscayne Aquifer \u2014 the source of drinking water for Miami Beach and surrounding communities.",
        "why": "The Biscayne Aquifer supplies drinking water to 9 million South Florida residents. Expanding the plant would have intensified the leak and pushed contamination further toward your tap. Miami Beach sits on porous limestone \u2014 whatever reaches the aquifer reaches your water supply quickly.",
        "done": "Sierra Club's Miami Group energy chair Mark Oncavage served as a personal intervener at NRC hearings, giving the group formal legal standing to challenge FPL's filings. He organized public testimony and co-hosted press conferences alongside Miami Waterkeeper, NRDC, and Friends of the Earth.",
        "outcome": "In February 2022, the NRC issued an unprecedented ruling limiting the new license back to 2032 rather than extending it to 2053. The additional three decades of contamination risk were stopped. This was the first time the NRC ever walked back a proposed nuclear license extension.",
        "bulletLink": "https://www.sierraclub.org/florida/blog/2010/11/coalition-opposes-nuclear-expansion-near-biscayne-and-everglades-national-parks",
        "bulletLinkLabel": "Sierra Club: Turkey Point Coalition",
        "group": "sc_supported",
        "category": "env_health",
        "orgId": "sc_florida"
      },
      {
        "summary": "Won a federal court ruling keeping Florida's wetlands in federal hands, protecting your flood buffer.",
        "issue": "The Trump administration transferred wetland development permitting to Florida state regulators, seen as more favorable to developers. Wetlands surrounding Miami Beach absorb storm surge and filter runoff that would otherwise flood streets and homes.",
        "why": "Miami Beach sits at an average elevation under 4 feet. Every wetland filled for development sends water somewhere else \u2014 often into streets and ground-floor properties. Federal permitting standards are stricter and take longer, slowing destruction of the natural buffer protecting your neighborhood.",
        "done": "Sierra Club Florida joined a seven-organization coalition as a named plaintiff in a federal lawsuit filed and argued by Earthjustice. Sierra Club's State Campaign Director Cris Costello was a public spokesperson. The case was argued before the U.S. Circuit Court of Appeals.",
        "outcome": "In March 2026, the appeals court ruled that wetland permits must remain with federal regulators rather than Florida. The legal bar for destroying South Florida wetlands stays higher than developers sought.",
        "bulletLink": "https://www.sierraclub.org/florida",
        "bulletLinkLabel": "Sierra Club Florida",
        "group": "sc_supported",
        "category": "land",
        "orgId": "sc_florida"
      },
      {
        "summary": "Pushed Miami Beach to adopt a formal Sea Level Rise Adaptation Plan covering your streets and property.",
        "issue": "Miami Beach had no binding long-term framework for deciding which streets get elevated, which seawalls get reinforced, or when \u2014 leaving flood infrastructure decisions ad hoc and reactive.",
        "why": "Without a formal plan, your street has no guaranteed place in a protection timeline. With one, every block in Miami Beach is mapped against sea level rise projections through 2100 and assigned to a phased adaptation pathway \u2014 affecting property values, insurance rates, and the habitability of your home.",
        "done": "Sierra Club Miami Group advocated through public comment, endorsed pro-resilience city commission candidates, and participated in the Southeast Florida Regional Climate Compact, which provided the regional framework within which Miami Beach's plan sits.",
        "outcome": "Miami Beach adopted its Sea Level Rise Adaptation Plan in June 2025, funded by a $454,000 Resilient Florida Grant. The plan identifies 67,000 vulnerable assets and establishes phased adaptation pathways for every neighborhood including yours.",
        "bulletLink": "https://www.sierraclub.org/florida/miami",
        "bulletLinkLabel": "Sierra Club Miami Group",
        "group": "sc_only",
        "category": "climate",
        "orgId": "sc_florida"
      }
    ],
    "inProgress": [
      {
        "summary": "Challenging a federal plan to dredge the coral reef running past your beach.",
        "issue": "The Army Corps of Engineers approved a plan to dredge 400 underwater acres at Port Everglades, 30 miles north of Miami Beach, to deepen the port for larger cargo ships. The project would blast the seafloor with explosives up to 200 days per year for five years.",
        "why": "The reef running along Miami Beach's coastline is your neighborhood's natural storm barrier. When PortMiami dredged a decade ago, NOAA confirmed it killed corals across 278 acres. University of Miami scientists found millions of corals \u2014 including the largest remaining stand of wild staghorn coral \u2014 directly in the path of this project.",
        "done": "Sierra Club is part of a coalition led by Miami Waterkeeper and Earthjustice that filed a federal lawsuit challenging the Army Corps' environmental review. Earthjustice attorney Danika Desai filed new briefs in April 2026. University of Miami Rosenstiel School coral surveys are providing the scientific foundation.",
        "outcome": "The dredging is currently blocked by active litigation as of mid-2026. The outcome will determine whether the reef that protects and defines Miami Beach remains intact.",
        "bulletLink": "https://stopthedredge.com",
        "bulletLinkLabel": "Stop the Dredge Campaign",
        "group": "sc_supported",
        "category": "env_health",
        "orgId": "sc_florida"
      },
      {
        "summary": "Fighting federal rollbacks that would eliminate the climate protections Miami Beach depends on.",
        "issue": "The Trump administration moved in early 2026 to revoke the EPA's greenhouse gas endangerment finding \u2014 the legal basis for the EPA's authority to regulate carbon emissions at the federal level.",
        "why": "Miami Beach is among the most climate-vulnerable cities on Earth. The ocean has already risen 8 inches since 1950. Losing federal climate regulation accelerates warming, sea level rise, and shortens the window before daily flooding becomes permanent in your neighborhood.",
        "done": "Sierra Club Florida issued a public statement describing the rollback as a brazen assault on public health and welfare and is coordinating with NRDC and Earthjustice on a legal challenge to the rule.",
        "outcome": "The legal challenge was being prepared as of mid-2026. The rollback is in effect while litigation is organized. Sierra Club is seeking to restore federal authority to regulate greenhouse gases.",
        "bulletLink": "https://www.sierraclub.org/florida",
        "bulletLinkLabel": "Sierra Club Florida",
        "group": "sc_supported",
        "category": "climate",
        "orgId": "sc_florida"
      }
    ],
    "involved": [
      {
        "summary": "Sign the petition to stop the Port Everglades coral reef dredging.",
        "steps": [
          "Go to stopthedredge.com on your phone or computer.",
          "Enter your name and email and submit \u2014 takes about 30 seconds.",
          "Share the link with anyone you know who uses Miami Beach. Earthjustice references petition numbers in court filings to demonstrate public opposition."
        ],
        "link": "https://stopthedredge.com",
        "linkLabel": "stopthedredge.com",
        "bulletLink": "https://stopthedredge.com",
        "bulletLinkLabel": "Sign the Petition",
        "group": "other",
        "category": "env_health",
        "orgId": "sc_florida"
      },
      {
        "summary": "Show up to Miami-Dade County commission meetings when coastal permits are on the agenda.",
        "steps": [
          "Go to miamidade.gov/govaction and search upcoming commission agendas.",
          "Look for items tagged coastal construction, wetlands, or environmental impact.",
          "Register to speak during public comment \u2014 each speaker gets 2 minutes.",
          "Sign up for Sierra Club Miami Group alerts to get notified when these meetings are scheduled."
        ],
        "link": "https://www.sierraclub.org/florida/miami/get-involved",
        "linkLabel": "Sierra Club Miami Group",
        "bulletLink": "https://www.sierraclub.org/florida/miami/get-involved",
        "bulletLinkLabel": "Sierra Club Miami \u2014 Get Involved",
        "group": "sc_only",
        "category": "justice",
        "orgId": "sc_florida"
      },
      {
        "summary": "Donate to Miami Waterkeeper, who tests your beach water every Thursday and leads the reef lawsuit.",
        "steps": [
          "Go to miwaterkeeper.org/donate.",
          "Miami Waterkeeper runs the weekly beach water testing and leads the active federal lawsuit blocking the Port Everglades dredge.",
          "A small monthly donation funds ongoing testing and legal work that directly protects the water you swim in and the reef visible from shore."
        ],
        "link": "https://www.miwaterkeeper.org/donate",
        "linkLabel": "miwaterkeeper.org/donate",
        "bulletLink": "https://www.miwaterkeeper.org/donate",
        "bulletLinkLabel": "Donate to Miami Waterkeeper",
        "group": "other",
        "category": "env_health",
        "orgId": "sc_florida"
      }
    ]
  },
  "33138": {
    "location": "Miami Shores, FL",
    "coords": { "lat": 25.8687, "lon": -80.1898 },
    "neighborhoods": [
      "Miami Shores",
      "Upper East Side",
      "Bayside"
    ],
    "delivered": [
      {
        "summary": "Challenged Turkey Point's nuclear license at federal hearings, reducing risk to your tap water.",
        "issue": "Florida Power & Light applied to extend Turkey Point's nuclear plant license to 2053. The plant's cooling canal system had already leaked a saltwater plume contaminated with tritium and radioactive elements drifting toward the Biscayne Aquifer \u2014 the drinking water source for Miami Shores and all of Miami-Dade County.",
        "why": "Your drinking water comes from the Biscayne Aquifer. The contaminated plume was already documented and drifting west. Extending the license would have meant decades more of the same leak, with contamination potentially reaching deeper into the aquifer beneath your neighborhood.",
        "done": "Sierra Club Miami Group energy chair Mark Oncavage served as a personal intervener at NRC administrative hearings \u2014 a formal legal status giving Sierra Club standing to challenge FPL's filings. He organized public testimony and co-hosted press conferences with Miami Waterkeeper, NRDC, and Friends of the Earth.",
        "outcome": "The NRC ruled in February 2022 to limit the license to 2032 rather than extending it to 2053 \u2014 the first time the NRC ever reversed a proposed license extension. Three additional decades of aquifer contamination risk were stopped.",
        "bulletLink": "https://www.sierraclub.org/florida/blog/2010/11/coalition-opposes-nuclear-expansion-near-biscayne-and-everglades-national-parks",
        "bulletLinkLabel": "Sierra Club: Turkey Point Coalition",
        "group": "sc_supported",
        "category": "env_health",
        "orgId": "sc_florida"
      },
      {
        "summary": "Supported Everglades restoration advocacy that protects the water system filtering your drinking water.",
        "issue": "The Everglades functions as a natural water filtration and recharge system for the Biscayne Aquifer. Decades of drainage, agricultural pollution, and development had degraded this system, reducing both the quality and quantity of water reaching the aquifer beneath Miami Shores.",
        "why": "The less water the Everglades delivers to the aquifer, the more vulnerable your water supply becomes to saltwater intrusion and contamination. Everglades health is directly connected to the water quality in your home.",
        "done": "Sierra Club participates in the Everglades Coalition, a group of nearly 60 organizations, advocating collectively for Comprehensive Everglades Restoration Plan funding in Congress and with the Army Corps of Engineers.",
        "outcome": "CERP funding has been secured across multiple federal appropriations cycles. The Everglades system is measurably recovering \u2014 water flow and quality reaching the aquifer have improved compared to 20 years ago, though full restoration remains decades away.",
        "bulletLink": "https://www.evergladescoalition.org",
        "bulletLinkLabel": "Everglades Coalition",
        "group": "sc_supported",
        "category": "env_health",
        "orgId": "sc_florida"
      }
    ],
    "inProgress": [
      {
        "summary": "Supporting the 2026 federal court challenge to Turkey Point's continued operation.",
        "issue": "Even after the 2022 license limitation, FPL continues operating Turkey Point. Miami Waterkeeper filed a new federal court challenge in 2026 arguing that the ongoing environmental review remains inadequate, particularly given updated sea level rise projections.",
        "why": "Turkey Point sits at low elevation on Biscayne Bay. As sea levels rise, the risk of cooling canal breaches and increased aquifer contamination grows. A more rigorous environmental review could force FPL to demonstrate the plant can operate safely under realistic future conditions.",
        "done": "Sierra Club is supporting Miami Waterkeeper's federal challenge through public advocacy and member mobilization. Miami Waterkeeper's legal team is conducting the litigation.",
        "outcome": "The case is active as of mid-2026. A successful ruling would require FPL to complete a comprehensive environmental review accounting for sea level rise before the plant can continue operating.",
        "bulletLink": "https://www.miwaterkeeper.org",
        "bulletLinkLabel": "Miami Waterkeeper \u2014 Turkey Point",
        "group": "sc_supported",
        "category": "env_health",
        "orgId": "sc_florida"
      }
    ],
    "involved": [
      {
        "summary": "Follow the Turkey Point federal case and share updates to keep pressure on regulators.",
        "steps": [
          "Go to miwaterkeeper.org to follow case updates as new filings are made.",
          "Share case updates on social media \u2014 public awareness signals to federal regulators and FPL that people in affected communities are paying attention.",
          "Sign up for Sierra Club Miami Group email alerts to be notified when public comment periods open on Turkey Point reviews."
        ],
        "link": "https://www.miwaterkeeper.org",
        "linkLabel": "miwaterkeeper.org",
        "bulletLink": "https://www.miwaterkeeper.org",
        "bulletLinkLabel": "Miami Waterkeeper",
        "group": "other",
        "category": "env_health",
        "orgId": "sc_florida"
      },
      {
        "summary": "Join Sierra Club Miami Group to stay informed and participate in local advocacy.",
        "steps": [
          "Go to sierraclub.org/florida/miami and sign up for the newsletter.",
          "Attend a Miami Group meeting \u2014 they are open to the public and held monthly in Miami-Dade County.",
          "Volunteer for outings, water monitoring activities, or advocacy events the group organizes throughout the year."
        ],
        "link": "https://www.sierraclub.org/florida/miami/get-involved",
        "linkLabel": "Sierra Club Miami Group",
        "bulletLink": "https://www.sierraclub.org/florida/miami/get-involved",
        "bulletLinkLabel": "Sierra Club Miami \u2014 Get Involved",
        "group": "sc_only",
        "category": "justice",
        "orgId": "sc_florida"
      },
      {
        "summary": "Contact your Miami-Dade County commissioner to ask about aquifer monitoring near Turkey Point.",
        "steps": [
          "Find your district commissioner at miamidade.gov/govaction using your Miami Shores address.",
          "Email or call their office and ask what steps the county is taking to monitor the Turkey Point aquifer plume and protect Miami-Dade's water supply.",
          "Request that the commissioner formally support stricter NRC oversight of the plant."
        ],
        "link": "https://www.miamidade.gov/govaction/commission.asp",
        "linkLabel": "Miami-Dade Commission",
        "bulletLink": "https://www.miamidade.gov/govaction/commission.asp",
        "bulletLinkLabel": "Miami-Dade Commission",
        "group": "other",
        "category": "justice",
        "orgId": "sc_florida"
      }
    ]
  },
  "60637": {
    "location": "Hyde Park, Chicago, IL",
    "coords": { "lat": 41.7943, "lon": -87.5907 },
    "neighborhoods": [
      "Hyde Park",
      "Kenwood",
      "Woodlawn"
    ],
    "delivered": [
      {
        "summary": "Closed two coal plants that were poisoning South Side air, including the air in Hyde Park.",
        "issue": "The Fisk coal plant in Pilsen and the Crawford coal plant in Little Village were two of the dirtiest power plants in Illinois, operating on Chicago's South Side for decades and emitting particulate matter, sulfur dioxide, and nitrogen oxides linked to asthma, heart disease, and premature death.",
        "why": "Hyde Park sits downwind of the South Side industrial corridor. Studies showed the two plants caused an estimated 41 premature deaths, 550 emergency room visits, and 2,800 asthma attacks per year across surrounding communities. Air quality in Hyde Park was directly affected.",
        "done": "Sierra Club's national Beyond Coal campaign provided media strategy and political pressure. Sierra Club followed the lead of frontline community organizations LVEJO in Little Village and PERRO in Pilsen, who had organized affected residents for years before Sierra Club amplified the effort.",
        "outcome": "Both plants closed in 2012. Air quality monitoring showed measurable improvement in particulate matter within years of closure. The South Side air is cleaner today because of this decade-long fight.",
        "bulletLink": "https://www.sierraclub.org/illinois/beyond-coal-illinois",
        "bulletLinkLabel": "Sierra Club: Beyond Coal Illinois",
        "group": "sc_supported",
        "category": "env_health",
        "orgId": "sc_illinois"
      },
      {
        "summary": "Helped pass Illinois' Climate and Equitable Jobs Act, putting your electricity on a legally mandated path to clean energy.",
        "issue": "Illinois had no binding commitment to phase out fossil fuel power generation. Utilities could continue operating coal and gas plants indefinitely, and clean energy investment had stalled.",
        "why": "Hyde Park residents pay ComEd for electricity. CEJA commits ComEd to 100% clean electricity by 2050, phases out coal plants on a fixed timeline, and directs 40% of clean energy benefits to environmental justice and low-income communities including South Side Chicago neighborhoods adjacent to Hyde Park.",
        "done": "Sierra Club Illinois was a founding and leading member of the Illinois Clean Jobs Coalition. Sierra Club staff led key negotiating sessions, volunteers called over 40,000 Illinois constituents, and the coalition delivered more than 20,000 petitions to Governor Pritzker before he signed the bill.",
        "outcome": "CEJA was signed in September 2021. Coal plant phase-outs are underway on the legislated schedule. Clean energy workforce hubs are being established on Chicago's South Side.",
        "bulletLink": "https://www.sierraclub.org/illinois/blog/2021/09/after-years-grassroots-efforts-illinois-passes-nation-leading-climate-equity",
        "bulletLinkLabel": "Sierra Club: Illinois CEJA Victory",
        "group": "sc_only",
        "category": "climate",
        "orgId": "sc_illinois"
      },
      {
        "summary": "Won a lawsuit requiring Chicago's water agency to stop dumping partially treated sewage into the river system.",
        "issue": "The Metropolitan Water Reclamation District released partially treated sewage mixed with stormwater into the Chicago River system during heavy rain events \u2014 contaminating waterways used by Hyde Park and South Side residents for recreation.",
        "why": "The Chicago River and its tributaries run near Hyde Park. Sewage overflows created health risks for anyone using the river for kayaking, fishing, or recreation, and contributed to Lake Michigan contamination near Chicago's water intake.",
        "done": "Sierra Club, NRDC, and Prairie Rivers Network filed a federal lawsuit against MWRD. ELPC had been pursuing parallel legal pressure for more than 15 years. Friends of the Chicago River provided ongoing public advocacy alongside the litigation.",
        "outcome": "MWRD installed disinfection equipment and ended the practice of releasing only partially treated sewage. The Chicago River's public use has expanded dramatically \u2014 new boathouses, the Riverwalk, and measurably improved water quality are the direct result.",
        "bulletLink": "https://www.sierraclub.org/illinois/chicago",
        "bulletLinkLabel": "Sierra Club Chicago Group",
        "group": "sc_supported",
        "category": "env_health",
        "orgId": "sc_illinois"
      }
    ],
    "inProgress": [
      {
        "summary": "Fighting the Enbridge Line 5 pipeline reroute that threatens Lake Michigan \u2014 Chicago's drinking water.",
        "issue": "Enbridge wants to reroute its Line 5 crude oil pipeline through northern Wisconsin. The pipeline has spilled 1.1 million gallons over 50 years. The proposed reroute would cross more than 180 Wisconsin waterways draining into Lake Michigan, upstream of Chicago's water intake.",
        "why": "Chicago draws its drinking water from Lake Michigan. A major spill in the Wisconsin watershed could reach Lake Michigan and contaminate the intake supplying water to millions of Chicago residents, including Hyde Park.",
        "done": "Sierra Club Wisconsin, alongside Clean Wisconsin and 350 Wisconsin, filed a lawsuit in Iron County Circuit Court challenging the pipeline reroute. Clean Wisconsin is the legal counsel. Sierra Club is a named plaintiff. Sierra Club Illinois is coordinating downstate advocacy.",
        "outcome": "A federal court ordered Enbridge to shut down and remove the pipeline by June 2026. Enbridge is challenging that deadline. The reroute construction remains contested as of mid-2026.",
        "bulletLink": "https://www.sierraclub.org/illinois",
        "bulletLinkLabel": "Sierra Club Illinois",
        "group": "sc_supported",
        "category": "env_health",
        "orgId": "sc_illinois"
      },
      {
        "summary": "Defending CEJA implementation funding from federal rollbacks that would slow Illinois' clean energy transition.",
        "issue": "The Inflation Reduction Act provided billions in federal clean energy tax credits and rebates that fund the projects and workforce programs CEJA depends on. Trump administration actions in 2025 and 2026 have attempted to freeze, rescind, or redirect these funds.",
        "why": "If IRA funding is cut, CEJA's clean energy buildout slows, fewer clean energy jobs come to South Side Chicago, and Illinois utilities have less incentive to accelerate the coal phase-out. Your electricity stays fossil-fuel dependent longer than the law intends.",
        "done": "Sierra Club Illinois is coordinating with the Illinois Clean Jobs Coalition to defend IRA funding through legislative advocacy and legal challenges where applicable. Sierra Club is urging Illinois' congressional delegation to fight fund rescissions.",
        "outcome": "The fight is ongoing as of mid-2026. Some IRA funds have been protected through court orders. Others remain at risk. Sierra Club Illinois is actively tracking every affected program.",
        "bulletLink": "https://www.sierraclub.org/illinois",
        "bulletLinkLabel": "Sierra Club Illinois",
        "group": "sc_supported",
        "category": "climate",
        "orgId": "sc_illinois"
      }
    ],
    "involved": [
      {
        "summary": "Contact your Illinois state representative to protect CEJA clean energy funding from rollback.",
        "steps": [
          "Find your Illinois state representative at ilga.gov using your Hyde Park address.",
          "Call or email their office and say you support CEJA implementation and oppose any rollback of Illinois clean energy standards or IRA funding.",
          "Sign up for Sierra Club Illinois action alerts at sierraclub.org/illinois to be notified when votes are scheduled."
        ],
        "link": "https://www.sierraclub.org/illinois",
        "linkLabel": "Sierra Club Illinois",
        "bulletLink": "https://www.sierraclub.org/illinois",
        "bulletLinkLabel": "Sierra Club Illinois \u2014 Take Action",
        "group": "sc_only",
        "category": "climate",
        "orgId": "sc_illinois"
      },
      {
        "summary": "Volunteer with Sierra Club Chicago Group's river water monitoring program.",
        "steps": [
          "Go to sierraclub.org/illinois/chicago and look for the water monitoring volunteer listing.",
          "Volunteers sample the Chicago, Des Plaines, and Calumet rivers on a regular schedule. Results are posted to the Chicago River Checkup public site.",
          "No scientific background is required \u2014 training is provided at your first session."
        ],
        "link": "https://www.sierraclub.org/illinois/chicago",
        "linkLabel": "Sierra Club Chicago Group",
        "bulletLink": "https://www.sierraclub.org/illinois/chicago",
        "bulletLinkLabel": "Sierra Club Chicago Group",
        "group": "sc_only",
        "category": "env_health",
        "orgId": "sc_illinois"
      },
      {
        "summary": "Support LVEJO and PERRO, the South Side organizations whose community leadership Sierra Club follows.",
        "steps": [
          "Visit lvejo.org to learn about Little Village Environmental Justice Organization's current campaigns and donate or volunteer.",
          "Visit pilsenenvironmental.org to support PERRO's ongoing air quality and industrial oversight work in Pilsen.",
          "Both organizations did the community organizing work that made the Beyond Coal campaign succeed."
        ],
        "link": "https://www.lvejo.org/get-involved/",
        "linkLabel": "LVEJO \u2014 Get Involved",
        "bulletLink": "https://www.lvejo.org",
        "bulletLinkLabel": "LVEJO.org",
        "group": "other",
        "category": "justice",
        "orgId": "sc_illinois"
      }
    ]
  },
  "44141": {
    "location": "Brecksville, OH",
    "coords": { "lat": 41.3251, "lon": -81.6273 },
    "neighborhoods": [
      "Brecksville",
      "Broadview Heights"
    ],
    "delivered": [
      {
        "summary": "Fought for five years to end the HB6 coal bailout that charged you illegally on every electricity bill.",
        "issue": "Ohio's House Bill 6, passed in 2019, was a $1 billion scheme funded by $60 million in bribes from FirstEnergy to Ohio lawmakers. It created a ratepayer surcharge to subsidize two failing nuclear plants and two uncompetitive coal plants. FirstEnergy serves Brecksville households.",
        "why": "You paid a surcharge on every electricity bill from 2020 through August 2025 for plants that could not compete in the energy market. The money did not improve your service or lower your rates. It was, by the finding of federal prosecutors, a bribe-funded theft from Ohio utility customers.",
        "done": "Sierra Club Ohio sustained five years of coalition advocacy \u2014 member testimony at PUCO hearings, public pressure campaigns, legislative lobbying, and press engagement \u2014 as part of the Ohio Clean Jobs Coalition's 50-plus member effort. The Ohio Environmental Council led the legal challenges at PUCO.",
        "outcome": "The coal plant subsidy was ended by HB 15 in August 2025. PUCO ordered FirstEnergy to pay a $250 million penalty in November 2025, with funds directed back to ratepayers. The illegal surcharge on your bill is over.",
        "bulletLink": "https://www.sierraclub.org/ohio",
        "bulletLinkLabel": "Sierra Club Ohio",
        "group": "sc_supported",
        "category": "climate",
        "orgId": "sc_ohio"
      },
      {
        "summary": "Advocated for Lake Erie clean water protections that safeguard Cuyahoga County's drinking water source.",
        "issue": "Lake Erie has faced recurring harmful algal blooms driven by phosphorus runoff from agricultural operations in the watershed. The blooms produce cyanotoxins that can contaminate drinking water intakes \u2014 as happened in Toledo in 2014 when 400,000 residents lost water access for three days.",
        "why": "Cuyahoga County, including Brecksville, draws drinking water from Lake Erie. A major algal bloom reaching the Cleveland intake would cause the same crisis Toledo experienced. Agricultural runoff from Ohio's western farm counties flows through the Maumee River into the western basin of the lake.",
        "done": "Sierra Club Ohio has consistently advocated for stronger agricultural runoff regulations, supported the Western Lake Erie Basin collaborative, and pushed Ohio EPA to set stricter phosphorus limits for farm operations in the watershed.",
        "outcome": "Ohio has adopted some phosphorus reduction targets, though environmental groups including Sierra Club consider them insufficient. Algal bloom frequency remains a serious concern. The advocacy has prevented rollbacks of existing protections that would have made conditions worse.",
        "bulletLink": "https://www.sierraclub.org/ohio",
        "bulletLinkLabel": "Sierra Club Ohio",
        "group": "sc_supported",
        "category": "env_health",
        "orgId": "sc_ohio"
      }
    ],
    "inProgress": [
      {
        "summary": "Tracking a new Ohio bill that could restart ratepayer subsidies for nuclear plants under a different name.",
        "issue": "A bill introduced in the Ohio legislature in March 2026 would create new financial support mechanisms for nuclear plants \u2014 a structure that consumer advocates say mirrors the HB6 coal bailout Ohio just spent five years unwinding, repackaged as energy security policy.",
        "why": "If the bill passes, Brecksville households could again face a surcharge on their electricity bills to prop up plants that are not competitive in the energy market \u2014 the same dynamic that produced the HB6 criminal scandal.",
        "done": "Sierra Club Ohio is monitoring the bill's progress through committee, organizing member testimony at hearings, and coordinating opposition with consumer advocates and the Ohio Environmental Council.",
        "outcome": "The bill is in committee as of mid-2026. Sierra Club Ohio considers this the most urgent active threat to Ohio ratepayers.",
        "bulletLink": "https://www.sierraclub.org/ohio",
        "bulletLinkLabel": "Sierra Club Ohio",
        "group": "sc_supported",
        "category": "climate",
        "orgId": "sc_ohio"
      },
      {
        "summary": "Pushing PUCO to distribute the $250 million FirstEnergy penalty fairly to Brecksville ratepayers.",
        "issue": "PUCO ordered FirstEnergy to pay $250 million in penalties related to HB6 corruption, with funds designated for ratepayer benefit. The mechanism for distributing those funds has not yet been finalized.",
        "why": "Brecksville households paid the illegal HB6 surcharge for five years. How PUCO structures the distribution will determine whether your household receives meaningful compensation or whether the funds get absorbed into utility-controlled programs.",
        "done": "Sierra Club Ohio and consumer advocacy groups are participating in PUCO proceedings to ensure the distribution mechanism prioritizes direct ratepayer relief over utility-controlled programs.",
        "outcome": "PUCO is deliberating on the distribution structure as of mid-2026. A final order is expected later in 2026.",
        "bulletLink": "https://puco.ohio.gov",
        "bulletLinkLabel": "PUCO.ohio.gov",
        "group": "sc_supported",
        "category": "climate",
        "orgId": "sc_ohio"
      }
    ],
    "involved": [
      {
        "summary": "Contact your Ohio state representative to oppose the new nuclear subsidy bill.",
        "steps": [
          "Find your Ohio state representative at ohiohouse.gov using your Brecksville address.",
          "Call or email their office and say you oppose any new ratepayer surcharge for power plant subsidies after the HB6 experience.",
          "Sign up for Sierra Club Ohio action alerts at sierraclub.org/ohio to be notified when the bill comes to a vote."
        ],
        "link": "https://www.sierraclub.org/ohio",
        "linkLabel": "Sierra Club Ohio",
        "bulletLink": "https://www.sierraclub.org/ohio",
        "bulletLinkLabel": "Sierra Club Ohio \u2014 Take Action",
        "group": "sc_only",
        "category": "climate",
        "orgId": "sc_ohio"
      },
      {
        "summary": "Check your ratepayer refund status and submit comments to PUCO on the distribution process.",
        "steps": [
          "Go to PUCO.ohio.gov and search for FirstEnergy rate cases to find the latest on the $250 million penalty distribution.",
          "Submit written public comments to PUCO urging direct cash distribution to ratepayers rather than utility-controlled programs.",
          "Contact the PUCO consumer hotline at 1-800-686-7826 to ask about your household's eligibility."
        ],
        "link": "https://puco.ohio.gov",
        "linkLabel": "PUCO.ohio.gov",
        "bulletLink": "https://puco.ohio.gov",
        "bulletLinkLabel": "PUCO \u2014 Consumer Information",
        "group": "other",
        "category": "climate",
        "orgId": "sc_ohio"
      }
    ]
  },
  "10001": {
    "location": "Chelsea, NY",
    "coords": { "lat": 40.7501, "lon": -73.9970 },
    "neighborhoods": [
      "Chelsea",
      "Hell's Kitchen",
      "Hudson Yards"
    ],
    "delivered": [
      {
        "summary": "Established the legal right of citizens to sue on behalf of the environment \u2014 the foundation of every environmental lawsuit since 1965.",
        "issue": "Con Edison planned to build a pumped-storage power plant on Storm King Mountain on the Hudson River. There was no established legal mechanism for citizens to challenge a federal infrastructure permit on environmental grounds.",
        "why": "The Storm King case \u2014 Scenic Hudson Preservation Conference v. Federal Power Commission \u2014 established that citizens have standing to sue in federal court to protect the environment. Every environmental lawsuit in this app, and virtually every environmental legal victory in the US since 1965, rests on this doctrine.",
        "done": "Scenic Hudson brought the case. Sierra Club provided national advocacy support and helped build the coalition challenging the plant. The case was argued before the Second Circuit Court of Appeals in New York.",
        "outcome": "The Second Circuit ruled in 1965 that citizens have standing to challenge federal permits affecting the environment. The Storm King plant was never built. The Clean Air Act, Clean Water Act, and NEPA all depend on the citizen standing doctrine born here.",
        "bulletLink": "https://www.sierraclub.org/atlantic",
        "bulletLinkLabel": "Sierra Club Atlantic Chapter",
        "group": "other",
        "category": "env_health",
        "orgId": "sc_atlantic"
      },
      {
        "summary": "Won court orders requiring New York utilities to replace gas peaker plants with cleaner alternatives.",
        "issue": "New York City operated dozens of gas-fired peaker plants \u2014 backup power generators that run during peak electricity demand \u2014 disproportionately located in low-income communities of color in Brooklyn, Queens, and the Bronx, emitting nitrogen oxides and particulate matter linked to asthma.",
        "why": "Peaker plant pollution drifts across the city affecting air quality throughout Manhattan. Chelsea sits close enough to the urban airshed that regional air quality improvements directly affect your neighborhood.",
        "done": "Sierra Club Atlantic Chapter filed challenges to individual peaker plant permits at the NYS Public Service Commission and advocated for clean energy replacement timelines alongside WE ACT for Environmental Justice, Earthjustice, and the NYC Environmental Justice Alliance.",
        "outcome": "Several peaker plants have been retired and replaced with battery storage. The PSC adopted a policy framework requiring remaining peakers to transition to clean alternatives. Air quality in communities near retired peakers has measurably improved.",
        "bulletLink": "https://www.sierraclub.org/atlantic/nyc",
        "bulletLinkLabel": "Sierra Club NYC Group",
        "group": "sc_supported",
        "category": "env_health",
        "orgId": "sc_nyc"
      }
    ],
    "inProgress": [
      {
        "summary": "Pushing the NY HEAT Act through the state legislature to end new gas hookups in NYC buildings.",
        "issue": "New York State still permits new buildings to connect to the gas distribution system, locking in fossil fuel combustion for decades. The NY HEAT Act would ban new gas hookups and require utilities to plan a managed transition off gas distribution.",
        "why": "Gas combustion in buildings is the largest single source of greenhouse gas emissions in New York City and a significant source of indoor air pollution. Ending new gas hookups reduces long-term health risks and moves the city off a fuel driving the climate-related heat waves and flooding affecting Manhattan every year.",
        "done": "Sierra Club Atlantic Chapter has been a consistent advocate for the NY HEAT Act, coordinating member contact with legislators and participating in coalition advocacy with NRDC and Environmental Advocates NY. The bill passed the State Senate in 2024.",
        "outcome": "The bill is stalled in the State Assembly as of mid-2026. Passage requires sustained constituent pressure on Assembly members.",
        "bulletLink": "https://www.sierraclub.org/atlantic",
        "bulletLinkLabel": "Sierra Club Atlantic Chapter",
        "group": "sc_supported",
        "category": "climate",
        "orgId": "sc_atlantic"
      }
    ],
    "involved": [
      {
        "summary": "Contact your New York Assembly member to pass the NY HEAT Act this session.",
        "steps": [
          "Find your Assembly member at assembly.state.ny.us using your Chelsea address.",
          "Call their district office and say you support the NY HEAT Act and want to see it pass the Assembly this session.",
          "Sierra Club Atlantic Chapter sends action alerts when the bill is scheduled for a vote \u2014 sign up at sierraclub.org/atlantic."
        ],
        "link": "https://www.sierraclub.org/atlantic",
        "linkLabel": "Sierra Club Atlantic Chapter",
        "bulletLink": "https://www.sierraclub.org/atlantic",
        "bulletLinkLabel": "Sierra Club Atlantic \u2014 Take Action",
        "group": "sc_only",
        "category": "climate",
        "orgId": "sc_atlantic"
      },
      {
        "summary": "Join Sierra Club NYC Group advocacy events and connect with the local environmental community.",
        "steps": [
          "Go to sierraclub.org/atlantic/nyc and check the events calendar.",
          "Meetings and events are open to the public \u2014 no membership is required to attend.",
          "NYC Group runs both outdoor outings and advocacy events including PSC hearing attendance and legislative days in Albany."
        ],
        "link": "https://www.sierraclub.org/atlantic/nyc",
        "linkLabel": "Sierra Club NYC Group",
        "bulletLink": "https://www.sierraclub.org/atlantic/nyc",
        "bulletLinkLabel": "Sierra Club NYC Group",
        "group": "sc_only",
        "category": "land",
        "orgId": "sc_nyc"
      }
    ]
  },
  "10002": {
    "location": "Lower East Side / Chinatown, NY",
    "coords": { "lat": 40.7168, "lon": -73.9861 },
    "neighborhoods": [
      "Lower East Side",
      "Chinatown",
      "Two Bridges"
    ],
    "delivered": [
      {
        "summary": "Fought to reduce diesel air pollution from highway and truck routes concentrated over LES neighborhoods.",
        "issue": "The Lower East Side and Chinatown sit at the intersection of multiple elevated highways and major truck routes that generate concentrated diesel exhaust. Particulate matter levels in Two Bridges and Chinatown have historically ranked among the highest in New York City.",
        "why": "Residents of the Lower East Side and Chinatown have asthma hospitalization rates significantly above the Manhattan average. Diesel exhaust from highway and truck traffic is a primary contributing factor. Children and elderly residents face the greatest health risk from chronic particulate matter exposure.",
        "done": "Sierra Club Atlantic Chapter advocated for stricter idling enforcement, clean truck standards, and diesel retrofitting programs for city fleets operating in the LES corridor. Sierra Club supported WE ACT and LES advocacy groups in pushing the city to adopt anti-idling enforcement and NYCDOT truck route management policies.",
        "outcome": "New York City adopted stronger idling enforcement rules and expanded the clean truck program for vehicles operating near sensitive receptors including schools and senior centers. Diesel particulate levels in the LES have declined from peak levels, though they remain elevated.",
        "bulletLink": "https://www.sierraclub.org/atlantic/nyc",
        "bulletLinkLabel": "Sierra Club NYC Group",
        "group": "sc_supported",
        "category": "env_health",
        "orgId": "sc_nyc"
      },
      {
        "summary": "Supported the fight for East River waterfront access and water quality improvements along the LES shoreline.",
        "issue": "For decades the Lower East Side waterfront was occupied by industrial uses, highway infrastructure, and sewage outfalls that made the East River inaccessible and unsafe for recreation.",
        "why": "Access to waterfront green space and clean water is a public health and quality-of-life issue directly affecting LES and Chinatown residents, who have less access to parks per capita than wealthier Manhattan neighborhoods.",
        "done": "Sierra Club participated in the East River waterfront advocacy coalition alongside local community groups, supporting MWRD sewage overflow litigation and the planning processes that created the East River Esplanade and Pier 42.",
        "outcome": "East River water quality at the LES has improved measurably over 20 years. The waterfront has been transformed from industrial to public recreational space. Pier 42 opened as a public park.",
        "bulletLink": "https://www.sierraclub.org/atlantic/nyc",
        "bulletLinkLabel": "Sierra Club NYC Group",
        "group": "sc_supported",
        "category": "env_health",
        "orgId": "sc_nyc"
      }
    ],
    "inProgress": [
      {
        "summary": "Advocating for climate resilience infrastructure to protect LES from storm surge and sea level rise.",
        "issue": "The Lower East Side was among the neighborhoods most severely flooded by Hurricane Sandy in 2012. The area sits at low elevation along the East River waterfront and faces increasing flood risk as sea levels rise. The East Side Coastal Resiliency project has been slow to implement.",
        "why": "Two Bridges, Chinatown, and the LES waterfront face the highest storm surge risk of any Manhattan neighborhood south of 14th Street. Thousands of ground-floor apartments and small businesses are exposed to future flood events more severe than Sandy.",
        "done": "Sierra Club Atlantic Chapter supports the climate resilience planning processes for Lower Manhattan and advocates for federal funding for the Big U and East Side Coastal Resiliency projects. Sierra Club is part of the coalition pushing for full and expedited implementation of ESCR.",
        "outcome": "The East Side Coastal Resiliency project is under construction as of 2026, with completion targeted for 2026-2027. The southern portion of the Big U remains at the planning and funding stage. Full protection for the LES waterfront is not yet in place.",
        "bulletLink": "https://www.sierraclub.org/atlantic",
        "bulletLinkLabel": "Sierra Club Atlantic Chapter",
        "group": "sc_supported",
        "category": "land",
        "orgId": "sc_atlantic"
      }
    ],
    "involved": [
      {
        "summary": "Attend NYC Department of City Planning meetings on Lower Manhattan resilience projects.",
        "steps": [
          "Go to nyc.gov/site/planning and search for Lower Manhattan Coastal Resilience project meetings.",
          "Register to speak during public comment \u2014 local resident voices carry significant weight in ULURP processes.",
          "Sierra Club Atlantic Chapter sends alerts when resilience planning meetings affecting LES are scheduled \u2014 sign up at sierraclub.org/atlantic."
        ],
        "link": "https://www.sierraclub.org/atlantic",
        "linkLabel": "Sierra Club Atlantic Chapter",
        "bulletLink": "https://www.sierraclub.org/atlantic",
        "bulletLinkLabel": "Sierra Club Atlantic \u2014 Events",
        "group": "sc_supported",
        "category": "land",
        "orgId": "sc_atlantic"
      },
      {
        "summary": "Support LES Ecology Center, the local environmental organization Sierra Club partners with in this neighborhood.",
        "steps": [
          "Visit lesecologycenter.org to learn about composting, environmental education, and local advocacy programs.",
          "Volunteer for waterfront cleanup events and community science programs organized by LES Ecology Center.",
          "Donate to support local environmental infrastructure \u2014 LES Ecology Center runs the community composting and environmental monitoring programs that Sierra Club advocates for at the policy level."
        ],
        "link": "https://www.lesecologycenter.org",
        "linkLabel": "LES Ecology Center",
        "bulletLink": "https://www.lesecologycenter.org",
        "bulletLinkLabel": "LES Ecology Center",
        "group": "other",
        "category": "justice",
        "orgId": "les_ecology"
      }
    ]
  },
  "10007": {
    "location": "Tribeca / Financial District, NY",
    "coords": { "lat": 40.7132, "lon": -74.0083 },
    "neighborhoods": [
      "Tribeca",
      "Financial District",
      "Battery Park City"
    ],
    "delivered": [
      {
        "summary": "Won federal air quality monitoring and cleanup requirements after 9/11 contamination that affected Tribeca and FiDi residents for years.",
        "issue": "The collapse of the World Trade Center released a toxic plume containing asbestos, heavy metals, dioxins, and pulverized concrete across Lower Manhattan. The EPA initially declared the air safe to return while monitoring data was still being collected.",
        "why": "Tribeca and Financial District residents who returned in the weeks and months after 9/11 faced prolonged exposure to contaminated air and surfaces. Studies documented elevated rates of respiratory disease and certain cancers among Lower Manhattan residents, not just first responders.",
        "done": "Sierra Club advocated for extended air monitoring, building-by-building remediation, and health screening programs for Lower Manhattan residents. Sierra Club joined the environmental justice coalition pushing EPA and FEMA to expand health programs beyond workers at Ground Zero.",
        "outcome": "The World Trade Center Health Program was expanded to include area residents and workers in addition to first responders. Health monitoring and treatment coverage was extended under the Zadroga Act.",
        "bulletLink": "https://www.sierraclub.org/atlantic",
        "bulletLinkLabel": "Sierra Club Atlantic Chapter",
        "group": "sc_supported",
        "category": "env_health",
        "orgId": "sc_atlantic"
      },
      {
        "summary": "Supported the transformation of the Hudson River waterfront from industrial to public parkland across from Tribeca.",
        "issue": "For most of the 20th century, the Hudson River waterfront in Lower Manhattan was occupied by working piers, freight rail infrastructure, and industrial operations that blocked public access and contaminated the shoreline.",
        "why": "Tribeca residents now have access to Hudson River Park \u2014 miles of public waterfront with parks, piers, and recreation areas that would not exist without sustained advocacy, litigation, and planning work over decades.",
        "done": "Sierra Club supported the formation of Hudson River Park and the legal frameworks protecting the waterfront from development. Sierra Club advocated for the Hudson River Park Act and has participated in ongoing advocacy to ensure the park remains public.",
        "outcome": "Hudson River Park stretches from Chambers Street to 59th Street. The Tribeca section \u2014 piers 25 and 26 \u2014 includes athletic fields, playgrounds, and public beach access.",
        "bulletLink": "https://www.hudsonriverpark.org",
        "bulletLinkLabel": "Hudson River Park",
        "group": "other",
        "category": "land",
        "orgId": "hrp"
      }
    ],
    "inProgress": [
      {
        "summary": "Advocating for Lower Manhattan flood protection against storm surge from the harbor.",
        "issue": "The Financial District and Battery Park City sit at the southern tip of Manhattan at near-sea-level elevation, directly exposed to storm surge from New York Harbor. The Lower Manhattan Coastal Resilience plan proposes a combination of berms, floodwalls, and extended land mass.",
        "why": "Hurricane Sandy put Battery Park City and the FDR Drive underpass underwater. A similar or larger storm today would cause the same or worse damage. Sea level rise means future storms do not need to be as large as Sandy to cause equivalent flooding.",
        "done": "Sierra Club Atlantic Chapter is engaged in the Lower Manhattan Coastal Resilience planning process, advocating for designs that prioritize public access and equitable protection rather than solutions that benefit commercial real estate over residential communities.",
        "outcome": "The project is in the design and environmental review phase as of mid-2026. Construction is not expected to begin until the late 2020s at the earliest. No flood protection beyond existing seawalls is currently in place.",
        "bulletLink": "https://www.sierraclub.org/atlantic",
        "bulletLinkLabel": "Sierra Club Atlantic Chapter",
        "group": "sc_supported",
        "category": "land",
        "orgId": "sc_atlantic"
      }
    ],
    "involved": [
      {
        "summary": "Participate in the Lower Manhattan Coastal Resilience public planning process.",
        "steps": [
          "Go to nyc.gov/site/planning and search for Lower Manhattan Coastal Resilience to find public meetings and comment opportunities.",
          "Submit written comments on the project design \u2014 public input influences which neighborhoods receive prioritized protection.",
          "Contact your City Council member in District 1 to express support for expedited implementation and equitable design priorities."
        ],
        "link": "https://www.nyc.gov/site/planning/index.page",
        "linkLabel": "NYC City Planning",
        "bulletLink": "https://www.nyc.gov/site/planning/index.page",
        "bulletLinkLabel": "NYC City Planning \u2014 LM Resilience",
        "group": "other",
        "category": "land",
        "orgId": "nyc_planning"
      },
      {
        "summary": "Volunteer with Hudson River Park Trust environmental programs.",
        "steps": [
          "Go to hudsonriverpark.org/get-involved to find volunteer opportunities.",
          "Hudson River Park Trust runs oyster restoration, shoreline cleanup, and environmental monitoring programs open to public volunteers.",
          "Sierra Club Atlantic Chapter partners with Hudson River Park on advocacy to keep the park public and protect it from commercial overdevelopment."
        ],
        "link": "https://www.hudsonriverpark.org",
        "linkLabel": "Hudson River Park",
        "bulletLink": "https://www.hudsonriverpark.org",
        "bulletLinkLabel": "Hudson River Park \u2014 Volunteer",
        "group": "other",
        "category": "land",
        "orgId": "hrp"
      }
    ]
  },
  "10011": {
    "location": "West Village / Greenwich Village, NY",
    "coords": { "lat": 40.7336, "lon": -74.0027 },
    "neighborhoods": [
      "West Village",
      "Greenwich Village",
      "Meatpacking District"
    ],
    "delivered": [
      {
        "summary": "Helped secure the Gansevoort Peninsula's conversion from salt storage to public parkland on the Hudson River waterfront.",
        "issue": "The Gansevoort Peninsula at the edge of the West Village was used for decades as a Department of Sanitation salt storage facility, blocking waterfront access and degrading the shoreline environment adjacent to Hudson River Park.",
        "why": "The West Village waterfront is one of the most densely used recreational corridors in Manhattan. Removing the industrial facility and converting the peninsula to parkland extends public green space to a neighborhood with limited park access relative to its residential density.",
        "done": "Sierra Club Atlantic Chapter supported the Hudson River Park Trust's advocacy for the Gansevoort Peninsula conversion and participated in the public planning process for the site's design as public parkland.",
        "outcome": "The salt storage facility has been removed. The Gansevoort Peninsula is in the process of being developed as a public park extension of Hudson River Park, with an environmental education component, opening in phases beginning in 2026.",
        "bulletLink": "https://www.hudsonriverpark.org",
        "bulletLinkLabel": "Hudson River Park",
        "group": "other",
        "category": "land",
        "orgId": "hrp"
      },
      {
        "summary": "Advocated for New York City's building emissions law \u2014 Local Law 97 \u2014 which requires Greenwich Village buildings to cut carbon.",
        "issue": "Greenwich Village sits above a substantial network of Con Edison steam and gas distribution infrastructure. Con Edison's steam system, which serves much of Lower Manhattan, has historically been powered by fossil fuels and is a significant source of greenhouse gas emissions.",
        "why": "Transitioning the steam system and building energy infrastructure to cleaner alternatives directly reduces the carbon footprint of West Village and Greenwich Village buildings \u2014 including the iconic brownstones and mixed-use buildings that define the neighborhood.",
        "done": "Sierra Club Atlantic Chapter engaged in Con Edison rate cases at the PSC and supported Local Law 97 through advocacy during its drafting and passage. Sierra Club supported building electrification mandates and the Local Law 97 implementation regulations.",
        "outcome": "Local Law 97, which Sierra Club supported, sets building-level carbon emission limits requiring most large buildings in Greenwich Village to reduce emissions or pay penalties beginning in 2024. Con Edison has committed to expanding geothermal and electrification programs.",
        "bulletLink": "https://www.sierraclub.org/atlantic",
        "bulletLinkLabel": "Sierra Club Atlantic Chapter",
        "group": "sc_supported",
        "category": "climate",
        "orgId": "sc_atlantic"
      }
    ],
    "inProgress": [
      {
        "summary": "Pushing for full implementation of Local Law 97 building emissions limits despite real estate industry pressure for rollbacks.",
        "issue": "Local Law 97 requires large buildings in New York City to meet carbon emission limits or pay fines, with limits tightening in 2030. The real estate industry has lobbied for delays, exemptions, and penalty reductions that would significantly weaken the law.",
        "why": "Buildings account for roughly 70% of New York City's greenhouse gas emissions. Greenwich Village and the West Village have a high concentration of large residential and commercial buildings subject to the law. If the law is weakened, the emissions reductions that make New York's climate commitments achievable are put at risk.",
        "done": "Sierra Club Atlantic Chapter is engaged in the regulatory proceedings that implement Local Law 97, advocating for strong penalty enforcement and against exemptions that would gut the law's emissions requirements.",
        "outcome": "Local Law 97 is in effect for the first compliance period as of 2024. The 2030 limits remain intact as of mid-2026. Sierra Club and allies are actively defending against legislative and regulatory rollback attempts.",
        "bulletLink": "https://www.sierraclub.org/atlantic",
        "bulletLinkLabel": "Sierra Club Atlantic Chapter",
        "group": "sc_supported",
        "category": "climate",
        "orgId": "sc_atlantic"
      }
    ],
    "involved": [
      {
        "summary": "Find out if your building complies with Local Law 97 and advocate for your neighbors if it does not.",
        "steps": [
          "Find your building's Local Law 97 compliance status at nyc.gov/site/buildings/index.page.",
          "If your building is out of compliance, contact your building's management and your City Council member to demand action.",
          "Sign up for Sierra Club Atlantic Chapter alerts at sierraclub.org/atlantic to stay informed about rollback attempts in Albany and City Hall."
        ],
        "link": "https://www.sierraclub.org/atlantic",
        "linkLabel": "Sierra Club Atlantic Chapter",
        "bulletLink": "https://www.nyc.gov/site/buildings/index.page",
        "bulletLinkLabel": "NYC Buildings \u2014 LL97 Status",
        "group": "sc_supported",
        "category": "climate",
        "orgId": "nyc_buildings"
      },
      {
        "summary": "Attend Hudson River Park public meetings and advocate for full Gansevoort Peninsula park development.",
        "steps": [
          "Go to hudsonriverpark.org/get-involved to find public meetings and volunteer opportunities.",
          "Attend Community Board 2 meetings when Hudson River Park and waterfront development items are on the agenda \u2014 CB2 covers the West Village and Greenwich Village.",
          "Contact Community Board 2 at cb2.nyc.gov to sign up for meeting notifications."
        ],
        "link": "https://www.hudsonriverpark.org",
        "linkLabel": "Hudson River Park Trust",
        "bulletLink": "https://www.hudsonriverpark.org",
        "bulletLinkLabel": "Hudson River Park \u2014 Get Involved",
        "group": "other",
        "category": "land",
        "orgId": "hrp"
      }
    ]
  },
  "10025": {
    "location": "Upper West Side / Morningside Heights, NY",
    "coords": { "lat": 40.7969, "lon": -73.9707 },
    "neighborhoods": [
      "Upper West Side",
      "Morningside Heights",
      "Manhattan Valley"
    ],
    "delivered": [
      {
        "summary": "Protected Riverside Park from commercial development and maintained it as a continuous public greenway along the Hudson.",
        "issue": "Riverside Park stretches from 72nd Street to 158th Street along the Hudson River waterfront. Over the decades, proposals for commercial development, highway expansion, and infrastructure projects repeatedly threatened to fragment or encroach on the park.",
        "why": "Riverside Park is the primary green space for hundreds of thousands of Upper West Side and Morningside Heights residents. The park also provides critical urban ecology \u2014 bird migration habitat, river bank stabilization, and stormwater absorption \u2014 that serves the entire neighborhood.",
        "done": "Sierra Club Atlantic Chapter's New York City Group has consistently engaged in land use and parks advocacy to oppose encroachment on Riverside Park. Sierra Club has participated in Riverside Park Conservancy advocacy and supported legal challenges to development proposals.",
        "outcome": "Riverside Park remains intact as continuous public greenway. Several commercial and infrastructure proposals have been defeated or significantly modified through public advocacy in which Sierra Club participated.",
        "bulletLink": "https://www.riversideparknyc.org/volunteer",
        "bulletLinkLabel": "Riverside Park Conservancy",
        "group": "sc_only",
        "category": "land",
        "orgId": "riverside_park"
      },
      {
        "summary": "Supported the passage of New York's Climate Leadership and Community Protection Act \u2014 one of the strongest state climate laws in the country.",
        "issue": "New York State had no binding statutory commitment to reduce greenhouse gas emissions on a specific timeline. Without legislation, emissions reduction targets were voluntary and subject to reversal by future administrations.",
        "why": "The CLCPA commits New York to reducing economy-wide greenhouse gas emissions 85% below 1990 levels by 2050 and sets a 70% renewable electricity target by 2030. For Upper West Side residents, this means legally mandated clean energy transitions affecting your electricity supply, your building's heating system, and New York's long-term climate trajectory.",
        "done": "Sierra Club Atlantic Chapter was a key advocate for CLCPA passage, mobilizing members, organizing lobby days in Albany, and participating in the coalition that sustained legislative pressure over multiple sessions. Sierra Club worked alongside NRDC, Environmental Advocates NY, and grassroots climate organizations.",
        "outcome": "Governor Cuomo signed the CLCPA in July 2019. Implementation is ongoing. New York's renewable energy buildout, building emissions standards, and transportation electrification programs all flow from this law.",
        "bulletLink": "https://www.sierraclub.org/atlantic",
        "bulletLinkLabel": "Sierra Club Atlantic Chapter",
        "group": "sc_supported",
        "category": "climate",
        "orgId": "sc_atlantic"
      }
    ],
    "inProgress": [
      {
        "summary": "Advocating for Hudson River offshore wind development to replace fossil fuel generation serving the Upper West Side.",
        "issue": "New York's CLCPA requires 70% renewable electricity by 2030. Meeting that target depends heavily on offshore wind development in federal waters off New York and New Jersey. The Trump administration paused offshore wind permitting in early 2025, creating significant uncertainty.",
        "why": "The electricity reaching Upper West Side apartments is currently generated substantially from fossil fuels. Offshore wind development is the primary mechanism for replacing that generation with clean electricity at the scale New York needs.",
        "done": "Sierra Club Atlantic Chapter is advocating for the restoration of federal offshore wind permitting and urging New York State to pursue alternatives to keep the clean energy transition on track. Sierra Club is supporting legal challenges to the federal permitting pause.",
        "outcome": "Several approved offshore wind projects were canceled or paused in 2024-2025 due to federal action and economic conditions. New York's 2030 renewable target is at risk. Sierra Club considers this the highest-priority clean energy fight in New York State as of mid-2026.",
        "bulletLink": "https://www.sierraclub.org/atlantic",
        "bulletLinkLabel": "Sierra Club Atlantic Chapter",
        "group": "sc_supported",
        "category": "climate",
        "orgId": "sc_atlantic"
      }
    ],
    "involved": [
      {
        "summary": "Contact your US Senators to restore federal offshore wind permitting.",
        "steps": [
          "Go to senate.gov to find your US Senators' contact information.",
          "Call their offices and say you support offshore wind development and oppose the federal permitting pause threatening New York's clean energy transition.",
          "Sierra Club Atlantic Chapter sends action alerts on offshore wind \u2014 sign up at sierraclub.org/atlantic."
        ],
        "link": "https://www.sierraclub.org/atlantic",
        "linkLabel": "Sierra Club Atlantic Chapter",
        "bulletLink": "https://www.sierraclub.org/atlantic",
        "bulletLinkLabel": "Sierra Club Atlantic \u2014 Take Action",
        "group": "sc_only",
        "category": "climate",
        "orgId": "sc_atlantic"
      },
      {
        "summary": "Volunteer with Riverside Park Conservancy environmental stewardship programs.",
        "steps": [
          "Go to riversideparknyc.org/volunteer to find stewardship events.",
          "Riverside Park Conservancy runs regular planting, cleanup, and invasive species removal events open to public volunteers.",
          "Volunteering directly builds the community constituency that Sierra Club mobilizes when development or infrastructure proposals threaten the park."
        ],
        "link": "https://www.riversideparknyc.org/volunteer",
        "linkLabel": "Riverside Park Conservancy",
        "bulletLink": "https://www.riversideparknyc.org/volunteer",
        "bulletLinkLabel": "Riverside Park \u2014 Volunteer",
        "group": "sc_supported",
        "category": "land",
        "orgId": "riverside_park"
      }
    ]
  },
  "10029": {
    "location": "East Harlem / Spanish Harlem, NY",
    "coords": { "lat": 40.7957, "lon": -73.9389 },
    "neighborhoods": [
      "East Harlem",
      "El Barrio",
      "Spanish Harlem"
    ],
    "delivered": [
      {
        "summary": "Fought to close multiple gas peaker plants in East Harlem that disproportionately burdened this community with air pollution.",
        "issue": "East Harlem hosted multiple gas-fired peaker plants that operate during peak electricity demand periods. The neighborhood already has some of the highest asthma hospitalization rates in New York City. The plants added nitrogen oxide and particulate matter to an air quality baseline already degraded by the FDR Drive and industrial uses along the East River.",
        "why": "Children in East Harlem are hospitalized for asthma at rates dramatically higher than the Manhattan average \u2014 a disparity linked directly to environmental pollution. Every additional air pollution source adds to a cumulative burden that disproportionately affects residents who have the fewest resources to cope.",
        "done": "Sierra Club Atlantic Chapter joined WE ACT for Environmental Justice, the NYC Environmental Justice Alliance, and East Harlem community groups in challenging individual peaker plant permits at the PSC and advocating for battery storage replacement. Sierra Club followed WE ACT's community leadership on specific priorities and timeline.",
        "outcome": "Several East Harlem area peaker plants are on retirement schedules as part of the PSC's peaker transition policy. Not all have closed as of mid-2026. WE ACT and Sierra Club continue to monitor compliance and push for accelerated retirement.",
        "bulletLink": "https://www.weact.org",
        "bulletLinkLabel": "WE ACT for Environmental Justice",
        "group": "sc_supported",
        "category": "env_health",
        "orgId": "weact"
      },
      {
        "summary": "Supported community campaigns to reduce truck traffic and diesel exhaust on East Harlem streets.",
        "issue": "East Harlem serves as a through-route for commercial truck traffic between the Bronx, the Triborough Bridge, and distribution centers in the outer boroughs. Diesel truck exhaust is a primary contributor to the neighborhood's elevated particulate matter levels.",
        "why": "Diesel exhaust from truck traffic is one of the most direct and immediate environmental health threats facing East Harlem residents. Unlike power plant pollution, truck exhaust is dispersed at street level where residents breathe it directly.",
        "done": "Sierra Club supported WE ACT's truck routing advocacy and the city's implementation of the Clean Trucks program, which offers incentives for fleet operators to switch to lower-emission vehicles. Sierra Club advocated for expanded anti-idling enforcement in environmental justice communities.",
        "outcome": "The Clean Trucks program has reduced the oldest and dirtiest diesel vehicles from city streets. Anti-idling enforcement has increased. Diesel particulate levels in East Harlem have declined from peak levels but remain among the highest in Manhattan.",
        "bulletLink": "https://www.sierraclub.org/atlantic/nyc",
        "bulletLinkLabel": "Sierra Club NYC Group",
        "group": "sc_supported",
        "category": "env_health",
        "orgId": "sc_nyc"
      }
    ],
    "inProgress": [
      {
        "summary": "Pushing for Thomas Jefferson Park and the East Harlem waterfront to receive climate resilience infrastructure.",
        "issue": "Thomas Jefferson Park and the East 110th-120th Street waterfront in East Harlem are exposed to storm surge from the East River. The East Side Coastal Resiliency project stops at 25th Street, leaving East Harlem unprotected.",
        "why": "East Harlem has a high proportion of public housing and low-income residents who cannot easily relocate or recover from flood damage. Without flood protection infrastructure, future storm surge events will cause disproportionate harm to this community.",
        "done": "Sierra Club Atlantic Chapter is advocating for the extension of coastal resilience infrastructure to East Harlem as part of New York City's long-term climate adaptation planning. Sierra Club is supporting community groups that have demanded inclusion in Lower Manhattan Coastal Resilience planning.",
        "outcome": "East Harlem coastal resilience infrastructure is not funded or designed as of mid-2026. The community remains exposed to storm surge risk.",
        "bulletLink": "https://www.weact.org",
        "bulletLinkLabel": "WE ACT for Environmental Justice",
        "group": "sc_supported",
        "category": "land",
        "orgId": "weact"
      }
    ],
    "involved": [
      {
        "summary": "Support WE ACT for Environmental Justice \u2014 the frontline East Harlem organization whose lead Sierra Club follows.",
        "steps": [
          "Go to weact.org to learn about WE ACT's current campaigns in East Harlem.",
          "Donate to WE ACT \u2014 their community organizing work is the foundation on which Sierra Club's political advocacy in this neighborhood is built.",
          "Volunteer for WE ACT's community engagement events, air quality monitoring programs, and public hearings."
        ],
        "link": "https://www.weact.org",
        "linkLabel": "WE ACT for Environmental Justice",
        "bulletLink": "https://www.weact.org",
        "bulletLinkLabel": "WE ACT \u2014 Get Involved",
        "group": "other",
        "category": "justice",
        "orgId": "weact"
      },
      {
        "summary": "Attend Community Board 11 meetings when environmental and development issues are on the agenda.",
        "steps": [
          "Find Community Board 11 meeting schedules at cb11m.org.",
          "CB11 covers East Harlem and has jurisdiction over land use, development permits, and environmental review in your neighborhood.",
          "Showing up and speaking during public comment on environmental issues signals to elected officials that East Harlem residents are engaged."
        ],
        "link": "https://www.cb11m.org",
        "linkLabel": "Community Board 11",
        "bulletLink": "https://www.cb11m.org",
        "bulletLinkLabel": "Community Board 11",
        "group": "other",
        "category": "justice",
        "orgId": "cb11"
      }
    ]
  },
  "10031": {
    "location": "Harlem, NY",
    "coords": { "lat": 40.8253, "lon": -73.9490 },
    "neighborhoods": [
      "Central Harlem",
      "Hamilton Heights",
      "Sugar Hill"
    ],
    "delivered": [
      {
        "summary": "Helped close coal and oil-burning power plants that made Harlem's air among the worst in New York City.",
        "issue": "Harlem historically hosted or sat downwind of multiple fossil fuel power plants, including Con Edison facilities operating on heavy fuel oil. The neighborhood's air quality was significantly degraded by these facilities for decades, contributing to elevated asthma rates among Harlem residents.",
        "why": "Harlem has among the highest childhood asthma rates in New York State. Air pollution from nearby power generation and the elevated train infrastructure on 125th Street and adjacent corridors creates cumulative health burdens that disproportionately affect Black and Latino residents.",
        "done": "Sierra Club Atlantic Chapter participated in the broader New York State Beyond Coal campaign and worked with WE ACT and Harlem community groups to pressure Con Edison and the PSC to retire dirty generation and invest in cleaner alternatives. Sierra Club followed the lead of local environmental justice organizations.",
        "outcome": "The heavy fuel oil plants operating in and near Harlem have been retired. Con Edison has shifted toward cleaner natural gas and is under legal mandate to transition toward renewables. Air quality in Central Harlem has improved, though it remains elevated compared to wealthier Manhattan neighborhoods.",
        "bulletLink": "https://www.sierraclub.org/atlantic",
        "bulletLinkLabel": "Sierra Club Atlantic Chapter",
        "group": "sc_supported",
        "category": "env_health",
        "orgId": "sc_atlantic"
      },
      {
        "summary": "Supported the CLCPA equity provisions requiring 35% of clean energy benefits to flow to disadvantaged communities like Harlem.",
        "issue": "Previous clean energy legislation directed renewable investment primarily to large utilities and commercial customers, with limited direct benefit to low-income urban communities that bore disproportionate pollution burdens.",
        "why": "Harlem qualifies as a disadvantaged community under the CLCPA's equity screening criteria. This means 35% of the benefits from climate-related investment \u2014 clean energy programs, job training, efficiency upgrades \u2014 must be directed to communities like Harlem as a matter of law.",
        "done": "Sierra Club advocated for strong equity provisions in the CLCPA and for the robust definition of disadvantaged community used by the Climate Justice Working Group. Sierra Club worked with WE ACT and the NY Renews coalition to ensure the equity language was binding, not aspirational.",
        "outcome": "The CLCPA equity provisions are in effect. The Climate Justice Working Group has defined disadvantaged communities. State agencies are required to direct climate investment accordingly. Implementation is ongoing and imperfect, but the legal structure is in place.",
        "bulletLink": "https://www.nyrenews.org",
        "bulletLinkLabel": "NY Renews",
        "group": "sc_supported",
        "category": "climate",
        "orgId": "ny_renews"
      }
    ],
    "inProgress": [
      {
        "summary": "Advocating for Con Edison's Harlem infrastructure transition to support building electrification and clean heating.",
        "issue": "Harlem's building stock is predominantly older multifamily housing served by Con Edison steam and gas distribution infrastructure. Transitioning these buildings to electric heating requires both building-level upgrades and utility infrastructure investment that Con Edison has been slow to plan in lower-income neighborhoods.",
        "why": "Residents of older Harlem multifamily buildings face the highest energy costs per square foot in Manhattan, often in buildings with inadequate insulation and aging heating systems. Electrification and weatherization would lower energy bills and improve indoor air quality.",
        "done": "Sierra Club Atlantic Chapter is engaged in Con Edison rate cases at the PSC, advocating for utility investment plans that prioritize grid modernization and electrification support in disadvantaged communities including Harlem. Sierra Club supports the NY Renews coalition's advocacy for equitable utility planning.",
        "outcome": "Con Edison's 2025-2029 rate plan includes some equity-directed electrification investment, but environmental groups including Sierra Club consider it insufficient relative to the scale of need in communities like Harlem.",
        "bulletLink": "https://www.nyrenews.org",
        "bulletLinkLabel": "NY Renews",
        "group": "sc_supported",
        "category": "climate",
        "orgId": "ny_renews"
      }
    ],
    "involved": [
      {
        "summary": "Participate in Con Edison rate case proceedings to advocate for equitable electrification investment in Harlem.",
        "steps": [
          "Go to dps.ny.gov to find open PSC proceedings involving Con Edison.",
          "Submit written comments to the PSC urging that Con Edison's investment plans prioritize grid modernization and electrification support in Harlem and other disadvantaged communities.",
          "Sierra Club Atlantic Chapter coordinates PSC advocacy \u2014 sign up at sierraclub.org/atlantic to participate."
        ],
        "link": "https://www.sierraclub.org/atlantic",
        "linkLabel": "Sierra Club Atlantic Chapter",
        "bulletLink": "https://www.sierraclub.org/atlantic",
        "bulletLinkLabel": "Sierra Club Atlantic \u2014 PSC Advocacy",
        "group": "sc_supported",
        "category": "climate",
        "orgId": "sc_atlantic"
      },
      {
        "summary": "Connect with NY Renews, the coalition fighting for equitable clean energy implementation in communities like Harlem.",
        "steps": [
          "Go to nyrenews.org to learn about NY Renews campaigns and upcoming events.",
          "NY Renews is the statewide coalition that fought for the CLCPA equity provisions and continues to advocate for their full implementation.",
          "Volunteer or donate to support the coalition's ongoing work to hold state agencies accountable for directing clean energy benefits to Harlem and similar communities."
        ],
        "link": "https://www.nyrenews.org",
        "linkLabel": "NY Renews",
        "bulletLink": "https://www.nyrenews.org",
        "bulletLinkLabel": "NY Renews \u2014 Get Involved",
        "group": "other",
        "category": "justice",
        "orgId": "ny_renews"
      }
    ]
  },
  "10065": {
    "location": "Upper East Side, NY",
    "coords": { "lat": 40.7648, "lon": -73.9631 },
    "neighborhoods": [
      "Upper East Side",
      "Lenox Hill",
      "Yorkville"
    ],
    "delivered": [
      {
        "summary": "Protected the Central Park reservoir and surrounding watershed from pollution, safeguarding one of New York's most iconic green spaces.",
        "issue": "The Jacqueline Kennedy Onassis Reservoir in Central Park is part of New York City's water system and a significant ecological feature within the park. Pollution from surrounding development, park events, and urban runoff has periodically threatened water quality in and around the reservoir.",
        "why": "The Central Park reservoir watershed is the green heart of the Upper East Side. Protecting it from pollution protects both the park ecology and the quality of one of the most-used public green spaces in the world \u2014 directly accessible to UES residents.",
        "done": "Sierra Club Atlantic Chapter has engaged in Central Park Conservancy advocacy, supported New York State DEC oversight of park water bodies, and participated in the broader city park advocacy coalition that maintains pressure on the city to properly manage urban water resources.",
        "outcome": "The Central Park reservoir and surrounding park water features are regularly monitored and maintained. Urban runoff management in the park has improved through green infrastructure installations supported by advocacy that Sierra Club participated in.",
        "bulletLink": "https://www.centralparknyc.org",
        "bulletLinkLabel": "Central Park Conservancy",
        "group": "sc_supported",
        "category": "land",
        "orgId": "central_park"
      },
      {
        "summary": "Advocated for reduced vehicle emissions on the FDR Drive and York Avenue corridor adjacent to UES residential buildings.",
        "issue": "The FDR Drive runs along the entire eastern edge of the Upper East Side at river level, generating continuous vehicle exhaust that drifts into the adjacent residential blocks. York Avenue and the surrounding street grid also carry significant truck and bus traffic.",
        "why": "Residents living east of Lexington Avenue and particularly within a few blocks of the FDR face elevated exposure to nitrogen oxides and particulate matter from highway vehicle exhaust. This contributes to respiratory health risks for UES residents, particularly children and elderly people in ground-floor and low-rise apartments.",
        "done": "Sierra Club supported New York's adoption of stricter vehicle emissions standards aligned with California's clean car rules and advocated for the transition of MTA bus fleets to electric or zero-emission vehicles serving the UES.",
        "outcome": "New York adopted California clean car standards. The MTA has committed to an all-electric bus fleet by 2040 and is deploying electric buses on routes including those serving the Upper East Side. Vehicle emissions from bus routes on York and Madison Avenues have declined as the fleet transitions.",
        "bulletLink": "https://www.sierraclub.org/atlantic",
        "bulletLinkLabel": "Sierra Club Atlantic Chapter",
        "group": "sc_supported",
        "category": "env_health",
        "orgId": "sc_atlantic"
      }
    ],
    "inProgress": [
      {
        "summary": "Supporting the East Side Coastal Resiliency project to protect the UES waterfront from storm surge.",
        "issue": "The East River waterfront from 25th Street to 60th Street, including UES parks and the Carl Schurz Park area, is exposed to storm surge from the East River. The East Side Coastal Resiliency project is constructing flood protection infrastructure along this corridor.",
        "why": "Storm surge events damage waterfront parks, flood low-lying streets, and disrupt hospital infrastructure \u2014 NewYork-Presbyterian and Memorial Sloan Kettering are in the ESCR project zone. Protecting the waterfront protects both residents and critical medical infrastructure serving all of Manhattan.",
        "done": "Sierra Club Atlantic Chapter has supported the ESCR project through public advocacy and has advocated for design choices that maximize public green space and ecological value alongside flood protection function.",
        "outcome": "The ESCR project is under construction as of 2026, with completion targeted for 2026-2027 for the southern sections. The project represents one of the largest coastal resilience investments in New York City history.",
        "bulletLink": "https://www.sierraclub.org/atlantic",
        "bulletLinkLabel": "Sierra Club Atlantic Chapter",
        "group": "sc_supported",
        "category": "land",
        "orgId": "sc_atlantic"
      }
    ],
    "involved": [
      {
        "summary": "Attend Community Board 8 meetings when park, waterfront, and environmental issues are on the agenda.",
        "steps": [
          "Find Community Board 8 meeting schedules at cb8m.com \u2014 CB8 covers the Upper East Side from 59th to 96th Street.",
          "Environmental and parks items regularly come before CB8, including ESCR updates, Central Park management, and development proposals affecting UES green space.",
          "Register to speak during public comment on items affecting your neighborhood's environmental quality."
        ],
        "link": "https://www.cb8m.com",
        "linkLabel": "Community Board 8",
        "bulletLink": "https://www.cb8m.com",
        "bulletLinkLabel": "Community Board 8",
        "group": "other",
        "category": "land",
        "orgId": "cb8"
      },
      {
        "summary": "Support the Central Park Conservancy's ecological stewardship programs.",
        "steps": [
          "Go to centralparknyc.org/support to learn about volunteering and donation opportunities.",
          "The Conservancy runs tree planting, woodland restoration, and water feature stewardship programs that benefit the park ecology adjacent to UES neighborhoods.",
          "Sierra Club Atlantic Chapter partners with the Conservancy on advocacy to protect Central Park from development encroachment."
        ],
        "link": "https://www.centralparknyc.org",
        "linkLabel": "Central Park Conservancy",
        "bulletLink": "https://www.centralparknyc.org",
        "bulletLinkLabel": "Central Park Conservancy",
        "group": "other",
        "category": "land",
        "orgId": "central_park"
      }
    ]
  },
  "10128": {
    "location": "Yorkville / Carnegie Hill, NY",
    "coords": { "lat": 40.7796, "lon": -73.9505 },
    "neighborhoods": [
      "Yorkville",
      "Carnegie Hill",
      "East 80s/90s"
    ],
    "delivered": [
      {
        "summary": "Helped secure MTA's commitment to an all-electric bus fleet, reducing diesel exhaust on Madison Avenue and crosstown routes through Carnegie Hill.",
        "issue": "Madison Avenue, Fifth Avenue, and the major crosstown streets through Carnegie Hill and Yorkville carry significant MTA bus traffic. Older diesel buses on these routes generate particulate matter and nitrogen oxide emissions at street level where residents walk and children attend school.",
        "why": "Carnegie Hill has a high concentration of schools, pediatric medical practices, and senior facilities along the bus corridors. Diesel exhaust at street level poses the greatest respiratory risk to children and elderly residents \u2014 the populations most concentrated in this neighborhood.",
        "done": "Sierra Club Atlantic Chapter advocated for New York State's adoption of the MTA All-Electric Bus Transition Plan and for state funding commitments that make the transition feasible. Sierra Club worked with the MTA riders advocacy community to maintain pressure on the agency to meet its electric bus deployment targets.",
        "outcome": "The MTA has committed to an all-electric bus fleet by 2040 and is deploying electric buses on routes serving Carnegie Hill and Yorkville, including the M1, M2, M3, and M4 on Madison and Fifth Avenues.",
        "bulletLink": "https://www.sierraclub.org/atlantic",
        "bulletLinkLabel": "Sierra Club Atlantic Chapter",
        "group": "sc_supported",
        "category": "env_health",
        "orgId": "sc_atlantic"
      },
      {
        "summary": "Supported East River waterfront access improvements and protected John Jay Park from commercial encroachment.",
        "issue": "The East River waterfront in Yorkville, anchored by John Jay Park, has been subject to periodic development pressure from proposals to use the waterfront for private or commercial purposes rather than maintaining it as public open space.",
        "why": "John Jay Park and the adjacent waterfront are the primary outdoor recreational resource for Yorkville residents east of Second Avenue. Protecting this waterfront from commercial encroachment preserves public access to the East River for a densely populated neighborhood with limited alternative green space.",
        "done": "Sierra Club Atlantic Chapter engaged in land use advocacy to oppose commercial development proposals along the John Jay Park waterfront and supported Community Board 8's advocacy for maintaining the site as public parkland.",
        "outcome": "John Jay Park and the adjacent waterfront remain in public use. Commercial development proposals that would have privatized portions of the waterfront have been defeated.",
        "bulletLink": "https://www.cb8m.com",
        "bulletLinkLabel": "Community Board 8",
        "group": "sc_supported",
        "category": "land",
        "orgId": "cb8"
      }
    ],
    "inProgress": [
      {
        "summary": "Advocating for building emissions compliance under Local Law 97 in the Carnegie Hill residential stock.",
        "issue": "Carnegie Hill and Yorkville have a high concentration of large pre-war residential buildings that are among the most carbon-intensive building types in New York City due to their steam heating systems and poor insulation. Many of these buildings face significant compliance costs under Local Law 97.",
        "why": "If building owners in Carnegie Hill do not comply with Local Law 97, the legal framework for reducing building emissions citywide is weakened. Large pre-war residential buildings are a disproportionate contributor to the 70% of NYC greenhouse gas emissions that come from buildings.",
        "done": "Sierra Club Atlantic Chapter is engaged in the regulatory implementation of Local Law 97, advocating for strong enforcement and against exemptions that would relieve large residential buildings of their compliance obligations.",
        "outcome": "Local Law 97 is in effect for the first compliance period as of 2024. Many Carnegie Hill buildings are in the process of planning retrofits. Full compliance across the UES building stock will take years and requires sustained regulatory pressure.",
        "bulletLink": "https://www.sierraclub.org/atlantic",
        "bulletLinkLabel": "Sierra Club Atlantic Chapter",
        "group": "sc_supported",
        "category": "climate",
        "orgId": "sc_atlantic"
      }
    ],
    "involved": [
      {
        "summary": "Find out if your building complies with Local Law 97 and advocate for your neighbors if it does not.",
        "steps": [
          "Go to nyc.gov/site/buildings/index.page and search for your building's emissions compliance status.",
          "If your building is out of compliance, contact your building's management and your City Council member to ask what the compliance plan is.",
          "Sierra Club Atlantic Chapter can help you understand your rights as a tenant in a non-compliant building \u2014 contact them at sierraclub.org/atlantic."
        ],
        "link": "https://www.sierraclub.org/atlantic",
        "linkLabel": "Sierra Club Atlantic Chapter",
        "bulletLink": "https://www.nyc.gov/site/buildings/index.page",
        "bulletLinkLabel": "NYC Buildings \u2014 LL97 Status",
        "group": "sc_supported",
        "category": "climate",
        "orgId": "nyc_buildings"
      },
      {
        "summary": "Volunteer with Trees New York to increase the urban tree canopy in Yorkville.",
        "steps": [
          "Go to treesny.org/volunteer to find stewardship and planting events in your area.",
          "Urban trees reduce heat island effect, improve air quality, and absorb stormwater \u2014 direct environmental benefits for Yorkville residents.",
          "Sierra Club Atlantic Chapter supports the urban forestry programs that Trees New York implements citywide."
        ],
        "link": "https://www.treesny.org",
        "linkLabel": "Trees New York",
        "bulletLink": "https://www.treesny.org",
        "bulletLinkLabel": "Trees New York \u2014 Volunteer",
        "group": "other",
        "category": "land",
        "orgId": "trees_ny"
      }
    ]
  }
};

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
const NYC_LOCATIONS = [
  { zip:"10001", label:"Chelsea",                        sub:"Hell\'s Kitchen · Hudson Yards" },
  { zip:"10002", label:"Lower East Side / Chinatown",    sub:"Two Bridges · Delancey" },
  { zip:"10007", label:"Tribeca / Financial District",   sub:"Battery Park City · Wall Street" },
  { zip:"10011", label:"West Village / Greenwich Village", sub:"Meatpacking · Washington Square" },
  { zip:"10025", label:"Upper West Side",                sub:"Morningside Heights · Riverside Park" },
  { zip:"10029", label:"East Harlem",                    sub:"El Barrio · Spanish Harlem" },
  { zip:"10031", label:"Harlem",                         sub:"Hamilton Heights · Sugar Hill" },
  { zip:"10065", label:"Upper East Side",                sub:"Lenox Hill · Carl Schurz Park" },
  { zip:"10128", label:"Yorkville / Carnegie Hill",      sub:"East 80s · East 90s" },
];

// Great-circle distance in miles between two lat/lon points.
function haversineMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Finds the covered location whose centroid is closest to a sensed position.
function nearestLocation(lat, lon) {
  let bestZip = null, bestDist = Infinity;
  for (const zip of Object.keys(LOCATION_DATA)) {
    const c = LOCATION_DATA[zip].coords;
    if (!c) continue;
    const d = haversineMiles(lat, lon, c.lat, c.lon);
    if (d < bestDist) { bestDist = d; bestZip = zip; }
  }
  return { zip: bestZip, distanceMiles: bestDist };
}

// localStorage keys so a manually chosen location and saved criteria stick
// across a page reload instead of silently resetting to the defaults.
const STORAGE_KEYS = {
  zip: "localimpact.zip",
  geoStatus: "localimpact.geoStatus",
  interests: "localimpact.interests",
};

function readStoredZip() {
  try {
    const savedZip = window.localStorage.getItem(STORAGE_KEYS.zip);
    const savedStatus = window.localStorage.getItem(STORAGE_KEYS.geoStatus);
    if (savedZip && savedStatus === "manual" && LOCATION_DATA[savedZip]) return savedZip;
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
      orgs: Array.isArray(parsed.orgs) ? parsed.orgs : [],
    };
  } catch {}
  return null;
}

// Matches a typed/dictated location description against the covered
// locations, but only when confident: either the whole query is a direct
// substring of a location's name/zip/neighborhood list, or every
// significant word in the query appears there. A partial word overlap
// (e.g. "new" and "york" both showing up just because one label happens to
// spell out "New York" while its siblings abbreviate to "NY") is NOT
// treated as a match — it's cheap coincidence, not a real signal, and
// returning null here lets the caller fall through to real geocoding
// instead of confidently snapping to the wrong neighborhood.
function matchLocationQuery(text) {
  const q = text.toLowerCase().trim();
  if (!q) return null;
  if (LOCATION_DATA[q]) return q;
  const words = q.split(/[\s,]+/).filter(w => w.length > 2);
  let bestZip = null, bestScore = 0;
  for (const zip of Object.keys(LOCATION_DATA)) {
    const entry = LOCATION_DATA[zip];
    const haystack = [entry.location, ...(entry.neighborhoods || []), zip].join(" ").toLowerCase();
    let score = 0;
    if (haystack.includes(q)) {
      score = q.length + 5;
    } else if (words.length && words.every(w => haystack.includes(w))) {
      score = words.length;
    }
    if (score > bestScore) { bestScore = score; bestZip = zip; }
  }
  return bestZip;
}

// Falls back to a real, free geocode (via /api/geocode, which proxies
// OpenStreetMap Nominatim) when the local fuzzy match in matchLocationQuery
// can't find anything — e.g. "Fort Lauderdale" or a street address that
// isn't one of the 13 curated neighborhood names. Snaps the geocoded
// coordinates to the nearest covered location the same way GPS sensing
// does. Never throws: any failure just resolves to null, same as a local
// match miss, so the caller's existing "do nothing, just close" handling
// covers it for free.
async function geocodeAndSnap(text) {
  try {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(text)}`);
    if (!res.ok) return null;
    const { lat, lon } = await res.json();
    if (lat == null || lon == null) return null;
    const nearest = nearestLocation(lat, lon);
    return nearest.zip || null;
  } catch {
    return null;
  }
}

// Calls the /api/search serverless function — the live "ask anything
// anywhere" path. It's grounded with real web search and never throws:
// a missing API key, a network error, or a bad response all resolve to an
// empty result, so the caller can always just await it and merge in
// whatever came back, exactly like the local-only matches.
async function searchLive(topic, locationLabel, zip) {
  const empty = { delivered: [], inProgress: [] };
  try {
    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, locationLabel, zip }),
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

// `org` is either a curated org id (string, looked up in ORGS) or a full
// org object returned inline by a live search result.
function OrgSheet({ org: orgRef, onClose }) {
  const C = useContext(CContext);
  const org = typeof orgRef === "string" ? ORGS[orgRef] : orgRef;
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
  const isAction = Array.isArray(item.steps);
  const labels = STORY_LABELS[tense];
  const storyFields = isAction ? [] : [item.issue, item.why, item.done, item.outcome];
  // Curated items reference an org by id (looked up in ORGS); live-searched
  // items carry the full org profile inline since they aren't in ORGS.
  const org = item.org || ORGS[item.orgId];
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
        {item.live && (
          <div style={{ fontSize:10, fontWeight:700, color:C.textLight, marginTop:6 }}>🔎 Found via live search — verify before relying on this</div>
        )}
        {org && (
          <div onClick={e => { e.stopPropagation(); onOrgClick(item.org || item.orgId); }}
            style={{ display:"flex", alignItems:"center", gap:7, marginTop:8, cursor:"pointer" }}>
            <span style={{ fontSize:14 }}>{org.emoji}</span>
            <span style={{ fontSize:12.5, fontWeight:700, color:C.green }}>{org.name}</span>
            <span style={{ fontSize:11, color:C.textLight, marginLeft:"auto" }}>→</span>
          </div>
        )}
      </div>
      {open && !isAction && (
        <div style={{ marginTop:6, background:C.white, borderLeft:`5px solid ${cat.color}`, borderRadius:16, padding:16, fontSize:13.5, lineHeight:1.75, color:C.textMid, boxShadow:"0 1px 3px rgba(30,20,50,0.06)" }}>
          {storyFields.map((text, i) => (
            <div key={i} style={{ marginBottom:i < 3 ? 14 : 0 }}>
              <div style={{ fontSize:10, fontWeight:800, color:cat.color, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:4 }}>{labels[i]}</div>
              <div>{text}</div>
            </div>
          ))}
        </div>
      )}
      {open && isAction && (
        <div style={{ marginTop:6, background:C.white, borderLeft:`5px solid ${cat.color}`, borderRadius:16, padding:16, boxShadow:"0 1px 3px rgba(30,20,50,0.06)" }}>
          {item.steps.map((step, i) => (
            <div key={i} style={{ display:"flex", gap:10, marginBottom:10, alignItems:"flex-start" }}>
              <div style={{ flexShrink:0, width:22, height:22, borderRadius:"50%", background:cat.color, fontSize:11, fontWeight:700, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>{i + 1}</div>
              <div style={{ fontSize:13, lineHeight:1.7, color:C.textMid, paddingTop:2 }}>{step}</div>
            </div>
          ))}
          {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:4, marginTop:6, fontSize:13, fontWeight:700, color:cat.color, textDecoration:"none", borderBottom:`1px solid ${cat.border || C.borderGreen}`, paddingBottom:1 }}>↗ {item.linkLabel}</a>}
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
// about gets matched to topics and orgs entirely behind the scenes on Save —
// no live preview, no checklists. Saving applies it and returns to the feed.
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
    onSave({ query, categories: matched.categories, orgs: matched.orgs });
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

// Replaces the old browsable neighborhood list: type or dictate a location
// description (address, city, zip) and matchLocationQuery resolves it, or
// fall back to re-sensing GPS via "Use my current location".
function LocationModal({ onSelectZip, onUseCurrentLocation, onClose }) {
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
    if (saving) return;
    const localZip = matchLocationQuery(query);
    if (localZip) { onSelectZip(localZip); onClose(); return; }
    setSaving(true);
    const geocodedZip = await geocodeAndSnap(query);
    setSaving(false);
    if (geocodedZip) onSelectZip(geocodedZip);
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

// Brief transition shown after saving Preferences — makes the background
// matching feel like it's actually doing something before landing back on
// the (already-filtered) feed, rather than an instant, unexplained jump.
function SearchInterstitial({ query }) {
  const C = useContext(CContext);
  return (
    <div style={{ position:"absolute", inset:0, zIndex:500, background:C.headerGradient, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 40px", textAlign:"center" }}>
      <div style={{ fontSize:38, marginBottom:16, animation:"pulse 1.1s ease-in-out infinite" }}>🔍</div>
      <div style={{ fontFamily:"Fraunces, serif", fontSize:17, fontWeight:700, color:"#fff", marginBottom:6 }}>Finding who's fighting for you</div>
      {query?.trim() && <div style={{ fontSize:12, color:"rgba(255,255,255,0.8)" }}>Matching "{query.length > 60 ? query.slice(0, 60) + "…" : query}"</div>}
    </div>
  );
}

export default function App() {
  const [skinId]                          = useState("civic");
  const [initialManualZip]                = useState(() => readStoredZip());
  const [zip, setZip]                     = useState(initialManualZip || "10025");
  const [locData, setLocData]             = useState(LOCATION_DATA[initialManualZip || "10025"]);
  const [activeTab, setActiveTab]         = useState("delivered");
  const [searching, setSearching]         = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [activeOrg, setActiveOrg]         = useState(null);
  const [interests, setInterests]         = useState(() => readStoredInterests() || { query:"", categories:[], orgs:[] });
  const [geo, setGeo]                     = useState(() => initialManualZip ? { status:"manual", distanceMiles:null } : { status:"locating", distanceMiles:null });
  const [interstitial, setInterstitial]   = useState(false);
  const [liveResults, setLiveResults]     = useState({ delivered:[], inProgress:[] });

  const skin = SKINS[skinId];
  const C    = makeC(skin);

  const locateMe = () => {
    if (!("geolocation" in navigator)) { setGeo({ status:"unsupported", distanceMiles:null }); return; }
    setGeo({ status:"locating", distanceMiles:null });
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        const nearest = nearestLocation(latitude, longitude);
        if (!nearest.zip) { setGeo({ status:"unsupported", distanceMiles:null }); return; }
        setZip(nearest.zip);
        setLocData(LOCATION_DATA[nearest.zip]);
        setActiveTab("delivered");
        setLiveResults({ delivered:[], inProgress:[] });
        setGeo({ status:"sensed", distanceMiles:nearest.distanceMiles });
      },
      () => setGeo({ status:"denied", distanceMiles:null }),
      { enableHighAccuracy:false, timeout:8000, maximumAge:5 * 60 * 1000 }
    );
  };

  // Only auto-sense on mount if the user hasn't explicitly picked a location
  // in a prior session — a persisted manual choice sticks until they change
  // it or explicitly tap "Use my current location" again.
  useEffect(() => { if (!initialManualZip) locateMe(); }, []);

  // Persist the location choice so a page reload (routine on mobile — a
  // backgrounded or revisited tab) doesn't silently reset to the default zip
  // and re-trigger GPS sensing. A manual pick is remembered; explicitly
  // re-sensing clears it so future reloads go back to auto-sensing.
  useEffect(() => {
    try {
      if (geo.status === "manual") {
        window.localStorage.setItem(STORAGE_KEYS.zip, zip);
        window.localStorage.setItem(STORAGE_KEYS.geoStatus, "manual");
      } else if (geo.status === "sensed") {
        window.localStorage.removeItem(STORAGE_KEYS.zip);
        window.localStorage.removeItem(STORAGE_KEYS.geoStatus);
      }
    } catch {}
  }, [zip, geo.status]);

  // Persist "what you care about" the same way, so it survives a reload too.
  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEYS.interests, JSON.stringify(interests)); } catch {}
  }, [interests]);

  const handleSelect       = z  => { setZip(z); setLocData(LOCATION_DATA[z]); setActiveTab("delivered"); setLiveResults({ delivered:[], inProgress:[] }); setGeo({ status:"manual", distanceMiles:null }); };

  // Static matching (matchInterests, already run inside PreferencesPanel)
  // covers the hand-authored dataset instantly and for free. Saving also
  // kicks off a live, web-search-grounded lookup for the same topic at the
  // current location — this is the "ask anything anywhere" path: it's what
  // makes a topic outside the curated categories (e.g. "racial justice"
  // somewhere with no curated coverage) return something instead of
  // silently nothing. searchLive never throws, so there's no error state to
  // show — a save with no live results just shows whatever was already
  // there.
  const handleSavePreferences = async updated => {
    setInterests(updated);
    setShowPreferences(false);
    if (!updated.query || !updated.query.trim()) {
      setLiveResults({ delivered:[], inProgress:[] });
      return;
    }
    setInterstitial(true);
    const live = await searchLive(updated.query, locData.location, zip);
    setLiveResults(live);
    setInterstitial(false);
  };

  const tab                 = TABS.find(t => t.id === activeTab);
  // "Fighting for you" folds in the old "Get involved" content — the active
  // campaigns and the concrete ways to join one are both part of the same
  // ongoing fight, and splitting them into a third tab had silently made
  // every "involved"-only category (all of "justice") unreachable.
  const staticItems          = activeTab === "inProgress"
                              ? [...(locData.inProgress || []), ...(locData.involved || [])]
                              : (locData[activeTab] || []);
  const items                = [...staticItems, ...(liveResults[activeTab] || [])];
  const currentNeighborhood = NYC_LOCATIONS.find(l => l.zip === zip);
  const hasPrefs            = interests.categories.length > 0 || interests.orgs.length > 0;
  // A search that matched none of the 4 curated categories AND came back
  // empty from live search would otherwise silently fall through to
  // showing every story, unfiltered — indistinguishable from never having
  // searched at all. Surface that honestly instead of pretending nothing happened.
  const searchedNothingSpecific = !!interests.query?.trim() && !hasPrefs &&
    liveResults.delivered.length === 0 && liveResults.inProgress.length === 0;

  const locationLabel = geo.status === "locating" ? "Finding your location…" : (currentNeighborhood?.label || locData.location);
  const locationSub   = geo.status === "locating" ? null : (currentNeighborhood?.sub || null);
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
                {locationSub && <span style={{ fontSize:11, color:"rgba(255,255,255,0.75)" }}>{locationSub}</span>}
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
          {searchedNothingSpecific && (
            <div style={{ background:C.greenLight, border:`1px solid ${C.borderGreen}`, borderRadius:12, padding:"10px 14px", marginBottom:14, fontSize:12, color:C.textMid, lineHeight:1.4 }}>
              Nothing specific found for "{interests.query.length > 50 ? interests.query.slice(0, 50) + "…" : interests.query}" yet — showing everything happening near you instead.
            </div>
          )}
          <CategoryGroupedList items={items} tense={tab.tense} tabId={activeTab} interests={interests} onOrgClick={setActiveOrg} />
        </div>

        {searching       && <LocationModal     onSelectZip={handleSelect} onUseCurrentLocation={locateMe} onClose={() => setSearching(false)} />}
        {activeOrg       && <OrgSheet          org={activeOrg} onClose={() => setActiveOrg(null)} />}
        {showPreferences && <PreferencesPanel  interests={interests} onSave={handleSavePreferences} onClose={() => setShowPreferences(false)} />}
        {interstitial    && <SearchInterstitial query={interests.query} />}

      </div>

      <div style={{ marginTop:16, fontSize:11, color:"#999", letterSpacing:"0.06em", textTransform:"uppercase", textAlign:"center" }}>
        {Object.keys(LOCATION_DATA).length} locations covered
        {geo.status === "sensed"      && " · using your location"}
        {geo.status === "denied"      && " · location off, showing default"}
        {geo.status === "unsupported" && " · location unavailable, showing default"}
        {geo.status === "manual"      && " · manually selected"}
        {geo.status === "locating"    && " · locating…"}
      </div>
    </div>
    </SkinContext.Provider>
    </CContext.Provider>
  );
}
