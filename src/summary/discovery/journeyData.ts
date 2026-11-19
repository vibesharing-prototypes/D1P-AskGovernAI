// Journey map data for the "Summary in AGAI" discovery page.
// Source: LLM-facing-summary-use-cases-and-practices.md (use case IDs D1, A1, G2…).
// Scope: the regular book summary used in the AGAI chat. Prep, Audit and Risk
// Scanner touchpoints are kept on the map as "other GovernAI feature" so the
// boundary is visible, but they are not counted as summary touchpoints.

export type TouchKind = "summary" | "search" | "none" | "otherFeature";

export type PhaseId = "plan" | "build" | "publish" | "prepare" | "meet" | "follow";
export type PersonaId = "director" | "admin" | "gc" | "cfo" | "ceo";

export type SummaryShape = "Orient" | "Changes" | "Trace" | "Share" | "Recap";

export interface Activity {
  id: string;
  /** Short label shown in the map. */
  title: string;
  kind: TouchKind;
  /** Use case reference from the use cases doc, e.g. "D1". */
  useCase?: string;
  /** When in the workflow this happens. */
  moment: string;
  /** What the user is trying to get. */
  want: string;
  /** Example prompt in AGAI (summary touchpoints and search). */
  prompt?: string;
  /** Where the user invokes AGAI. */
  entry?: string;
  /** What whole-book context adds that a per-document summary can't. */
  contextAdds?: string;
  shape?: SummaryShape;
  /** D = Diligent evidence, H = hypothesis to validate. */
  evidence: "D" | "H";
  evidenceNote: string;
  /** Why it's not a summary touchpoint (search, activity data, other feature). */
  note?: string;
}

export interface Phase {
  id: PhaseId;
  name: string;
  timing: string;
  description: string;
  /** Marks the phase where the book context layer is generated. */
  isGenerationPoint?: boolean;
}

export interface Persona {
  id: PersonaId;
  name: string;
  role: string;
  evidenceStrength: "Strong" | "Medium" | "Thin";
}

export const PHASES: Phase[] = [
  {
    id: "plan",
    name: "Plan the meeting",
    timing: "6–8 weeks before",
    description: "The agenda is agreed with the chair, CEO and CFO, and papers are commissioned from authors.",
  },
  {
    id: "build",
    name: "Build the pack",
    timing: "2–6 weeks before",
    description: "Authors write their papers and the admin assembles the board book, often with late changes.",
  },
  {
    id: "publish",
    name: "Publish",
    timing: "1–2 weeks before",
    description:
      "The book goes live to directors. This is when the book context layer is generated in the background, so the summary is ready before anyone asks.",
    isGenerationPoint: true,
  },
  {
    id: "prepare",
    name: "Read and prepare",
    timing: "Days before",
    description: "Directors read and annotate the pack. Executives and counsel get ready for questions.",
  },
  {
    id: "meet",
    name: "In the meeting",
    timing: "Meeting day",
    description: "Discussion and decisions. Speed matters: users need a page or a fact in seconds, not a summary.",
  },
  {
    id: "follow",
    name: "Follow up",
    timing: "After and between meetings",
    description: "Minutes, actions, onboarding new members and looking back across books.",
  },
];

export const PERSONAS: Persona[] = [
  { id: "director", name: "Director", role: "Reads the pack, challenges management, decides", evidenceStrength: "Strong" },
  { id: "admin", name: "Board admin", role: "Corporate secretary who builds and publishes the book", evidenceStrength: "Strong" },
  { id: "gc", name: "General counsel", role: "Legal oversight. Often also the corporate secretary", evidenceStrength: "Thin" },
  { id: "cfo", name: "CFO", role: "Authors finance papers, presents results", evidenceStrength: "Thin" },
  { id: "ceo", name: "CEO", role: "Sets the agenda with the chair, owns the story", evidenceStrength: "Thin" },
];

