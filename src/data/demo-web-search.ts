// ─── AGAI web search demo: "Director Marcus Webb's wildfire season" ───────────
// Scripted, presentation-style flow that walks through the three jobs scoped
// in the AI UX journal's phase 2 (AI fit): J1 Look up (Automate), J2 Connect /
// disclosure-drift analysis (Augment), J3 Stay current (Inform).
//
// Content is grounded in the real director interview behind the journal
// (design-journal/agai-web-search.ai_ux_journal.md, evidence E7 — Michael
// Camuñez, Edison International / Capital Group, Nov 4 2026). Fru decided
// (2026-11-18) to keep the real scenario substance — wildfire mitigation plan
// disclosure drift, analyst consensus and outliers, "rate base" shorthand,
// daily news-clips feed — but fictionalize every identifying name: the
// director, the company, the regulator and the industry association are all
// invented. Do not use Michael's or Edison's real name here; the journal
// keeps him anonymized as "Director M" even internally.

import type { Source } from "./mockData.js";
import type { RichBlock } from "./hybrid-search.constants.js";
import { isDemoPath, type DemoStep, type DemoRailNote } from "./demo-agai-integration-usecases.js";
import type { ReasoningData } from "./web-search-scenario.js";

// Jobs that need the web go through the SAME proactive offer → one-time
// disclosure → visible-search mechanism already built for the admin SEC
// scenario (web-search-scenario.ts), not a parallel system. J1 doesn't need
// the web at all (the model's own knowledge is enough), so it has no entry
// here and never shows the offer.
export interface WsWebOfferConfig {
  /** Offer card title, shown while pending/declined. */
  webOfferTitle: string;
  /** "I checked what I already have, it's not enough" — kept on the offer message. */
  offerReasoning: ReasoningData;
  offerContent: RichBlock[];
  offerSources: Source[];
  /** Real search terms and pages read, shown live then kept as an audit trail. */
  answerReasoning: ReasoningData;
  answerContent: RichBlock[];
  answerSources: Source[];
  /** Used when web search is already on — skips the offer, searches directly. */
  directReasoning: ReasoningData;
}

export const WS_DEMO_START_PATH = "/director";

/** This script has fully replaced the Janice/AGAI-integration-usecases demo
 *  (Fru, 2026-11-19) — no separate /director/web-search space, and no
 *  fallback to Janice's persona anywhere the director demo is active. Same
 *  path match as isDemoPath so nothing in between (e.g. a book reader) falls
 *  back to the old script or avatar. */
export const isWsDemoPath = isDemoPath;

export const WS_DEMO_DIRECTOR = { name: "Marcus Webb", initials: "MW", id: "marcus-webb" };
const COMPANY = "Cascadia Electric & Power";
const REGULATOR = "the Cascadia Utilities Commission";
const TRADE_GROUP = "the Western Utilities Council";

export const WS_DEMO_THINKING_LABEL_MS = 1300;

// ─── Reasoning helpers ─────────────────────────────────────────────────────
// A reasoning line can carry the exact search terms, written into `detail`
// verbatim and prefixed "Searched:", so the step list stays the plain
// {title, detail} shape the rest of the demo machinery already renders —
// matching the phase-3 decision that search terms must be visible to the
// director (section G of the discovery doc, P11).

const AI_FIT_NOTE = (role: "Automate" | "Augment" | "Inform", why: string, screener: string, fallback: string): string =>
  `Role: ${role}. ${why} AI Design Screener: ${screener}. Non-AI fallback: ${fallback}`;

// ─── Step 1 — J1 Look up (Automate) ────────────────────────────────────────

