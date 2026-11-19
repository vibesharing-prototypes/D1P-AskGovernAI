// Scripted scenario for the "Try it" summary demo.
// Everything here is mock data for Meridian Capital Group — no backend.

export type LayerId = "map" | "notes" | "synthesis" | "index";

export interface BookDoc {
  id: string;
  title: string;
  pages: number;
  /** Greg can't open this document. */
  restricted?: boolean;
}

export const BOOK = {
  title: "Board meeting Q1 2027",
  meetingDate: "12 Feb 2027",
  publishedAt: "2 Feb 2027, 09:14",
  previousBook: "Board meeting Q4 2026",
};

export const DOCS: BookDoc[] = [
  { id: "agenda", title: "Agenda", pages: 2 },
  { id: "minutes", title: "Minutes Q4 2026", pages: 8 },
  { id: "ceo", title: "CEO report", pages: 14 },
  { id: "results", title: "Q4 2026 financial results", pages: 18 },
  { id: "budget", title: "FY2027 budget & capex plan", pages: 22 },
  { id: "risk", title: "Risk appetite statement update", pages: 9 },
  { id: "comp", title: "Compensation committee: CEO incentive plan 2027", pages: 11 },
  { id: "cyber", title: "Cyber incident summary", pages: 6, restricted: true },
  { id: "legal", title: "Legal update: litigation reserve", pages: 5, restricted: true },
];

export const RESTRICTED_COUNT = DOCS.filter((d) => d.restricted).length;

// ─── Sources and citations ───────────────────────────────────────────────────

export interface Source {
  /** Number shown on the citation chip. */
  n: number;
  doc: string;
  book: string;
  page: number;
  /** The passage the claim is grounded in, shown in the citation preview. */
  excerpt: string;
}

export type Span = string | { cite: number } | { b: string };
export type Block =
  | { type: "p"; spans: Span[] }
  | { type: "h"; text: string }
  | { type: "list"; ordered?: boolean; items: Span[][] }
  | { type: "table"; columns: string[]; rows: Span[][][] };

export interface ToolStep {
  label: string;
  detail: string;
  layer?: LayerId;
}

export interface Scenario {
  id: string;
  /** Text shown as the user's message. */
  prompt: string;
  /** Short label for the welcome chips. */
  chip: string;
  /** Summary shape this demonstrates. */
  shape: string;
  thinkingLabel: string;
  toolGroupLabel: string;
  steps: ToolStep[];
  /** Context-layer parts read for this answer (highlighted in "How it works"). */
  layers: LayerId[];
  blocks: Block[];
  sources: Source[];
  /** Provenance + freshness line under the answer. */
  provenance: string;
  pattern: { title: string; text: string };
  followUps: string[];
  /** Optional extra rendered after the answer (share confirmation). */
  shareConfirm?: boolean;
}

const B = BOOK.title;

export const LAYERS: Record<LayerId, { title: string; when: string; what: string }> = {
  map: {
    title: "Book map",
    when: "Built first, at publish",
    what: "Agenda, tabs, document types, entities and periods, and how documents relate. Injected into every later prompt.",
  },
  notes: {
    title: "Book-aware document notes",
    when: "Built at publish, with the book map in the prompt",
    what: "Detailed, LLM-facing notes per document. Each note knows its role in the book and keeps footnote-level facts.",
  },
  synthesis: {
    title: "Whole-book synthesis",
    when: "Built at publish, from the map and the notes",
    what: "One ranked, fact-preserving synthesis per access level. Answers orientation and challenge questions instantly.",
  },
  index: {
    title: "Contextualised search index",
    when: "Built at publish, chunk by chunk",
    what: "Each chunk carries a context line from the book map, so exact lookups land on the right page.",
  },
};

const provenanceSynthesis = `From the book summary · generated at publish, ${BOOK.publishedAt} · ${RESTRICTED_COUNT} documents you can't access aren't included`;

