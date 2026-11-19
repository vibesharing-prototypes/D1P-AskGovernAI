import { useState } from "react";
import { Box, Button, ButtonBase, Chip, Stack, Typography } from "@mui/material";
import BookPublishIcon from "@diligentcorp/atlas-react-bundle/icons/BookPublish";
import ArrowRightIcon from "@diligentcorp/atlas-react-bundle/icons/ArrowRight";
import ArrowDownIcon from "@diligentcorp/atlas-react-bundle/icons/ArrowDown";
import AiSparkleIcon from "@diligentcorp/atlas-react-bundle/icons/AiSparkle";
import SearchIcon from "@diligentcorp/atlas-react-bundle/icons/Search";
import AiSummaryIcon from "@diligentcorp/atlas-react-bundle/icons/AiSummary";
import AiInsightsIcon from "@diligentcorp/atlas-react-bundle/icons/AiInsights";
import OrgStructureIcon from "@diligentcorp/atlas-react-bundle/icons/OrgStructure";
import NotesIcon from "@diligentcorp/atlas-react-bundle/icons/Notes";
import AiSearchIcon from "@diligentcorp/atlas-react-bundle/icons/AiSearch";
import type { ReactElement } from "react";

type PartId = "map" | "notes" | "synthesis" | "index";

interface Part {
  id: PartId;
  n: number;
  title: string;
  oneLiner: string;
  what: string;
  serves: string;
  cost: string;
  buildStep: number;
  Icon: () => ReactElement;
}

const PARTS: Record<PartId, Part> = {
  map: {
    id: "map",
    n: 1,
    title: "Book map",
    oneLiner: "Agenda, tabs, documents, entities and how they relate.",
    what: "A cheap first pass over the book: agenda, tabs, document types and titles, entities, periods, and how documents relate. It's injected into every later prompt.",
    serves: "Makes everything else book-aware. This is what stops per-document output from being \"the same as concatenation\".",
    cost: "Almost none. It's built from structure and titles.",
    buildStep: 2,
    Icon: () => <OrgStructureIcon size="md" aria-hidden />,
  },
  notes: {
    id: "notes",
    n: 2,
    title: "Book-aware document notes",
    oneLiner: "Detailed notes per document, written knowing the whole book.",
    what: "Detailed, LLM-facing notes per document, written with the book map in the prompt, so each note knows its role in the book. Not for people to read.",
    serves: "Tracing a topic across documents and books, and keeping footnote-level facts that a short summary drops.",
    cost: "One pass per document, with the book map cached.",
    buildStep: 2,
    Icon: () => <NotesIcon size="md" aria-hidden />,
  },
  synthesis: {
    id: "synthesis",
    n: 3,
    title: "Whole-book synthesis",
    oneLiner: "One ranked, fact-preserving view of the book.",
    what: "One ranked, fact-preserving synthesis built from the book map and the notes. It's permission-aware: directors only ever see what they can access.",
    serves: "Orientation (\"what's in this book?\"), changes since the last book, and briefs for other audiences. Also the shared input for Smart Prep and Audit.",
    cost: "One pass per book and access combination. This is where the permission model decides cost.",
    buildStep: 3,
    Icon: () => <AiSummaryIcon size="md" aria-hidden />,
  },
  index: {
    id: "index",
    n: 4,
    title: "Contextualised search index",
    oneLiner: "Every chunk carries a line of book context.",
    what: "Before indexing, each chunk gets a short context line from the book map (\"FY2027 budget, capex section, Q1 2027 book\"), with citations to page.",
    serves: "Exact lookups and proof. The \"show me the passage\" trust need, and fast answers in the meeting.",
    cost: "Low with prompt caching. This is the smallest change with an immediate gain.",
    buildStep: 1,
    Icon: () => <AiSearchIcon size="md" aria-hidden />,
  },
};

const READERS = [
  { title: "AGAI chat", detail: "Orient, changes, trace, share", Icon: () => <AiSparkleIcon size="md" aria-hidden />, primary: true },
  { title: "Search", detail: "Exact facts, with page citations", Icon: () => <SearchIcon size="md" aria-hidden /> },
  { title: "Smart Prep and Audit", detail: "Read the shared synthesis (Q1 plan, step 3)", Icon: () => <AiInsightsIcon size="md" aria-hidden /> },
  { title: "Smart Summary", detail: "Rebuilt on the layer later (deferred)", Icon: () => <AiSummaryIcon size="md" aria-hidden /> },
];