const J1_RAIL: DemoRailNote = {
  source: "Model's own general knowledge — no board materials or web needed",
  today: [
    "Opens a consumer AI tool or a search engine on his phone, outside Boards.",
    "Asks a quick, slightly embarrassing question he'd rather not ask the CFO directly.",
  ],
  benefits: [
    AI_FIT_NOTE(
      "Automate",
      "Answers directly, no confirm step, no search — a term lookup is low-stakes, well-structured, and usually within the model's own knowledge.",
      "~13 AI : 1 neutral (not ambiguous, well-structured, errors cheap to fix, no expertise needed).",
      "Accepted: director reroutes to consumer AI outside Boards if this isn't answerable directly — not worth building a separate non-AI path.",
    ),
    "Director M's own words (E7.4): \"I can ask questions of AI that I would be maybe embarrassed to ask… it's the equivalent of Google.\"",
  ],
  possibleToday: false,
  useCases: [],
};

const STEP_1: DemoStep = {
  prompt: "Quick one — what's \"rate base\" actually mean?",
  threadTitle: "Rate base, quick check",
  reasoningIntro: "",
  // No reasoning trail at all — this doesn't need board materials or the web.
  reasoning: [],
  sources: [],
  richContent: [
    {
      type: "p",
      spans: [
        "Rate base is the value of the property a utility is allowed to earn a return on for regulators — mainly plant in service, less depreciation, plus working capital.",
      ],
    },
    {
      type: "p",
      spans: [
        `It's the number ${REGULATOR} uses to set what ${COMPANY} is allowed to charge, so a bigger, newer rate base (more capital investment) generally supports higher allowed revenue, within what regulators approve.`,
      ],
    },
  ],
  rail: J1_RAIL,
};

// ─── Step 2 — J2 Connect (Augment): disclosure drift ───────────────────────

const WILDFIRE_RESOLUTION_SOURCE = (index: number, page: "4" | "5"): Source => ({
  index,
  title: "Draft 10-Q — Wildfire mitigation risk factor",
  book: "Q3 2026 Board Book",
  page,
  documentId: "ws-draft-10q-wildfire",
  targetPage: page === "4" ? 2 : 3,
  module: "Books",
  chipData: "Q3 2026 Board Book",
});

const J2_WEB_SOURCES: Source[] = [
  {
    index: 3,
    title: `${REGULATOR} — Wildfire Mitigation Plan, proposed decision`,
    module: "Web",
    site: "cascadia-puc.gov",
    chipData: "Wildfire Mitigation Plan — proposed decision",
    url: "https://www.cascadia-puc.gov/dockets/wildfire-mitigation-2026/proposed-decision",
    published: "Oct 16, 2026",
    snippet:
      "The proposed decision would require expanded undergrounding commitments and enhanced vegetation management in high fire-threat districts, with a vote scheduled for the Commission's next business meeting.",
  },
  {
    index: 4,
    title: `${COMPANY} — prior-year 10-Q, wildfire risk factor`,
    module: "Web",
    site: "sec.gov",
    chipData: "10-Q Q3 2025, risk factors",
    url: "https://www.sec.gov/cgi-bin/browse-edgar",
    published: "Nov 2025",
    snippet:
      "Risk factor language from the same quarter last year, filed with the SEC, used here only to compare wording against this year's draft.",
  },
];

const J2_RAIL: DemoRailNote = {
  source: "Board materials (this year's draft 10-Q) + web (last year's filed 10-Q, the regulator's docket)",
  today: [
    "Reads the draft risk-factor language and tries to remember how it read last year — or asks Legal to pull the old filing and diff it by hand.",
    "No blackline exists between quarters today (Director M's stated real pain point).",
  ],
  benefits: [
    AI_FIT_NOTE(
      "Augment",
      "Drafts the comparison; the director reviews it before relying on it — this is legally sensitive, not a direct-answer task.",
      "~10 Manual : 3-4 AI (ambiguous, needs expertise and precision, legally/socially accountable) — a Manual-leaning score here supports Augment, not Automate: AI drafts, the director finishes the judgment.",
      "Status quo: the director (or Legal) does this comparison by hand when AI is off — not a new path to build.",
    ),
    "Director M's own words (E7.6): \"What's the 10% of the Q that's different? … That's the essence of a director's judgment… lawsuits are filed over this stuff.\"",
    "Standard citations are the review mechanism here — no separate \"draft\" label on the answer (Fru, phase 3 decision).",
  ],
  possibleToday: false,
  useCases: [],
};

