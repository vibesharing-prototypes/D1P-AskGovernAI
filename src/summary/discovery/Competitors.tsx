import {
  Box,
  Chip,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ExternalLinkIcon from "@diligentcorp/atlas-react-bundle/icons/ExternalLink";

interface Row {
  who: string;
  pattern: string;
  what: string;
  takeaway: string;
  sources: { label: string; href: string }[];
}

const VERIFIED: Row[] = [
  {
    who: "OnBoard Book AI",
    pattern: "Per-section summary",
    what: "A short, in-book summary at the top of each section. Users can accept, revise or remove it.",
    takeaway: "Competitors summarise per section, inside the book, with human control. The page doesn't describe a whole-book summary or Q&A.",
    sources: [{ label: "onboardmeetings.com", href: "https://www.onboardmeetings.com/onboard-ai/book-ai/" }],
  },
  {
    who: "BoardEffect",
    pattern: "One-click insights",
    what: "\"Transforms your board books into concise, actionable insights with a single click.\"",
    takeaway: "Marketing claim only. No detail on how it works.",
    sources: [{ label: "boardeffect.com", href: "https://www.boardeffect.com/lp/board-portal-software/" }],
  },
  {
    who: "Anthropic contextual retrieval",
    pattern: "Context in the search index",
    what: "An LLM reads the whole document and writes a short context for each chunk before indexing. Reported failed retrievals drop 35% (embeddings), 49% (plus BM25), 67% (plus reranking).",
    takeaway: "Whole-book context can live in the search index itself, not only in a separate summary. Prompt caching keeps the cost low.",
    sources: [{ label: "anthropic.com", href: "https://www.anthropic.com/news/contextual-retrieval" }],
  },
  {
    who: "Anthropic, long-context guidance",
    pattern: "Whole book in the prompt",
    what: "If the knowledge base is under about 200,000 tokens (about 500 pages), you can put it all in the prompt, cached.",
    takeaway: "A typical board book (about 226 pages) may fit in one prompt. This is our estimate. Tables and charts add tokens.",
    sources: [{ label: "anthropic.com", href: "https://www.anthropic.com/news/contextual-retrieval" }],
  },
  {
    who: "RAPTOR and GraphRAG",
    pattern: "Hierarchical summaries",
    what: "Build a tree or graph of summaries over the corpus, so \"global\" questions can use higher-level summaries.",
    takeaway: "Plain chunk search is weak at \"what are the themes here?\". Hierarchical summaries fix that. Gains not verified from the original papers.",
    sources: [
      { label: "meilisearch.com", href: "https://www.meilisearch.com/blog/raptor-rag" },
      { label: "arxiv.org", href: "https://arxiv.org/pdf/2502.11371" },
    ],
  },
  {
    who: "Enterprise summary tools",
    pattern: "Cached and regenerated",
    what: "Cache summaries, regenerate on demand, keep them in sync with source changes, and have humans review.",
    takeaway: "Staleness and review are the known risks of pre-generated summaries.",
    sources: [
      { label: "box.com", href: "https://blog.box.com/ai-summarization-definition-and-best-practices" },
      { label: "docsie.io", href: "https://www.docsie.io/blog/glossary/ai-powered-summaries/" },
    ],
  },
  {
    who: "Vertex AI Search",
    pattern: "Extractive plus generative",
    what: "Offers extractive answers (exact passages) and generative answers (synthesis with citations).",
    takeaway: "Hybrid is normal: show the passage when the user wants proof.",
    sources: [
      {
        label: "oneuptime.com",
        href: "https://oneuptime.com/blog/post/2026-02-17-how-to-set-up-vertex-ai-search-for-enterprise-document-search/markdown",
      },
    ],
  },
];

const GENERAL: Row[] = [
  {
    who: "Microsoft Copilot, Notion AI, Google Gemini",
    pattern: "On-demand",
    what: "Mostly summarise on demand, on the document the user has open.",
    takeaway: "On-demand is the default for single documents. It doesn't scale to a 200-page book in a chat.",
    sources: [],
  },
  {
    who: "NotebookLM",
    pattern: "Pre-generated orientation",
    what: "Produces a source overview and suggested questions when a source is added.",
    takeaway: "A pre-generated orientation layer that sits beside live Q&A. This is closest to what we propose.",
    sources: [],
  },
  {
    who: "Atlassian Rovo",
    pattern: "Short summarise",
    what: "Named in Diligent's Confluence as a target pattern for short status summaries.",
    takeaway: "Short and scannable beats long and complete for status questions.",
    sources: [],
  },
];

function SourceLinks({ sources }: { sources: Row["sources"] }) {
  if (!sources.length) {
    return (
      <Typography variant="textSm" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
        —
      </Typography>
    );
  }
  return (
    <Stack gap="4px">
      {sources.map((s) => (
        <Link key={s.href} href={s.href} target="_blank" rel="noreferrer" variant="textSm" sx={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "4px" }}>
          {s.label}
          <ExternalLinkIcon size="sm" aria-hidden />
          <Box component="span" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>
            (opens in a new tab)
          </Box>
        </Link>
      ))}
    </Stack>
  );
}