export const SCENARIOS: Scenario[] = [
  // ── 1. Orient ────────────────────────────────────────────────────────────
  {
    id: "orient",
    prompt: "What's in this book and what needs a decision?",
    chip: "What's in this book?",
    shape: "Orient",
    thinkingLabel: "Reading the book summary",
    toolGroupLabel: "Read the book summary",
    steps: [
      { label: "Checked your access", detail: `${DOCS.length - RESTRICTED_COUNT} of ${DOCS.length} documents are available to you.` },
      { label: "Read the whole-book synthesis", detail: `Generated when the book was published, ${BOOK.publishedAt}. Ranked by what the meeting has to decide.`, layer: "synthesis" },
      { label: "Checked the book map for decisions", detail: "3 agenda items are marked “for approval”.", layer: "map" },
    ],
    layers: ["synthesis", "map"],
    blocks: [
      { type: "p", spans: [`${B} covers 7 documents you can access. The meeting on ${BOOK.meetingDate} has three decisions to make, and most of the book supports the budget.`] },
      { type: "h", text: "Decisions needed" },
      {
        type: "list",
        ordered: true,
        items: [
          [{ b: "Approve the FY2027 budget and capex plan." }, " Capex rises 23% to $148.0M, mainly for a new Ohio distribution centre ($38M). ", { cite: 1 }, " ", { cite: 2 }],
          [{ b: "Approve the updated risk appetite statement." }, " Tolerance for single-supplier concentration drops from 25% to 15% of spend. ", { cite: 3 }],
          [{ b: "Approve the CEO incentive plan 2027." }, " Weighting moves to 50% financial and 50% strategic, with a 10% ESG metric. ", { cite: 4 }],
        ],
      },
      { type: "h", text: "New since the last meeting" },
      {
        type: "list",
        items: [
          ["Q4 revenue was $412M, up 6% year on year but 3% below plan. ", { cite: 5 }],
          ["A disruption at the largest supplier is driving the tighter risk appetite. ", { cite: 6 }],
        ],
      },
      { type: "h", text: "Worth a closer look" },
      {
        type: "p",
        spans: ["The CEO report puts capex at “about $140M”, but the budget says $148.0M. ", { cite: 7 }, " ", { cite: 2 }, " I found this by comparing documents across the book."],
      },
    ],
    sources: [
      { n: 1, doc: "FY2027 budget & capex plan", book: B, page: 2, excerpt: "The Board is asked to approve the FY2027 operating budget and the capital expenditure plan set out in sections 3 and 4." },
      { n: 2, doc: "FY2027 budget & capex plan", book: B, page: 7, excerpt: "Total FY2027 capital expenditure: $148.0M (FY2026: $120.4M), including $38.0M for the Ohio distribution centre." },
      { n: 3, doc: "Risk appetite statement update", book: B, page: 1, excerpt: "Proposed: reduce the maximum single-supplier concentration from 25% to 15% of total direct spend by Q4 2027." },
      { n: 4, doc: "Compensation committee: CEO incentive plan 2027", book: B, page: 3, excerpt: "Weighting: 50% financial, 50% strategic (FY2026: 60/40). Strategic measures include a 10% ESG component." },
      { n: 5, doc: "Q4 2026 financial results", book: B, page: 3, excerpt: "Q4 revenue $412M (+6% YoY), 3% below the plan approved in December 2025." },
      { n: 6, doc: "CEO report", book: B, page: 5, excerpt: "Our largest component supplier halted two lines in November; it currently represents 22% of direct spend." },
      { n: 7, doc: "CEO report", book: B, page: 6, excerpt: "We plan to invest about $140M in FY2027, led by the new Ohio facility." },
    ],
    provenance: provenanceSynthesis,
    pattern: {
      title: "Whole-book synthesis, read at publish time",
      text: "The answer is instant because the synthesis already exists. It's ranked against the whole book, so decisions come first and the capex mismatch between two documents shows up.",
    },
    followUps: ["What changed since the last book, and what should I ask?", "What's the FY2027 capex figure?", "Summarise the CEO report"],
  },

  // ── 2. Challenge ─────────────────────────────────────────────────────────
  {
    id: "challenge",
    prompt: "What changed since the last book, and what should I ask?",
    chip: "What changed, and what should I ask?",
    shape: "Challenge",
    thinkingLabel: "Comparing with the last book",
    toolGroupLabel: "Compared two book summaries",
    steps: [
      { label: "Read this book's synthesis", detail: `${B}, generated ${BOOK.publishedAt}.`, layer: "synthesis" },
      { label: "Read the previous book's synthesis", detail: `${BOOK.previousBook}, generated 28 Oct 2026.`, layer: "synthesis" },
      { label: "Matched topics with the book map", detail: "Linked the same topics across both books: revenue, capex, supplier risk and incentives.", layer: "map" },
    ],
    layers: ["synthesis", "map"],
    blocks: [
      { type: "p", spans: [`Compared with ${BOOK.previousBook}, four things moved:`] },
      {
        type: "table",
        columns: ["Topic", "Q4 2026 book", "This book"],
        rows: [
          [["Revenue outlook"], ["+8% growth planned ", { cite: 1 }], ["+6% actual, 3% below plan ", { cite: 2 }]],
          [["Capex"], ["$120.4M (FY2026) ", { cite: 1 }], ["$148.0M, +23% ", { cite: 3 }]],
          [["Supplier concentration risk"], ["Rated medium ", { cite: 1 }], ["Rated high, tolerance cut to 15% ", { cite: 4 }]],
          [["CEO incentive weighting"], ["60/40 financial/strategic"], ["50/50, with a 10% ESG metric ", { cite: 5 }]],
        ],
      },
      { type: "h", text: "Three questions to ask" },
      {
        type: "list",
        ordered: true,
        items: [
          ["What explains the $8M gap between the capex in the CEO report and the budget? ", { cite: 6 }, " ", { cite: 3 }],
          ["The top supplier is at 22% of spend today. What's the plan and timeline to reach the new 15% limit? ", { cite: 7 }, " ", { cite: 4 }],
          ["Revenue missed plan by 3%. Why does the incentive plan reduce the weight of financial measures this year? ", { cite: 2 }, " ", { cite: 5 }],
        ],
      },
    ],
    sources: [
      { n: 1, doc: "Board summary (synthesis)", book: BOOK.previousBook, page: 1, excerpt: "FY2026 plan: revenue growth +8%; capex $120.4M; supplier concentration rated medium." },
      { n: 2, doc: "Q4 2026 financial results", book: B, page: 3, excerpt: "Q4 revenue $412M (+6% YoY), 3% below the plan approved in December 2025." },
      { n: 3, doc: "FY2027 budget & capex plan", book: B, page: 7, excerpt: "Total FY2027 capital expenditure: $148.0M (FY2026: $120.4M)." },
      { n: 4, doc: "Risk appetite statement update", book: B, page: 1, excerpt: "Supplier concentration re-rated from medium to high. Proposed limit 15% of direct spend." },
      { n: 5, doc: "Compensation committee: CEO incentive plan 2027", book: B, page: 3, excerpt: "Weighting: 50% financial, 50% strategic (FY2026: 60/40)." },
      { n: 6, doc: "CEO report", book: B, page: 6, excerpt: "We plan to invest about $140M in FY2027." },
      { n: 7, doc: "CEO report", book: B, page: 5, excerpt: "It currently represents 22% of direct spend." },
    ],
    provenance: `From two book summaries · ${B} (${BOOK.publishedAt}) and ${BOOK.previousBook} (28 Oct 2026) · ${RESTRICTED_COUNT} documents you can't access aren't included`,
    pattern: {
      title: "Synthesis compared across books",
      text: "Two pre-generated syntheses are compared, so the answer doesn't re-read 200 pages. The questions come from contradictions between documents, which only whole-book context can see.",
    },
    followUps: ["How has the CEO incentive plan changed over 3 years?", "Draft a one-page brief for the new audit committee chair"],
  },

  // ── 3. Pinpoint fact ─────────────────────────────────────────────────────
  {
    id: "fact",
    prompt: "What's the FY2027 capex figure?",
    chip: "What's the FY2027 capex figure?",
    shape: "Find a fact",
    thinkingLabel: "Searching the book",
    toolGroupLabel: "Searched the book",
    steps: [
      { label: "Searched the contextualised index", detail: "Query: “FY2027 capital expenditure total”. Top match: budget, page 7 (context: “Section 4, capex plan for approval”).", layer: "index" },
    ],
    layers: ["index"],
    blocks: [
      { type: "p", spans: [{ b: "$148.0M" }, " for FY2027, up from $120.4M in FY2026 (+23%). ", { cite: 1 }] },
      { type: "p", spans: ["The CEO report rounds this to “about $140M”. ", { cite: 2 }] },
    ],
    sources: [
      { n: 1, doc: "FY2027 budget & capex plan", book: B, page: 7, excerpt: "Total FY2027 capital expenditure: $148.0M (FY2026: $120.4M), including $38.0M for the Ohio distribution centre." },
      { n: 2, doc: "CEO report", book: B, page: 6, excerpt: "We plan to invest about $140M in FY2027, led by the new Ohio facility." },
    ],
    provenance: "From the exact passage · search, not the summary · the source page is the record",
    pattern: {
      title: "Contextualised search, not the summary",
      text: "Exact figures come from the passage itself, cited to the page. Each indexed chunk carries a context line from the book map, so the right “total” is found, not a sub-total.",
    },
    followUps: ["What's in this book and what needs a decision?", "What changed since the last book, and what should I ask?"],
  },

  // ── 4. Trace ─────────────────────────────────────────────────────────────
  {
    id: "trace",
    prompt: "How has the CEO incentive plan changed over 3 years?",
    chip: "How has the CEO incentive plan changed?",
    shape: "Trace",
    thinkingLabel: "Tracing across 3 books",
    toolGroupLabel: "Read document notes from 3 books",
    steps: [
      { label: "Found the topic in 3 book maps", detail: "Board meeting Q1 2025, Q1 2026 and Q1 2027 each have a compensation committee paper on the CEO plan.", layer: "map" },
      { label: "Read the book-aware document notes", detail: "3 notes, one per book. Each note records weighting, targets, ESG and clawback terms.", layer: "notes" },
      { label: "Checked figures against the source pages", detail: "Confirmed each number in the search index before answering.", layer: "index" },
    ],
    layers: ["map", "notes", "index"],
    blocks: [
      { type: "p", spans: ["The plan has shifted towards strategic and ESG measures each year, while the target bonus stayed flat after 2026."] },
      {
        type: "table",
        columns: ["Term", "2025", "2026", "2027 (proposed)"],
        rows: [
          [["Financial / strategic weighting"], ["70 / 30 ", { cite: 1 }], ["60 / 40 ", { cite: 2 }], ["50 / 50 ", { cite: 3 }]],
          [["Target bonus (% of salary)"], ["120% ", { cite: 1 }], ["125% ", { cite: 2 }], ["125% ", { cite: 3 }]],
          [["ESG metric"], ["None"], ["5% ", { cite: 2 }], ["10% ", { cite: 3 }]],
          [["Clawback"], ["Misconduct only"], ["Extended to 3 years ", { cite: 2 }], ["Unchanged"]],
        ],
      },
      { type: "p", spans: ["The 2027 paper links the ESG metric to the supplier-diversification target in the risk appetite update. ", { cite: 4 }] },
    ],
    sources: [
      { n: 1, doc: "Compensation committee: CEO incentive plan 2025", book: "Board meeting Q1 2025", page: 4, excerpt: "Weighting 70% financial, 30% strategic. Target bonus 120% of base salary." },
      { n: 2, doc: "Compensation committee: CEO incentive plan 2026", book: "Board meeting Q1 2026", page: 3, excerpt: "Weighting 60/40. Target 125%. New: ESG metric (5%). Clawback period extended to 3 years." },
      { n: 3, doc: "Compensation committee: CEO incentive plan 2027", book: B, page: 3, excerpt: "Weighting: 50% financial, 50% strategic. Target unchanged at 125%. ESG component 10%." },
      { n: 4, doc: "Compensation committee: CEO incentive plan 2027", book: B, page: 5, excerpt: "The ESG measure is aligned to the supplier concentration limit in the updated risk appetite statement." },
    ],
    provenance: "From document notes in 3 books · each generated when its book was published · figures checked against source pages",
    pattern: {
      title: "Book-aware document notes, across books",
      text: "Notes keep the detail a book synthesis drops, and they know which book and topic they belong to. That makes multi-year tracing fast and precise.",
    },
    followUps: ["What changed since the last book, and what should I ask?", "What's in this book and what needs a decision?"],
  },

  // ── 5. Share ─────────────────────────────────────────────────────────────
  {
    id: "share",
    prompt: "Draft a one-page brief for the new audit committee chair",
    chip: "Draft a brief for the audit committee chair",
    shape: "Share",
    thinkingLabel: "Drafting from the book summary",
    toolGroupLabel: "Drafted a brief",
    steps: [
      { label: "Read the whole-book synthesis", detail: `${B}, generated ${BOOK.publishedAt}.`, layer: "synthesis" },
      { label: "Checked Dana Liu's access", detail: "Dana can open 6 of the 7 documents you can see. She can't open the compensation committee paper." },
      { label: "Left out what Dana can't see", detail: "The brief doesn't mention the CEO incentive plan.", layer: "synthesis" },
    ],
    layers: ["synthesis"],
    blocks: [
      { type: "p", spans: [{ b: "Brief for Dana Liu, audit committee chair" }, ` · ${B}, ${BOOK.meetingDate}`] },
      { type: "h", text: "What the board will decide" },
      {
        type: "list",
        items: [
          ["FY2027 budget and capex plan: capex $148.0M, up 23%. ", { cite: 1 }],
          ["Updated risk appetite: single-supplier limit cut to 15% of spend. ", { cite: 2 }],
        ],
      },
      { type: "h", text: "Audit points to watch" },
      {
        type: "list",
        items: [
          ["Capex is stated as “about $140M” in the CEO report and $148.0M in the budget. ", { cite: 3 }, " ", { cite: 1 }],
          ["Q4 revenue was 3% below plan. ", { cite: 4 }],
        ],
      },
      { type: "h", text: "Read first" },
      { type: "list", items: [["FY2027 budget & capex plan, pages 2–9"], ["Q4 2026 financial results, pages 3–6"]] },
    ],
    sources: [
      { n: 1, doc: "FY2027 budget & capex plan", book: B, page: 7, excerpt: "Total FY2027 capital expenditure: $148.0M (FY2026: $120.4M)." },
      { n: 2, doc: "Risk appetite statement update", book: B, page: 1, excerpt: "Proposed: reduce the maximum single-supplier concentration from 25% to 15%." },
      { n: 3, doc: "CEO report", book: B, page: 6, excerpt: "We plan to invest about $140M in FY2027." },
      { n: 4, doc: "Q4 2026 financial results", book: B, page: 3, excerpt: "Q4 revenue $412M (+6% YoY), 3% below plan." },
    ],
    provenance: `From the book summary · generated at publish, ${BOOK.publishedAt} · checked against Dana's access, 1 document left out`,
    pattern: {
      title: "Synthesis reshaped for another reader, with a permission check",
      text: "The brief reuses the synthesis, then checks the recipient's access before anything is shared. Sharing waits for your confirmation.",
    },
    followUps: ["What's in this book and what needs a decision?"],
    shareConfirm: true,
  },

  // ── 6. One document, in book context ─────────────────────────────────────
  {
    id: "doc",
    prompt: "Summarise the CEO report",
    chip: "Summarise the CEO report",
    shape: "Orient (one document)",
    thinkingLabel: "Reading the document note",
    toolGroupLabel: "Read the document note",
    steps: [
      { label: "Read the book-aware note for the CEO report", detail: "Written at publish with the book map in the prompt, so it knows how the report relates to the other papers.", layer: "notes" },
      { label: "Looked up related documents in the book map", detail: "Budget, risk appetite update and Q4 results.", layer: "map" },
    ],
    layers: ["notes", "map"],
    blocks: [
      { type: "p", spans: ["The CEO report (14 pages) argues for investing through a softer year."] },
      {
        type: "list",
        items: [
          ["Q4 was solid but below plan, mainly due to the supplier disruption. ", { cite: 1 }],
          ["The Ohio distribution centre is the main investment, to reduce dependence on one supplier. ", { cite: 2 }],
          ["Hiring is paused outside operations until Q3. ", { cite: 3 }],
        ],
      },
      { type: "h", text: "How it connects to the rest of the book" },
      {
        type: "list",
        items: [
          ["Its capex figure (about $140M) doesn't match the budget ($148.0M). ", { cite: 2 }, " ", { cite: 4 }],
          ["The supplier disruption is the reason for the risk appetite update. ", { cite: 5 }],
        ],
      },
    ],
    sources: [
      { n: 1, doc: "CEO report", book: B, page: 3, excerpt: "Revenue grew 6%, short of our plan, largely because of the November supplier stoppage." },
      { n: 2, doc: "CEO report", book: B, page: 6, excerpt: "We plan to invest about $140M in FY2027, led by the new Ohio facility." },
      { n: 3, doc: "CEO report", book: B, page: 9, excerpt: "Non-operations hiring is paused until Q3 2027." },
      { n: 4, doc: "FY2027 budget & capex plan", book: B, page: 7, excerpt: "Total FY2027 capital expenditure: $148.0M." },
      { n: 5, doc: "Risk appetite statement update", book: B, page: 2, excerpt: "Rationale: the November 2026 supplier disruption exposed concentration risk." },
    ],
    provenance: `From the document note · written at publish, ${BOOK.publishedAt}, with the whole book as context`,
    pattern: {
      title: "Document note that knows the book",
      text: "Unlike today's per-document summary, this note was written with the book map in view. It says how the report relates to other papers, not just what it says.",
    },
    followUps: ["What's in this book and what needs a decision?", "What's the FY2027 capex figure?"],
  },
];