const STEP_2: DemoStep = {
  prompt: "How has our wildfire mitigation plan disclosure changed since last year's 10-Q?",
  threadTitle: "Wildfire disclosure drift, Q3 vs last year",
  reasoningIntro: "I'll compare this quarter's draft risk-factor language with the filing from the same quarter last year, then check the regulator's current docket for anything that should be reflected.",
  // The real reasoning trail (offer + full search) lives in J2_WEB_OFFER
  // below and renders via MessageReasoning/WebSearchOfferCard, not this flat
  // DemoStep path — kept empty so the two don't both render.
  reasoning: [],
  sources: [WILDFIRE_RESOLUTION_SOURCE(1, "4"), WILDFIRE_RESOLUTION_SOURCE(2, "5"), ...J2_WEB_SOURCES],
  richContent: [
    {
      type: "p",
      spans: [
        "The draft risk factor adds two things that weren't in last year's filing, and leaves one thing unchanged that the regulator's pending decision may affect.",
      ],
    },
    {
      type: "table",
      columns: ["Section", "This year (draft)", "Last year (filed)", "Why it matters"],
      defaultTextColor: true,
      rows: [
        [
          ["Undergrounding commitments"],
          ["New paragraph describing expanded undergrounding in high fire-threat districts. ", { cite: 1 }],
          ["Not mentioned. ", { cite: 4 }],
          [`Matches language in ${REGULATOR}'s proposed decision, not yet final. `, { cite: 3 }],
        ],
        [
          ["Vegetation management cost estimate"],
          ["Cost range widened by roughly 15%. ", { cite: 2 }],
          ["Narrower range, same methodology. ", { cite: 4 }],
          ["Worth confirming with Legal whether the wider range needs its own explanation."],
        ],
        [
          ["Litigation exposure from prior fire seasons"],
          ["Unchanged boilerplate. ", { cite: 2 }],
          ["Same boilerplate. ", { cite: 4 }],
          [`If the regulator's decision lands before filing, this section may need an update — the vote is still pending. `, { cite: 3 }],
        ],
      ],
    },
    {
      type: "p",
      spans: [
        "I'm flagging this for your review, not deciding it for you: the two changes track the regulator's pending decision reasonably closely, but whether that's sufficient disclosure is a judgment call for you and Legal, not something I can confirm.",
      ],
    },
    { type: "p", spans: ["The regulator's decision is proposed, not final, as of October 16, 2026. AI-generated content may have inaccuracies."] },
  ],
  rail: J2_RAIL,
};