function GroupRow({ label, hint, verified }: { label: string; hint: string; verified: boolean }) {
  return (
    <TableRow>
      <TableCell colSpan={4} sx={({ tokens }) => ({ bgcolor: tokens.semantic.color.surface.subtle.value })}>
        <Stack direction="row" alignItems="center" gap="8px" flexWrap="wrap">
          <Chip
            size="small"
            label={label}
            sx={({ tokens }) => ({
              bgcolor: verified ? tokens.semantic.color.status.success.background.value : tokens.semantic.color.status.warning.background.value,
              color: verified ? tokens.semantic.color.status.success.text.value : tokens.semantic.color.status.warning.text.value,
            })}
          />
          <Typography variant="textSm" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
            {hint}
          </Typography>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

function DataRows({ rows }: { rows: Row[] }) {
  return (
    <>
      {rows.map((r) => (
        <TableRow key={r.who}>
          <TableCell sx={{ verticalAlign: "top" }}>
            <Stack gap="6px" alignItems="flex-start">
              <Typography variant="labelLg">{r.who}</Typography>
              <Chip size="small" label={r.pattern} />
            </Stack>
          </TableCell>
          <TableCell sx={{ verticalAlign: "top" }}>
            <Typography variant="textMd">{r.what}</Typography>
          </TableCell>
          <TableCell sx={{ verticalAlign: "top" }}>
            <Typography variant="textMd">{r.takeaway}</Typography>
          </TableCell>
          <TableCell sx={{ verticalAlign: "top" }}>
            <SourceLinks sources={r.sources} />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export default function Competitors() {
  return (
    <TableContainer
      sx={({ tokens }) => ({
        borderRadius: tokens.semantic.radius.lg.value,
        border: `1px solid ${tokens.semantic.color.ui.divider.default.value}`,
        bgcolor: tokens.semantic.color.surface.default.value,
      })}
    >
      <Table
        aria-label="How others solve this"
        sx={{
          tableLayout: "fixed",
          minWidth: 880,
          // Atlas table cells default to nowrap; this table holds prose.
          "& td, & th": { whiteSpace: "normal", overflowWrap: "anywhere" },
        }}
      >
        <colgroup>
          <col style={{ width: "22%" }} />
          <col style={{ width: "33%" }} />
          <col style={{ width: "33%" }} />
          <col style={{ width: "12%" }} />
        </colgroup>
        <TableHead>
          <TableRow>
            <TableCell>Who</TableCell>
            <TableCell>What they do</TableCell>
            <TableCell>What it means for us</TableCell>
            <TableCell>Source</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <GroupRow label="Verified" hint="Checked on the web during this research." verified />
          <DataRows rows={VERIFIED} />
          <GroupRow label="Not verified" hint="From general product knowledge. Confirm before quoting." verified={false} />
          <DataRows rows={GENERAL} />
        </TableBody>
      </Table>
    </TableContainer>
  );
}
