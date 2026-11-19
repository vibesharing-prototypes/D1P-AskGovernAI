// ─── AGAI web search: admin chat scenario ──────────────────────────────────────
// The first question of every new admin chat (outside the director demo) plays
// this scripted web search flow:
//   1. AGAI searches board materials, finds only part of the answer and offers
//      to search the web.
//   2. The user accepts. First time only: the web search disclosure dialog.
//   3. Web search turns on (composer chip) and AGAI runs a detailed, visible
//      web search, then answers with web and board-material citations.
// If web search is already on when the question is sent, step 1 is skipped.
//
// Web facts and URLs were checked against sec.gov on October 30, 2026.
// Board facts match the Incident Response Framework resolution (ir-resolution).

import type { Source } from "./mockData.js";
import type { RichBlock } from "./hybrid-search.constants.js";

/** One reasoning step. Web steps carry the exact search terms and pages read. */
export interface ReasoningStepData {
  /** Short, sentence-case name of what the AI did. */
  title: string;
  /** What it looked at and what it found. */
  text?: string;
  /** Exact search terms sent to the web, verbatim. */
  queries?: string[];
  /** Web pages read for the answer. */
  pages?: { site: string; title: string }[];
  /** Short note shown after the details (skipped pages, limits). */
  note?: string;
}

export interface ReasoningData {
  intro?: string;
  steps: ReasoningStepData[];
}

/** Time each reasoning step stays active before the next one (or the answer). */
export const WEB_REASONING_STEP_MS = 1300;

export const WEB_SCENARIO_QUESTION =
  "Does our Incident Response Framework meet the SEC's cybersecurity incident disclosure rules?";
export const WEB_SCENARIO_THREAD_TITLE = "SEC cyber disclosure check";

// ─── Board-material sources ───────────────────────────────────────────────────

const IR_SOURCE = (index: number, page: 3 | 4): Source => ({
  index,
  title: "Resolution – Approval of Incident Response Framework",
  book: "Board Book Q4 2025",
  page: String(page),
  documentId: "ir-resolution",
  targetPage: page,
  module: "Books",
  chipData: "Incident Response Framework",
});

// ─── Web sources (sec.gov) ────────────────────────────────────────────────────

const SEC_FACT_SHEET: Source = {
  index: 3,
  title: "Fact sheet: Public company cybersecurity disclosures; final rules",
  module: "Web",
  site: "sec.gov",
  chipData: "Fact sheet: cybersecurity disclosure rules",
  url: "https://www.sec.gov/files/33-11216-fact-sheet.pdf",
  published: "July 26, 2023",
  snippet:
    "Registrants must determine the materiality of an incident without unreasonable delay following discovery and, if the incident is determined material, file an Item 1.05 Form 8-K generally within four business days.",
};

const SEC_PRESS_RELEASE: Source = {
  index: 4,
  title: "SEC adopts rules on cybersecurity risk management, strategy, governance, and incident disclosure",
  module: "Web",
  site: "sec.gov",
  chipData: "Press release 2023-139",
  url: "https://www.sec.gov/newsroom/press-releases/2023-139",
  published: "July 26, 2023",
  snippet:
    "An Item 1.05 Form 8-K will generally be due four business days after a registrant determines that a cybersecurity incident is material.",
};

const SEC_STAFF_STATEMENT: Source = {
  index: 5,
  title: "Disclosure of cybersecurity incidents determined to be material and other cybersecurity incidents",
  module: "Web",
  site: "sec.gov",
  chipData: "Staff statement, May 2024",
  url: "https://www.sec.gov/newsroom/speeches-statements/gerding-cybersecurity-incidents-05212024",
  published: "May 21, 2024",
  snippet:
    "The Division of Corporation Finance encourages the company to disclose that cybersecurity incident under a different item of Form 8-K (for example, Item 8.01).",
};

// ─── Step 1: board materials only, then the offer ─────────────────────────────

const BOARD_STEPS: ReasoningStepData[] = [
  {
    title: "Search board books",
    text: "Looked in current and archived books for incident response and SEC disclosure. Found the Incident Response Framework the board approved on December 10, 2025.",
  },
  {
    title: "Check for the SEC requirements",
    text: "The framework refers to the SEC cybersecurity rules but doesn't say what they require. No other board materials describe them.",
  },
];

export const WEB_OFFER_REASONING: ReasoningData = {
  intro: "I'll check your board materials for your incident response rules, then look for the SEC requirements to compare them with.",
  steps: BOARD_STEPS,
};

export const WEB_OFFER_SOURCES: Source[] = [IR_SOURCE(1, 3), IR_SOURCE(2, 4)];