const ROUTING = [
  { ask: "What's in this book? What needs a decision?", reads: "Whole-book synthesis", why: "Ranked, instant, consistent with the panel." },
  { ask: "What changed since the last book?", reads: "This book's and the last book's synthesis", why: "Compares two ranked views, not 40 documents." },
  { ask: "How has X changed over 3 years?", reads: "Book-aware notes across books", why: "Keeps the detail, finds the right section in each book." },
  { ask: "What's the capex figure?", reads: "Contextualised search index", why: "Exact figure and page. A summary is the wrong tool." },
  { ask: "Draft a brief for the audit chair", reads: "Synthesis, filtered by the recipient's access", why: "Never leaks a paper the recipient can't open." },
];

const BUILD = [
  { title: "Contextualised search index", detail: "Smallest change, immediate gain in answer quality." },
  { title: "Book map and book-aware notes", detail: "Makes every per-document output know the book." },
  { title: "Whole-book synthesis", detail: "Shared by AGAI, Prep and Audit. Test against a plain concatenation." },
];

function PartCard({ part, selected, onSelect }: { part: Part; selected: boolean; onSelect: () => void }) {
  return (
    <ButtonBase
      onClick={onSelect}
      aria-pressed={selected}
      aria-controls="layer-part-detail"
      sx={({ tokens }) => ({
        flex: 1,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        textAlign: "left",
        gap: tokens.semantic.spacing.desktop.gap["2"].value,
        p: tokens.semantic.spacing.desktop.padding["2"].value,
        borderRadius: tokens.semantic.radius.lg.value,
        border: `1px solid ${selected ? tokens.semantic.color.selection.primary.selectionIndicator.value : tokens.semantic.color.ui.divider.default.value}`,
        bgcolor: selected ? tokens.semantic.color.selection.primary.default.value : tokens.semantic.color.surface.default.value,
        boxShadow: tokens.semantic.shadow.low.value.stringValue,
        transition: "border-color 120ms, background-color 120ms",
        "&:hover": { borderColor: tokens.semantic.color.outline.hover.value },
        "&:focus-visible": { outline: `2px solid ${tokens.semantic.color.ui.focusRing.value}`, outlineOffset: "2px" },
      })}
    >
      <Box
        sx={({ tokens }) => ({
          width: 28,
          height: 28,
          flexShrink: 0,
          borderRadius: tokens.semantic.radius.full.value,
          display: "grid",
          placeItems: "center",
          background: tokens.semantic.gradients.ai.default.value,
          color: tokens.semantic.color.action.aiPrimary.onAiPrimary.value,
        })}
      >
        <Typography variant="labelSm" sx={{ color: "inherit" }}>
          {part.n}
        </Typography>
      </Box>
      <Stack gap="2px" sx={{ flex: 1 }}>
        <Stack direction="row" alignItems="center" gap="6px">
          <part.Icon />
          <Typography variant="labelLg">{part.title}</Typography>
        </Stack>
        <Typography variant="textSm" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
          {part.oneLiner}
        </Typography>
      </Stack>
    </ButtonBase>
  );
}

function FlowArrow({ direction = "right" }: { direction?: "right" | "down" }) {
  return (
    <Box
      aria-hidden
      sx={({ tokens }) => ({
        display: "grid",
        placeItems: "center",
        color: tokens.semantic.color.type.muted.value,
        alignSelf: "center",
      })}
    >
      {direction === "down" ? <ArrowDownIcon size="md" /> : <ArrowRightIcon size="md" />}
    </Box>
  );
}

function ColumnLabel({ children }: { children: string }) {
  return (
    <Typography variant="labelSm" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value, textTransform: "none" })}>
      {children}
    </Typography>
  );
}