// ─── Staleness variant (book changed after publish) ──────────────────────────

export const STALE_NOTICE = {
  title: "This book changed after the summary was generated",
  text: "“Risk appetite statement update” was replaced on 4 Feb 2027, after the summary was generated on 2 Feb. Parts of this answer may be out of date.",
};

export const FALLBACK_BLOCKS: Block[] = [
  { type: "p", spans: ["This is a demo, so I can only answer a few questions about ", { b: B }, ". Try one of these:"] },
];

// ─── Matching ────────────────────────────────────────────────────────────────

const norm = (s: string) => s.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]/g, " ").replace(/\s+/g, " ").trim();

export function matchScenario(text: string): Scenario | null {
  const t = norm(text);
  const exact = SCENARIOS.find((s) => norm(s.prompt) === t || norm(s.chip) === t);
  if (exact) return exact;
  const has = (...words: string[]) => words.some((w) => t.includes(w));
  if (has("capex", "capital expenditure")) return byId("fact");
  if (has("incentive", "bonus", "3 years", "three years")) return byId("trace");
  if (has("brief", "audit committee chair", "dana")) return byId("share");
  if (has("ceo report")) return byId("doc");
  if (has("changed", "what should i ask", "questions", "since the last")) return byId("challenge");
  if (has("in this book", "decision", "summar", "overview", "what s in", "whats in")) return byId("orient");
  return null;
}

export function byId(id: string): Scenario {
  const s = SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown scenario ${id}`);
  return s;
}

export const WELCOME_CHIP_IDS = ["orient", "challenge", "fact", "trace", "share"];
