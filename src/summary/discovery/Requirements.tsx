import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, Stack, Typography } from "@mui/material";
import CaretDownIcon from "@diligentcorp/atlas-react-bundle/icons/CaretDown";

interface Requirement {
  n: number;
  title: string;
  summary: string;
  why: string;
  sources: string;
  /** Points to check with engineering: they decide the artifact shape. */
  checkWithEng?: boolean;
}

const REQUIREMENTS: Requirement[] = [
  {
    n: 1,
    title: "Whole-book context",
    summary: "Knows what the book is about and how documents relate, so it can rank, link and remove repetition.",
    why: "Gluing per-document summaries together doesn't count. Today's prompt handles each document alone and has no awareness of what matters across the book.",
    sources: "Agreed design rule. Smart Summary verbosity proposal.",
  },
  {
    n: 2,
    title: "Keeps the facts",
    summary: "Figures, decisions, dates, names, owners and footnote-level detail, not paraphrase.",
    why: "When Audit Smart Prep ran on the summary instead of the full book, it lost footnote findings. Joe Hurd: \"the real meat may be in the footnotes\".",
    sources: "Smart Summary v2 PRD (fact-preserving is a firm requirement). Audit Smart Prep PRD. Director interview.",
  },
  {
    n: 3,
    title: "Every claim traces to a page",
    summary: "Each statement maps to document, page and ideally the exact passage.",
    why: "Citations are the foundation of trust. The Q1 plan also asks for pinpoint citations, the way search results show them.",
    sources: "Smart Assist research (100% agreement on citations). 27Q1 Planning.",
  },
  {
    n: 4,
    title: "Permission-safe",
    summary: "Built per access level and never hints at a restricted document. Users only ever see \"the book\".",
    why: "Access is set per document, but directors never see documents directly. Elevated roles don't bypass committee confidentiality.",
    sources: "AI Book Summary requirements. Smart Summary v2 PRD. Use cases doc (\"GC is not a bypass\").",
  },
  {
    n: 5,
    title: "Structured for machines, not prose",
    summary: "Decisions required, entities, periods, key figures, links between documents, and what changed since the last book.",
    why: "Targeted, cross-book and trend questions need the right section of the right book. Every AGAI use case depends on scoped retrieval.",
    sources: "MCP investigation for Smart Assist.",
    checkWithEng: true,
  },
  {
    n: 6,
    title: "Ranked for this meeting",
    summary: "Decisions and material items first, boilerplate and appendices last.",
    why: "Today cover pages and appendices get the same weight as the decisions the board is there to make, and admins cut the noise by hand.",
    sources: "New LLM layer for executive summary. Exclude-documents PRD.",
    checkWithEng: true,
  },
  {
    n: 7,
    title: "Ready before the first question, and current",
    summary: "Generated at publish, carrying the book version and timestamp, and refreshed when the book changes.",
    why: "A full generation takes 10 to 30 minutes per book, while the chat target is under 15 seconds (P95). Late pack changes cause stale output and lost edits today.",
    sources: "27Q1 Planning. Smart Assist metrics. GovernAI feedback collection.",
  },
  {
    n: 8,
    title: "Says what it doesn't cover",
    summary: "Excluded or restricted documents, unparsed charts, and documents admins left out.",
    why: "This answers \"what's being left out?\" and lets AGAI caveat its answers instead of guessing.",
    sources: "Director interview. Summary v2 PRD (chart parsing is an open question).",
  },
];

export default function Requirements() {
  return (
    <Stack sx={({ tokens }) => ({ gap: tokens.semantic.spacing.desktop.gap["3"].value })}>
      <Box
        sx={({ tokens }) => ({
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: tokens.semantic.spacing.desktop.gap["2"].value,
          alignItems: "start",
        })}
      >
        {REQUIREMENTS.map((r) => (
          <Accordion
            key={r.n}
            disableGutters
            sx={({ tokens }) => ({
              borderRadius: `${tokens.semantic.radius.lg.value} !important`,
              border: `1px solid ${tokens.semantic.color.ui.divider.default.value}`,
              bgcolor: tokens.semantic.color.surface.default.value,
              boxShadow: "none",
              "&::before": { display: "none" },
            })}
          >
            <AccordionSummary expandIcon={<CaretDownIcon size="md" aria-hidden />} aria-controls={`req-${r.n}-content`} id={`req-${r.n}-header`}>
              <Stack direction="row" sx={({ tokens }) => ({ gap: tokens.semantic.spacing.desktop.gap["2"].value })}>
                <Typography variant="numberMd" sx={({ tokens }) => ({ color: tokens.semantic.color.accent.lavender.content.value, minWidth: 16 })}>
                  {r.n}
                </Typography>
                <Stack gap="2px">
                  <Stack direction="row" alignItems="center" gap="8px" flexWrap="wrap">
                    <Typography variant="labelLg">{r.title}</Typography>
                    {r.checkWithEng && <Chip size="small" label="Check with engineering" />}
                  </Stack>
                  <Typography variant="textSm" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
                    {r.summary}
                  </Typography>
                </Stack>
              </Stack>
            </AccordionSummary>
            <AccordionDetails id={`req-${r.n}-content`}>
              <Stack gap="8px" sx={{ pl: "28px" }}>
                <Stack gap="2px">
                  <Typography variant="labelXs" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
                    Why
                  </Typography>
                  <Typography variant="textMd">{r.why}</Typography>
                </Stack>
                <Stack gap="2px">
                  <Typography variant="labelXs" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
                    Source
                  </Typography>
                  <Typography variant="textSm">{r.sources}</Typography>
                </Stack>
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      <Box
        sx={({ tokens }) => ({
          p: tokens.semantic.spacing.desktop.padding["2_5"].value,
          borderRadius: tokens.semantic.radius.lg.value,
          bgcolor: tokens.semantic.color.surface.variant.value,
        })}
      >
        <Typography variant="labelLg" component="p">
          What it doesn't need
        </Typography>
        <Typography variant="textMd">
          To read well for people, or to be short. It's LLM-facing, so it can be long and detailed. Brevity and tone belong in what AGAI
          generates from it when someone asks for a summary: short, scannable, and leaning towards judgement (what changed, what's off) over
          compression.
        </Typography>
      </Box>

      <Typography variant="textSm" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
        Drawn from Diligent docs and one director interview, not tested against real queries. Points 5 and 6 decide whether this is one
        structured artifact or several, so check them with engineering.
      </Typography>
    </Stack>
  );
}