export const WEB_OFFER_CONTENT: RichBlock[] = [
  {
    type: "p",
    spans: [
      "Your Incident Response Framework covers part of this. For incidents likely to need disclosure under the SEC cybersecurity rules, the General Counsel must convene a materiality-determination call within 24 hours of confirmation. ",
      { cite: 1 },
    ],
  },
  {
    type: "p",
    spans: ["The General Counsel is also accountable for external disclosure. ", { cite: 2 }],
  },
  {
    type: "p",
    spans: [
      "Your board materials don't include what the SEC rules require, such as filing deadlines, so I can't confirm whether the framework meets them. I can search the web for the SEC rules and compare them with your framework.",
    ],
  },
];

// ─── Step 2: web search and the combined answer ───────────────────────────────

const WEB_STEPS: ReasoningStepData[] = [
  {
    title: "Prepare search terms",
    text: "Kept your organization's name and details from your board materials out of the search terms.",
  },
  {
    title: "Search the web",
    queries: [
      "SEC cybersecurity incident disclosure rule Form 8-K Item 1.05",
      "SEC Regulation S-K Item 106 board oversight cybersecurity",
      "SEC staff statement material cybersecurity incident disclosure",
    ],
    note: "Found 9 results.",
  },
  {
    title: "Read pages",
    pages: [
      { site: "sec.gov", title: SEC_FACT_SHEET.title },
      { site: "sec.gov", title: SEC_PRESS_RELEASE.title },
      { site: "sec.gov", title: SEC_STAFF_STATEMENT.title },
    ],
    note: "Skipped 1 page on law360.com that needs a subscription.",
  },
  {
    title: "Compare with your board materials",
    text: "Compared the SEC requirements with the escalation, notification and disclosure sections of your Incident Response Framework.",
  },
];

export const WEB_ANSWER_REASONING: ReasoningData = {
  intro: "I'll search public websites for the SEC's cybersecurity disclosure rules, then compare them with your Incident Response Framework.",
  steps: WEB_STEPS,
};

/** Used when web search was already on before the question was sent. */
export const WEB_DIRECT_REASONING: ReasoningData = {
  intro: "I'll check your board materials, search public websites for the SEC's cybersecurity disclosure rules, and compare the two.",
  steps: [BOARD_STEPS[0], ...WEB_STEPS],
};

export const WEB_ANSWER_SOURCES: Source[] = [
  IR_SOURCE(1, 3),
  IR_SOURCE(2, 4),
  SEC_FACT_SHEET,
  SEC_PRESS_RELEASE,
  SEC_STAFF_STATEMENT,
];

export const WEB_ANSWER_CONTENT: RichBlock[] = [
  {
    type: "p",
    spans: [
      "I compared the SEC's cybersecurity disclosure rules with your Incident Response Framework. The framework covers the materiality decision, but it doesn't set the filing deadline.",
    ],
  },
  { type: "h", text: "What the SEC requires" },
  {
    type: "list",
    items: [
      ["Companies must decide whether an incident is material without unreasonable delay after discovering it. ", { cite: 3 }],
      ["If the incident is material, an Item 1.05 Form 8-K is generally due within four business days of that decision. ", { cite: 4 }],
      ["Disclosure can be delayed only if the US Attorney General decides that it poses a substantial risk to national security or public safety. ", { cite: 4 }],
      ["The annual report must describe how the board oversees cybersecurity risk and management's role in managing it. ", { cite: 3 }],
      ["SEC staff encourage companies to report incidents that aren't yet determined to be material under Item 8.01, not Item 1.05. ", { cite: 5 }],
    ],
  },
  { type: "h", text: "How your framework compares" },
  {
    type: "table",
    columns: ["SEC requirement", "Your framework", "Status"],
    defaultTextColor: true,
    rows: [
      [
        ["Decide materiality without unreasonable delay"],
        ["The General Counsel convenes a materiality-determination call within 24 hours of confirmation. ", { cite: 1 }],
        ["Covered"],
      ],
      [
        ["File Form 8-K within four business days"],
        ["The General Counsel is accountable for external disclosure, but no filing deadline is set. ", { cite: 2 }],
        ["Missing"],
      ],
      [
        ["Describe board oversight in the annual report"],
        ["S1 and S2 incidents reach the board the same day, and every board pack includes an incident summary. ", { cite: 1 }],
        ["Likely covered"],
      ],
    ],
  },
  {
    type: "p",
    spans: [
      "The Risk & Technology Committee's annual review of the framework is scheduled for November 2026. That review is a good point to add the four-business-day filing step. ",
      { cite: 2 },
    ],
  },
  {
    type: "p",
    spans: ["The SEC sources are from 2023 and 2024. Check with your General Counsel for any later changes."],
  },
  { type: "p", spans: ["AI-generated content may have inaccuracies."] },
];

/** Shown on other admin answers while web search is on but wasn't needed. */
export const WEB_NOT_USED_REASONING: ReasoningData = {
  steps: [
    {
      title: "Answered from your board materials",
      text: "Web search is on, but your board materials answered this, so the web wasn't searched.",
    },
  ],
};