const J2_WEB_OFFER: WsWebOfferConfig = {
  webOfferTitle: "Search the web for last year's filing and the regulator's docket",
  offerReasoning: {
    intro: "I'll check your board materials for the draft language first.",
    steps: [
      { title: "Read the draft 10-Q", text: "Read the wildfire mitigation risk factor in your Q3 2026 board book, pages 4–5." },
    ],
  },
  offerContent: [
    {
      type: "p",
      spans: [
        "Your draft risk factor adds a new paragraph on undergrounding commitments and widens the vegetation management cost estimate. ",
        { cite: 1 },
      ],
    },
    {
      type: "p",
      spans: [
        "I don't have last year's filing or the regulator's current docket to compare this against — I can search the web for both.",
      ],
    },
  ],
  offerSources: [WILDFIRE_RESOLUTION_SOURCE(1, "4"), WILDFIRE_RESOLUTION_SOURCE(2, "5")],
  answerReasoning: {
    intro: STEP_2.reasoningIntro,
    steps: [
      { title: "Read the draft 10-Q", text: "Read the wildfire mitigation risk factor in your Q3 2026 board book, pages 4–5." },
      {
        title: "Search the web",
        queries: [
          "Cascadia Electric Power 10-Q wildfire risk factor prior year",
          "Cascadia Utilities Commission wildfire mitigation plan decision 2026",
        ],
        pages: J2_WEB_SOURCES.map((s) => ({ site: s.site!, title: s.title })),
        note: "Found the prior-year filing and the regulator's pending decision.",
      },
      { title: "Compare the language", text: "Compared this quarter's draft wording against the same section last year, and checked both against the regulator's current docket." },
    ],
  },
  answerContent: STEP_2.richContent,
  answerSources: STEP_2.sources,
  directReasoning: {
    intro: "I'll check your board materials, search the web for last year's filing and the regulator's docket, and compare the two.",
    steps: [
      { title: "Read the draft 10-Q", text: "Read the wildfire mitigation risk factor in your Q3 2026 board book, pages 4–5." },
      {
        title: "Search the web",
        queries: [
          "Cascadia Electric Power 10-Q wildfire risk factor prior year",
          "Cascadia Utilities Commission wildfire mitigation plan decision 2026",
        ],
        pages: J2_WEB_SOURCES.map((s) => ({ site: s.site!, title: s.title })),
        note: "Found the prior-year filing and the regulator's pending decision.",
      },
      { title: "Compare the language", text: "Compared this quarter's draft wording against the same section last year, and checked both against the regulator's current docket." },
    ],
  },
};

// ─── Step 3 — J3 Stay current (Inform) ─────────────────────────────────────

const J3_WEB_SOURCES: Source[] = [
  {
    index: 1,
    title: `${REGULATOR} — Wildfire Mitigation Plan docket, vote scheduled`,
    module: "Web",
    site: "cascadia-puc.gov",
    chipData: "Wildfire Mitigation Plan — vote scheduled",
    url: "https://www.cascadia-puc.gov/dockets/wildfire-mitigation-2026",
    published: "Nov 10, 2026",
    snippet: "The Commission's vote on the proposed decision is now scheduled, after being pending since mid-October.",
  },
  {
    index: 2,
    title: "Analyst note: two downgrades cite wildfire liability exposure",
    module: "Web",
    site: "marketwatch.com",
    chipData: "Analyst note, Nov 2026",
    url: "https://www.marketwatch.com/",
    published: "Nov 14, 2026",
    snippet: "Two sell-side analysts moved to Hold this week, both citing wildfire liability exposure; three others kept Buy ratings unchanged.",
  },
  {
    index: 3,
    title: `${TRADE_GROUP} — federal wildfire liability fund proposal, updated position`,
    module: "Web",
    site: "westernutilities.org",
    chipData: "Federal liability fund — updated position",
    url: "https://www.westernutilities.org/policy/wildfire-liability-fund",
    published: "Nov 12, 2026",
    snippet: "The council updated its position paper on a federal wildfire liability backstop fund, after member utilities raised concerns about state-level patchwork rules.",
  },
];

const J3_RAIL: DemoRailNote = {
  source: `Web (${REGULATOR}, analyst coverage, ${TRADE_GROUP}) — the admin's source list for the whole site, set up once, not re-asked per question`,
  today: [
    "Runs his own AI agents outside Boards to track public filings, analyst reports and press coverage (E7.1).",
    "Another director (2024 research, E9.2) reads 2-3 hours a day to stay on top of industry news.",
  ],
  benefits: [
    AI_FIT_NOTE(
      "Inform",
      "Surfaces what's new since he last checked; he decides what to open — pull, not push.",
      "~12-13 AI : 1 neutral (repetitive, well-structured, time-consuming by hand) — strongly AI, but the role stays Inform, not Automate: deciding what's \"news-worthy\" and pushing it would overwhelm him, which the evidence explicitly warns against.",
      "Status quo: his own outside tools and feeds when this is off.",
    ),
    "Director M's own words (E7.12): \"It's not like I want to receive reports. I just want them there.\"",
    "On-demand \"ask AI to draft something from this\" is a separate, later Augment-role feature — not shown here (flagged in phase 2, out of scope for this screen).",
  ],
  possibleToday: false,
  useCases: [],
};