export default function Recommendation() {
  const [selected, setSelected] = useState<PartId>("synthesis");
  const part = PARTS[selected];

  return (
    <Stack sx={({ tokens }) => ({ gap: tokens.semantic.spacing.desktop.gap["5"].value })}>
      {/* Diagram */}
      <Stack
        direction={{ xs: "column", lg: "row" }}
        alignItems="stretch"
        sx={({ tokens }) => ({ gap: tokens.semantic.spacing.desktop.gap["2"].value })}
      >
        {/* Trigger */}
        <Stack gap="8px" sx={{ width: { lg: 200 }, flexShrink: 0 }}>
          <ColumnLabel>When</ColumnLabel>
          <Stack
            sx={({ tokens }) => ({
              flex: 1,
              gap: tokens.semantic.spacing.desktop.gap["1"].value,
              p: tokens.semantic.spacing.desktop.padding["2_5"].value,
              borderRadius: tokens.semantic.radius.lg.value,
              bgcolor: tokens.semantic.color.accent.blue.background.value,
              color: tokens.semantic.color.accent.blue.content.value,
            })}
          >
            <BookPublishIcon size="lg" aria-hidden />
            <Typography variant="labelLg" sx={{ color: "inherit" }}>
              A book is published
            </Typography>
            <Typography variant="textSm" sx={{ color: "inherit" }}>
              Generated in the background, linked to the publisher. Refreshed when the book changes, so it's ready before anyone asks.
            </Typography>
          </Stack>
        </Stack>

        <Box sx={{ display: { xs: "none", lg: "grid" }, placeItems: "center", pt: "24px" }}>
          <FlowArrow />
        </Box>
        <Box sx={{ display: { xs: "grid", lg: "none" }, placeItems: "center" }}>
          <FlowArrow direction="down" />
        </Box>

        {/* Layer */}
        <Stack gap="8px" sx={{ flex: 1, minWidth: 0 }}>
          <ColumnLabel>Book context layer</ColumnLabel>
          <Box
            sx={({ tokens }) => ({
              flex: 1,
              p: "1px",
              borderRadius: tokens.semantic.radius.xl.value,
              background: tokens.semantic.gradients.ai.default.value,
            })}
          >
            <Stack
              sx={({ tokens }) => ({
                height: "100%",
                gap: tokens.semantic.spacing.desktop.gap["2"].value,
                p: tokens.semantic.spacing.desktop.padding["2_5"].value,
                borderRadius: `calc(${tokens.semantic.radius.xl.value} - 1px)`,
                bgcolor: tokens.semantic.color.surface.subtle.value,
              })}
            >
              <PartCard part={PARTS.map} selected={selected === "map"} onSelect={() => setSelected("map")} />
              <Typography variant="textSm" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value, textAlign: "center" })}>
                Injected into every part below
              </Typography>
              <Stack direction={{ xs: "column", md: "row" }} sx={({ tokens }) => ({ gap: tokens.semantic.spacing.desktop.gap["2"].value })}>
                <PartCard part={PARTS.notes} selected={selected === "notes"} onSelect={() => setSelected("notes")} />
                <Box sx={{ display: { xs: "none", md: "grid" }, placeItems: "center" }}>
                  <FlowArrow />
                </Box>
                <PartCard part={PARTS.synthesis} selected={selected === "synthesis"} onSelect={() => setSelected("synthesis")} />
              </Stack>
              <PartCard part={PARTS.index} selected={selected === "index"} onSelect={() => setSelected("index")} />
            </Stack>
          </Box>
        </Stack>

        <Box sx={{ display: { xs: "none", lg: "grid" }, placeItems: "center", pt: "24px" }}>
          <FlowArrow />
        </Box>
        <Box sx={{ display: { xs: "grid", lg: "none" }, placeItems: "center" }}>
          <FlowArrow direction="down" />
        </Box>

        {/* Readers */}
        <Stack gap="8px" sx={{ width: { lg: 240 }, flexShrink: 0 }}>
          <ColumnLabel>Every feature reads it</ColumnLabel>
          <Stack sx={({ tokens }) => ({ flex: 1, gap: tokens.semantic.spacing.desktop.gap["1"].value })}>
            {READERS.map((r) => (
              <Stack
                key={r.title}
                direction="row"
                alignItems="flex-start"
                sx={({ tokens }) => ({
                  gap: tokens.semantic.spacing.desktop.gap["1"].value,
                  p: tokens.semantic.spacing.desktop.padding["2"].value,
                  borderRadius: tokens.semantic.radius.lg.value,
                  border: `1px solid ${tokens.semantic.color.ui.divider.default.value}`,
                  bgcolor: r.primary ? tokens.semantic.color.accent.lavender.background.value : tokens.semantic.color.surface.default.value,
                })}
              >
                <Box sx={{ pt: "2px" }}>
                  <r.Icon />
                </Box>
                <Stack>
                  <Typography variant="labelLg">{r.title}</Typography>
                  <Typography variant="textSm" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
                    {r.detail}
                  </Typography>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Stack>

      {/* Selected part detail (progressive disclosure) */}
      <Box
        id="layer-part-detail"
        role="region"
        aria-live="polite"
        aria-label={`${part.title} details`}
        sx={({ tokens }) => ({
          p: tokens.semantic.spacing.desktop.padding["3"].value,
          borderRadius: tokens.semantic.radius.lg.value,
          border: `1px solid ${tokens.semantic.color.ui.divider.default.value}`,
          bgcolor: tokens.semantic.color.surface.default.value,
        })}
      >
        <Stack sx={({ tokens }) => ({ gap: tokens.semantic.spacing.desktop.gap["2"].value })}>
          <Stack direction="row" alignItems="center" gap="8px" flexWrap="wrap">
            <Typography variant="h6" component="h3">
              {part.n}. {part.title}
            </Typography>
            <Chip size="small" label={`Build step ${part.buildStep}`} />
          </Stack>
          <Box
            sx={({ tokens }) => ({
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              gap: tokens.semantic.spacing.desktop.gap["3"].value,
            })}
          >
            {[
              ["What it is", part.what],
              ["Serves", part.serves],
              ["Cost", part.cost],
            ].map(([label, text]) => (
              <Stack key={label} gap="4px">
                <Typography variant="labelXs" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
                  {label}
                </Typography>
                <Typography variant="textMd">{text}</Typography>
              </Stack>
            ))}
          </Box>
        </Stack>
      </Box>

      {/* Routing + build order */}
      <Box
        sx={({ tokens }) => ({
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "3fr 2fr" },
          gap: tokens.semantic.spacing.desktop.gap["4"].value,
        })}
      >
        <Stack sx={({ tokens }) => ({ gap: tokens.semantic.spacing.desktop.gap["2"].value })}>
          <Typography variant="h6" component="h3">
            How AGAI picks a source
          </Typography>
          <Stack
            sx={({ tokens }) => ({
              borderRadius: tokens.semantic.radius.lg.value,
              border: `1px solid ${tokens.semantic.color.ui.divider.default.value}`,
              bgcolor: tokens.semantic.color.surface.default.value,
              overflow: "hidden",
            })}
          >
            {ROUTING.map((r, i) => (
              <Box
                key={r.ask}
                sx={({ tokens }) => ({
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1.2fr 1fr" },
                  gap: tokens.semantic.spacing.desktop.gap["1"].value,
                  p: tokens.semantic.spacing.desktop.padding["2"].value,
                  borderTop: i ? `1px solid ${tokens.semantic.color.ui.divider.default.value}` : "none",
                })}
              >
                <Typography variant="textMd">“{r.ask}”</Typography>
                <Stack gap="2px">
                  <Typography variant="labelSm">{r.reads}</Typography>
                  <Typography variant="textSm" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
                    {r.why}
                  </Typography>
                </Stack>
              </Box>
            ))}
          </Stack>
          <Typography variant="textSm" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
            Every answer cites the page and says whether it came from the summary or from search, and how fresh it is.
          </Typography>
        </Stack>

        <Stack sx={({ tokens }) => ({ gap: tokens.semantic.spacing.desktop.gap["2"].value })}>
          <Typography variant="h6" component="h3">
            Build order
          </Typography>
          <Stack component="ol" sx={({ tokens }) => ({ m: 0, p: 0, listStyle: "none", gap: tokens.semantic.spacing.desktop.gap["1"].value })}>
            {BUILD.map((b, i) => (
              <Stack
                component="li"
                key={b.title}
                direction="row"
                sx={({ tokens }) => ({
                  gap: tokens.semantic.spacing.desktop.gap["2"].value,
                  p: tokens.semantic.spacing.desktop.padding["2"].value,
                  borderRadius: tokens.semantic.radius.lg.value,
                  border: `1px solid ${tokens.semantic.color.ui.divider.default.value}`,
                  bgcolor: tokens.semantic.color.surface.default.value,
                })}
              >
                <Typography variant="numberMd" sx={({ tokens }) => ({ color: tokens.semantic.color.accent.lavender.content.value })}>
                  {i + 1}
                </Typography>
                <Stack>
                  <Typography variant="labelLg">{b.title}</Typography>
                  <Typography variant="textSm" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
                    {b.detail}
                  </Typography>
                </Stack>
              </Stack>
            ))}
          </Stack>
          <Typography variant="textSm" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
            Not now: a rewrite of the human-facing Smart Summary, RAPTOR or GraphRAG structures, and activity heat (a separate thread).
          </Typography>
        </Stack>
      </Box>

      {/* Try it */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        sx={({ tokens }) => ({
          gap: tokens.semantic.spacing.desktop.gap["3"].value,
          p: tokens.semantic.spacing.desktop.padding["3"].value,
          borderRadius: tokens.semantic.radius.lg.value,
          bgcolor: tokens.semantic.color.accent.lavender.background.value,
        })}
      >
        <Stack gap="4px">
          <Typography variant="h6" component="h3">
            See it in the chat
          </Typography>
          <Typography variant="textMd">
            Ask AGAI about a board book and see which part of the context layer answers, with citations and freshness.
          </Typography>
        </Stack>
        <Button variant="contained" href="summary-try.html" endIcon={<ArrowRightIcon size="md" aria-hidden />} sx={{ flexShrink: 0 }}>
          Try it
        </Button>
      </Stack>
    </Stack>
  );
}