export const JOURNEY: Record<PersonaId, Record<PhaseId, Activity[]>> = {
  director: {
    plan: [
      {
        id: "dir-plan-1",
        title: "Receives the forward agenda",
        kind: "none",
        moment: "The meeting is scheduled and the draft agenda goes out.",
        want: "Know what's coming and block time to read.",
        evidence: "H",
        evidenceNote: "Assumed from the standard board cycle. Not researched.",
      },
    ],
    build: [],
    publish: [
      {
        id: "dir-pub-1",
        title: "Get oriented on a new pack",
        kind: "summary",
        useCase: "D1",
        moment: "The pack arrives. The average pack is about 226 pages.",
        want: "What's in this book, what needs a decision and what's new.",
        prompt: "What's in this book and what needs a decision?",
        entry: "Book page → Ask about this book",
        contextAdds: "Ranks documents by importance to this meeting. Plain compression gives every document equal weight.",
        shape: "Orient",
        evidence: "D",
        evidenceNote:
          "54% of directors struggle to find key messages (CGI and Board Intelligence, cited on diligent.com). Joe Hurd reads first, then uses a summary as notes.",
      },
    ],
    prepare: [
      {
        id: "dir-prep-0",
        title: "Reads and annotates the full pack",
        kind: "none",
        moment: "Over several days, usually on iPad.",
        want: "Not miss anything. A summary doesn't replace reading.",
        evidence: "D",
        evidenceNote: "Joe Hurd: \"I would never read the summary in lieu of reading the entire document.\"",
      },
      {
        id: "dir-prep-1",
        title: "See what changed since the last book",
        kind: "summary",
        useCase: "D2",
        moment: "While reading, comparing with the previous meeting.",
        want: "What's different from last time, what's out of line and what's missing.",
        prompt: "What changed since the December book?",
        entry: "Book page or chat",
        contextAdds: "Compares this book's synthesis with the previous one. A per-document view can't see changes across papers.",
        shape: "Changes",
        evidence: "D",
        evidenceNote: "Joe Hurd: \"What is different from last year's budget? What assumptions have changed?\"",
      },
      {
        id: "dir-prep-2",
        title: "Look up history before chairing",
        kind: "summary",
        useCase: "D3",
        moment: "Newly chairing a committee and needs the history.",
        want: "What we decided before, and how it changed over 2–3 years.",
        prompt: "How has the CEO incentive plan changed over the last 3 years?",
        entry: "Home → AGAI",
        contextAdds: "Knows which earlier book and section covers the topic, and lines up the versions.",
        shape: "Trace",
        evidence: "D",
        evidenceNote: "Joe Hurd (new compensation committee chair). The Smart Assist research (15 participants) found cross-book history is the top need.",
      },
      {
        id: "dir-prep-3",
        title: "See where colleagues spent time",
        kind: "none",
        useCase: "D5",
        moment: "Just before the meeting, \"late to the party\".",
        want: "Which pages colleagues highlighted or read longest.",
        note: "Activity data, not a content summary. It's a separate discovery thread.",
        evidence: "D",
        evidenceNote: "Joe Hurd's strongest ask: \"Where's the heat?\"",
      },
      {
        id: "dir-prep-4",
        title: "Prepare questions to ask",
        kind: "otherFeature",
        moment: "Final preparation.",
        want: "Top questions to probe management.",
        note: "Covered by Smart Prep. Out of scope for the summary.",
        evidence: "D",
        evidenceNote: "Joe Hurd, Smart Prep feedback.",
      },
    ],
    meet: [
      {
        id: "dir-meet-1",
        title: "Find a page or past decision fast",
        kind: "search",
        useCase: "D6",
        moment: "Mid-discussion.",
        want: "The exact page or figure in seconds.",
        prompt: "Where's the capex table?",
        entry: "Book reader → AGAI",
        note: "Search with an exact citation, not a summary. Speed and proof matter here.",
        evidence: "D",
        evidenceNote: "Joe Hurd: \"I may have given up… while waiting for the spinning circle.\"",
      },
    ],
    follow: [
      {
        id: "dir-follow-1",
        title: "Capture takeaways and follow-ups",
        kind: "summary",
        useCase: "D7",
        moment: "Right after the meeting.",
        want: "Top 3 takeaways and follow-ups.",
        prompt: "Summarise the decisions and follow-ups from this meeting.",
        entry: "Chat",
        contextAdds: "Ties the minutes back to the papers they were about.",
        shape: "Recap",
        evidence: "D",
        evidenceNote: "Joe Hurd: \"Summarize the notes and give me the top three takeaways.\"",
      },
      {
        id: "dir-follow-2",
        title: "Catch up after joining a committee",
        kind: "summary",
        useCase: "C4",
        moment: "First weeks on a board or committee.",
        want: "What to read first and what was decided recently.",
        prompt: "I've joined the Audit Committee. What should I read first?",
        entry: "Home → AGAI",
        contextAdds: "Summarises across recent books, in order of importance.",
        shape: "Trace",
        evidence: "D",
        evidenceNote: "Use cases doc (Smart Assist retrieval).",
      },
    ],
  },
  admin: {
    plan: [
      {
        id: "adm-plan-1",
        title: "Carry open items into the agenda",
        kind: "summary",
        useCase: "A5",
        moment: "Drafting the next agenda.",
        want: "Open actions and decisions to carry forward.",
        prompt: "Which actions from the last two books are still open?",
        entry: "Home → AGAI",
        contextAdds: "Remembers decisions and actions across books, not one document at a time.",
        shape: "Trace",
        evidence: "D",
        evidenceNote: "Use cases doc (minutes and decision recall).",
      },
      {
        id: "adm-plan-2",
        title: "Agree the agenda with chair and CEO",
        kind: "none",
        moment: "Agenda sign-off.",
        want: "A confirmed agenda and paper owners.",
        evidence: "D",
        evidenceNote: "Admin persona one-pager, executive persona research.",
      },
    ],
    build: [
      {
        id: "adm-build-1",
        title: "Collect papers from authors",
        kind: "none",
        moment: "Chasing documents and versions.",
        want: "Everything in on time, in the right version.",
        evidence: "D",
        evidenceNote: "Persona deck (Corporate Secretary JTBD).",
      },
      {
        id: "adm-build-2",
        title: "Track late changes to the pack",
        kind: "summary",
        useCase: "A3",
        moment: "Papers change after the first draft.",
        want: "What changed, without redoing earlier edits.",
        prompt: "What changed in the book since I first published it?",
        entry: "Book editor → AGAI",
        contextAdds: "Detects what changed and refreshes only the affected parts of the summary.",
        shape: "Changes",
        evidence: "D",
        evidenceNote: "GovernAI feedback: edits are lost on regeneration.",
      },
    ],
    publish: [
      {
        id: "adm-pub-1",
        title: "Check the overview before release",
        kind: "summary",
        useCase: "A1",
        moment: "Right before publishing to directors.",
        want: "A short overview they can check and stand behind.",
        prompt: "Give me the overview directors will see for this book.",
        entry: "Book editor → AGAI",
        contextAdds: "Prioritises across the whole book. Today admins cut noise by hand.",
        shape: "Orient",
        evidence: "D",
        evidenceNote: "Trial feedback: a 136-page \"summary\" of a 250-page pack. PRD: exclude documents.",
      },
      {
        id: "adm-pub-2",
        title: "Decide who sees what",
        kind: "summary",
        useCase: "A2",
        moment: "Setting AI visibility per audience.",
        want: "The right view for each audience.",
        prompt: "What would the summary look like for the Audit Committee?",
        entry: "Book editor → AGAI",
        contextAdds: "Derives a variant from the same book model that respects each audience's permissions.",
        shape: "Share",
        evidence: "D",
        evidenceNote: "Gong: \"Smart Summary yes, Smart Prep and Risk Scanner no.\"",
      },
    ],
    prepare: [
      {
        id: "adm-prep-1",
        title: "Answer a director's request for a recap",
        kind: "summary",
        useCase: "A4",
        moment: "A director asks for a shorter version.",
        want: "A supplemental summary, fast.",
        prompt: "Draft a short recap of the strategy papers for the chair.",
        entry: "Chat",
        contextAdds: "Answers in the book's own context, not paper by paper.",
        shape: "Share",
        evidence: "D",
        evidenceNote: "Admin persona one-pager: directors ask admins for supplemental summaries.",
      },
      {
        id: "adm-prep-2",
        title: "Check who has opened the pack",
        kind: "none",
        useCase: "A6",
        moment: "Chasing readers before the meeting.",
        want: "Who hasn't opened it yet.",
        note: "Activity data, not a summary.",
        evidence: "D",
        evidenceNote: "Use cases doc.",
      },
    ],
    meet: [
      {
        id: "adm-meet-1",
        title: "Find a past resolution when asked",
        kind: "search",
        moment: "A director asks what was decided before.",
        want: "The resolution and page, now.",
        prompt: "When did we approve the incident response framework?",
        entry: "Chat",
        note: "Search with a citation, not a summary.",
        evidence: "D",
        evidenceNote: "Use cases doc (decision recall).",
      },
    ],
    follow: [
      {
        id: "adm-follow-1",
        title: "Draft the minutes",
        kind: "otherFeature",
        moment: "After the meeting.",
        want: "Draft minutes with actions and decisions.",
        note: "Covered by Smart Minutes. Out of scope for the summary.",
        evidence: "D",
        evidenceNote: "GovernAI solution descriptions.",
      },
    ],
  },
  gc: {
    plan: [
      {
        id: "gc-plan-1",
        title: "Flag items with legal implications",
        kind: "none",
        moment: "Agenda review.",
        want: "Legal risk is on the agenda early.",
        evidence: "H",
        evidenceNote: "Hypothesis. Not researched with GCs.",
      },
    ],
    build: [
      {
        id: "gc-build-1",
        title: "Review papers for legal exposure",
        kind: "otherFeature",
        useCase: "G1",
        moment: "Before release.",
        want: "Risky statements and commitments flagged.",
        note: "Covered by Smart Risk Scanner. Out of scope for the summary.",
        evidence: "D",
        evidenceNote: "Risk Scanner positioning. GCs are often the economic buyer.",
      },
    ],
    publish: [
      {
        id: "gc-pub-1",
        title: "Confirm access to sensitive papers",
        kind: "none",
        moment: "At publish.",
        want: "Only the right people see restricted content.",
        evidence: "D",
        evidenceNote: "GovernAI feedback: admin-only control (CoSec, GC).",
      },
    ],
    prepare: [
      {
        id: "gc-prep-1",
        title: "Trace a topic across years",
        kind: "summary",
        useCase: "G2",
        moment: "Preparing advice on a recurring issue.",
        want: "How the topic was discussed, and its status over two years.",
        prompt: "Summarise how our data privacy obligations were discussed over the last two years.",
        entry: "Home → AGAI",
        contextAdds: "Finds every relevant paper across books. Confidentiality tags still apply: \"GC is not a bypass\".",
        shape: "Trace",
        evidence: "D",
        evidenceNote: "Use cases doc.",
      },
      {
        id: "gc-prep-2",
        title: "Summarise a committee's annotations",
        kind: "summary",
        useCase: "G3",
        moment: "After a committee reviewed a report.",
        want: "What the committee focused on.",
        prompt: "Summarise the audit committee's annotations on the Q3 risk report.",
        entry: "Book page → Ask about this book",
        contextAdds: "Reads annotations in the context of the report they sit on.",
        shape: "Recap",
        evidence: "D",
        evidenceNote: "Use cases doc. Needs annotation indexing, which isn't there today.",
      },
    ],
    meet: [
      {
        id: "gc-meet-1",
        title: "Find precedent in seconds",
        kind: "search",
        moment: "A legal question in the room.",
        want: "The earlier decision and its wording.",
        prompt: "When did the board last change the risk appetite statement?",
        entry: "Chat",
        note: "Search with a citation, not a summary.",
        evidence: "D",
        evidenceNote: "Use cases doc (decision recall).",
      },
    ],
    follow: [
      {
        id: "gc-follow-1",
        title: "Review the minutes for accuracy",
        kind: "none",
        moment: "Minutes draft circulates.",
        want: "An accurate legal record.",
        evidence: "H",
        evidenceNote: "Hypothesis from the role. Not researched.",
      },
    ],
  },
  cfo: {
    plan: [
      {
        id: "cfo-plan-1",
        title: "Set the finance agenda",
        kind: "none",
        moment: "Agenda planning with the CEO and chair.",
        want: "Finance items scheduled with enough time.",
        evidence: "D",
        evidenceNote: "Executive persona research: CEO and CFO set the agenda with the chair.",
      },
    ],
    build: [
      {
        id: "cfo-build-1",
        title: "Check my report against the pack",
        kind: "summary",
        useCase: "F1",
        moment: "Finalising the finance paper.",
        want: "Figures that match the other papers.",
        prompt: "What do other papers in this book say about FY2027 capex?",
        entry: "Book editor → AGAI",
        contextAdds: "Compares figures across documents and points out contradictions.",
        shape: "Trace",
        evidence: "H",
        evidenceNote: "Directors value spotting contradictory figures (Smart Summary feedback). The CFO-as-reader workflow is a hypothesis.",
      },
    ],
    publish: [],
    prepare: [
      {
        id: "cfo-prep-1",
        title: "Anticipate committee questions",
        kind: "otherFeature",
        useCase: "F2",
        moment: "Before the audit committee.",
        want: "Likely questions on the numbers.",
        note: "Covered by Audit Smart Prep. Out of scope for the summary.",
        evidence: "D",
        evidenceNote: "Audit Smart Prep PRD.",
      },
      {
        id: "cfo-prep-2",
        title: "Recall a past financial decision",
        kind: "search",
        useCase: "F3",
        moment: "Checking precedent.",
        want: "When it was approved and who was present.",
        prompt: "When did the board approve the updated risk appetite statement, and who was present?",
        entry: "Chat",
        note: "Resolution-level search, not a summary.",
        evidence: "D",
        evidenceNote: "Use cases doc.",
      },
    ],
    meet: [
      {
        id: "cfo-meet-1",
        title: "Present results and answer questions",
        kind: "none",
        moment: "Finance agenda item.",
        want: "A clear story and fast answers.",
        evidence: "H",
        evidenceNote: "Hypothesis from the role.",
      },
    ],
    follow: [
      {
        id: "cfo-follow-1",
        title: "Summarise controls findings",
        kind: "summary",
        useCase: "F4",
        moment: "SOX or IPO readiness work.",
        want: "Controls findings across meetings in one view.",
        prompt: "Summarise every internal-controls finding in the last four books.",
        entry: "Home → AGAI",
        contextAdds: "Traces findings across documents and books.",
        shape: "Trace",
        evidence: "H",
        evidenceNote: "SOX readiness pain point comes from the sales play. The summary workflow is a hypothesis.",
      },
    ],
  },
  ceo: {
    plan: [
      {
        id: "ceo-plan-1",
        title: "Set the agenda with the chair",
        kind: "none",
        moment: "Agenda planning.",
        want: "The right topics in the right order.",
        evidence: "D",
        evidenceNote: "Executive persona research.",
      },
    ],
    build: [
      {
        id: "ceo-build-1",
        title: "See what the board will read",
        kind: "summary",
        useCase: "C1",
        moment: "The draft book is ready.",
        want: "A one-page view of what the board will see and decide.",
        prompt: "Give me a one-page view of what this book asks the board to decide.",
        entry: "Book editor → AGAI",
        contextAdds: "Ranks the whole book before it ships.",
        shape: "Orient",
        evidence: "H",
        evidenceNote: "CEO's agenda role is documented. This exact use is a hypothesis.",
      },
      {
        id: "ceo-build-2",
        title: "Check the story is consistent",
        kind: "summary",
        useCase: "C2",
        moment: "Final review of the pack.",
        want: "No contradictions or gaps between papers.",
        prompt: "Where do papers in this draft book contradict each other or leave gaps?",
        entry: "Book editor → AGAI",
        contextAdds: "Checks consistency and gaps across authors.",
        shape: "Changes",
        evidence: "D",
        evidenceNote: "Executive persona research: \"Preparing the final report for the board pack requires too much time.\"",
      },
    ],
    publish: [],
    prepare: [
      {
        id: "ceo-prep-1",
        title: "Prepare for director challenge",
        kind: "otherFeature",
        useCase: "C3",
        moment: "Before the meeting.",
        want: "Likely director questions per topic.",
        note: "Covered by Smart Prep. Out of scope for the summary.",
        evidence: "D",
        evidenceNote: "Gong: executives and presenters use Smart Prep.",
      },
    ],
    meet: [
      {
        id: "ceo-meet-1",
        title: "Present and lead the discussion",
        kind: "none",
        moment: "Meeting day.",
        want: "A focused discussion and clear decisions.",
        evidence: "H",
        evidenceNote: "Hypothesis from the role.",
      },
    ],
    follow: [
      {
        id: "ceo-follow-1",
        title: "Onboard a new director",
        kind: "summary",
        useCase: "C4",
        moment: "A new member joins.",
        want: "Recent key decisions, in order.",
        prompt: "Summarise the key decisions of the last 12 months for our new director.",
        entry: "Home → AGAI",
        contextAdds: "Summarises across books, ranked.",
        shape: "Trace",
        evidence: "D",
        evidenceNote: "Use cases doc (\"What should I read first?\").",
      },
    ],
  },
};

export const KIND_LABEL: Record<TouchKind, string> = {
  summary: "Summary in AGAI",
  search: "AGAI search",
  none: "No AI",
  otherFeature: "Other GovernAI feature",
};

export const countSummary = (items: Activity[]) => items.filter((a) => a.kind === "summary").length;

export const personaTotal = (p: PersonaId) =>
  PHASES.reduce((sum, ph) => sum + countSummary(JOURNEY[p][ph.id]), 0);

export const phaseTotal = (ph: PhaseId) =>
  PERSONAS.reduce((sum, p) => sum + countSummary(JOURNEY[p.id][ph]), 0);

export const MAX_CELL = Math.max(
  ...PERSONAS.flatMap((p) => PHASES.map((ph) => countSummary(JOURNEY[p.id][ph.id]))),
);