const STEP_3: DemoStep = {
  prompt: "Anything new on the wildfire front since I last checked?",
  threadTitle: "What's new — wildfire and related coverage",
  reasoningIntro: "I'll search the web for anything new since your last session.",
  // The real reasoning trail (offer + full search) lives in J3_WEB_OFFER
  // below and renders via MessageReasoning/WebSearchOfferCard, not this flat
  // DemoStep path — kept empty so the two don't both render.
  reasoning: [],
  sources: J3_WEB_SOURCES,
  richContent: [
    { type: "p", spans: ["Three things changed since your last session — I'm surfacing them, not deciding which matters most:"] },
    {
      type: "list",
      items: [
        [`${REGULATOR}'s Wildfire Mitigation Plan vote is now scheduled, after being a pending proposed decision since October. `, { cite: 1 }],
        ["Two sell-side analysts moved to Hold this week, citing wildfire liability exposure; three others kept Buy ratings unchanged — worth a look if you want the outlier view before the vote. ", { cite: 2 }],
        [`${TRADE_GROUP} updated its position on a federal wildfire liability backstop fund. `, { cite: 3 }],
      ],
    },
    { type: "p", spans: ["Nothing here needs action from you today — this is what's changed, for you to open if and when you want to."] },
  ],
  rail: J3_RAIL,
};

const J3_WEB_OFFER: WsWebOfferConfig = {
  webOfferTitle: "Search the web for what's changed",
  offerReasoning: {
    intro: "I'll check what's saved for this board, then let you know if I need to go further.",
    steps: [
      { title: "Check your tracked sources", text: "Checked what's saved for this board from your last session — I don't have anything newer without searching the web again." },
    ],
  },
  offerContent: [
    {
      type: "p",
      spans: [
        "I don't have anything newer than your last session without checking the web. I can search the web for what's changed.",
      ],
    },
  ],
  offerSources: [],
  answerReasoning: {
    intro: STEP_3.reasoningIntro,
    steps: [
      {
        title: "Check the regulator's docket",
        queries: ["Cascadia Utilities Commission Wildfire Mitigation Plan docket vote"],
        pages: [{ site: J3_WEB_SOURCES[0].site!, title: J3_WEB_SOURCES[0].title }],
        note: "The vote, pending since October, is now scheduled.",
      },
      {
        title: "Check analyst coverage",
        queries: ["Cascadia Electric Power analyst rating wildfire liability November 2026"],
        pages: [{ site: J3_WEB_SOURCES[1].site!, title: J3_WEB_SOURCES[1].title }],
        note: "Two downgrades this week, both citing wildfire liability.",
      },
      {
        title: "Check the trade association",
        queries: ["Western Utilities Council federal wildfire liability fund position"],
        pages: [{ site: J3_WEB_SOURCES[2].site!, title: J3_WEB_SOURCES[2].title }],
        note: "Updated its position on the federal wildfire liability fund.",
      },
    ],
  },
  answerContent: STEP_3.richContent,
  answerSources: STEP_3.sources,
  directReasoning: {
    intro: "I'll search the web for anything new since your last session.",
    steps: [
      {
        title: "Check the regulator's docket",
        queries: ["Cascadia Utilities Commission Wildfire Mitigation Plan docket vote"],
        pages: [{ site: J3_WEB_SOURCES[0].site!, title: J3_WEB_SOURCES[0].title }],
        note: "The vote, pending since October, is now scheduled.",
      },
      {
        title: "Check analyst coverage",
        queries: ["Cascadia Electric Power analyst rating wildfire liability November 2026"],
        pages: [{ site: J3_WEB_SOURCES[1].site!, title: J3_WEB_SOURCES[1].title }],
        note: "Two downgrades this week, both citing wildfire liability.",
      },
      {
        title: "Check the trade association",
        queries: ["Western Utilities Council federal wildfire liability fund position"],
        pages: [{ site: J3_WEB_SOURCES[2].site!, title: J3_WEB_SOURCES[2].title }],
        note: "Updated its position on the federal wildfire liability fund.",
      },
    ],
  },
};

// Keyed by index into WS_DEMO_STEPS (0 = J3, 1 = J2). J1 (index 2) has no
// entry — it never shows the web-search offer.
export const WS_WEB_OFFERS: Partial<Record<number, WsWebOfferConfig>> = {
  0: J3_WEB_OFFER,
  1: J2_WEB_OFFER,
};

// Ordered as he'd actually hit them while prepping: he opens the assistant to
// check what's changed (J3), that leads into the deeper disclosure-drift
// comparison (J2), and the quick term lookup (J1) comes up as an aside along
// the way — not as the cold open (Fru, 2026-11-18: the original J1-first
// order made a trivial lookup the very first thing he'd ever ask).
export const WS_DEMO_STEPS: DemoStep[] = [STEP_3, STEP_2, STEP_1];

function normalise(text: string): string {
  return text.trim().toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, " ").replace(/[?.]+$/, "");
}

const WS_STEP_BY_PROMPT = new Map(WS_DEMO_STEPS.map((s, i) => [normalise(s.prompt), i]));

/** Index of the scripted web-search step whose prompt matches `text` exactly, or -1. */
export function matchWsDemoStep(text: string): number {
  return WS_STEP_BY_PROMPT.get(normalise(text)) ?? -1;
}

// ─── Intro and summary copy ─────────────────────────────────────────────────

export const WS_DEMO_INTRO_1 = {
  name: WS_DEMO_DIRECTOR.name,
  role: "Independent director",
  bullets: [
    `Independent director at ${COMPANY}, a regulated utility. Lawyer by training, "an extensive user of agentic AI" outside board work.`,
    "Today, none of his boards has web search turned on inside Diligent — he keeps public-information research entirely outside the product.",
    "Three jobs, scoped in the AI UX journal's phase 2: staying current between meetings (J3, Inform), comparing outside developments against his own board materials (J2, Augment), and quick term lookups (J1, Automate).",
    "This flow shows all three, back to back, as he'd actually hit them while preparing — starting with what's changed, not with a trivial lookup.",
  ],
};

export const WS_DEMO_INTRO_2 = {
  headline: "Three different jobs, three different AI roles — not one on/off switch.",
  steps: [
    "Staying on top of a slow-moving regulatory story between meetings — AI surfaces what changed, he decides what to open.",
    "A legally sensitive comparison against his own board materials — AI drafts it, he reviews before relying on it.",
    "A quick, slightly embarrassing shorthand question, along the way — answered directly, no review step.",
  ],
  footer: "Same feature, same web search toggle — three different levels of AI involvement, chosen in phase 2 of the AI UX journal, not by guesswork.",
};

export const WS_DEMO_SUMMARY_PATH = "/demo/web-search/summary";

export const WS_DEMO_SUMMARY = {
  rows: [
    { step: 1, question: "What's new since I last checked?", source: "Web" },
    { step: 2, question: "Wildfire disclosure drift vs. last year", source: "Books + Web" },
    { step: 3, question: "What's \"rate base\" mean?", source: "Model's own knowledge" },
  ].map((r, i) => ({ ...r, possibleToday: WS_DEMO_STEPS[i].rail.possibleToday })),
  lines: [
    "One feature, three jobs, three AI roles — Automate, Augment, Inform — each one chosen against evidence, not applied uniformly.",
    "Every web citation is visible and clickable; the director verifies before relying on anything legally sensitive.",
  ],
  ask: "Next: test this with real board material and a real director, then come back to close the loop in phase 6.",
};
