import { Box, Chip, Container, Stack, Typography } from "@mui/material";
import { PageHeader, SectionHeader } from "@diligentcorp/atlas-react-bundle";
import JourneyMap from "./JourneyMap";
import Competitors from "./Competitors";
import Recommendation from "./Recommendation";
import Requirements from "./Requirements";
import { PERSONAS, PHASES, personaTotal, phaseTotal } from "./journeyData";

function Takeaways() {
  const phaseTotals = PHASES.map((p) => ({ p, n: phaseTotal(p.id) })).sort((a, b) => b.n - a.n);
  const personaTotals = PERSONAS.map((p) => ({ p, n: personaTotal(p.id) })).sort((a, b) => b.n - a.n);
  const top = personaTotals.filter((x) => x.n === personaTotals[0].n);
  const meet = PHASES.find((p) => p.id === "meet")!;
  const total = PHASES.reduce((s, p) => s + phaseTotal(p.id), 0);

  const cards = [
    {
      label: "Busiest phase",
      value: phaseTotals[0].p.name,
      detail: `${phaseTotals[0].n} of ${total} summary touchpoints. ${phaseTotals[1].p.name} is next with ${phaseTotals[1].n}.`,
    },
    {
      label: "Most touchpoints",
      value: top.map((x) => x.p.name).join(" and "),
      detail: `${top[0].n} each. General counsel, CFO and CEO have fewer, and thinner evidence.`,
    },
    {
      label: meet.name,
      value: `${phaseTotal("meet")} summary touchpoints`,
      detail: "Everyone needs search with an exact page here. A summary is the wrong tool mid-meeting.",
    },
    {
      label: "When to generate",
      value: "At publish",
      detail: "The summary must exist before the first question. Generating a 300-page book live takes minutes.",
    },
  ];

  return (
    <Box
      sx={({ tokens }) => ({
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" },
        gap: tokens.semantic.spacing.desktop.gap["2"].value,
      })}
    >
      {cards.map((c) => (
        <Stack
          key={c.label}
          sx={({ tokens }) => ({
            gap: "4px",
            p: tokens.semantic.spacing.desktop.padding["2_5"].value,
            borderRadius: tokens.semantic.radius.lg.value,
            border: `1px solid ${tokens.semantic.color.ui.divider.default.value}`,
            bgcolor: tokens.semantic.color.surface.default.value,
          })}
        >
          <Typography variant="labelSm" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
            {c.label}
          </Typography>
          <Typography variant="h6" component="p">
            {c.value}
          </Typography>
          <Typography variant="textSm" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
            {c.detail}
          </Typography>
        </Stack>
      ))}
    </Box>
  );
}

function Section({ id, title, subtitle, children }: { id: string; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <Stack component="section" aria-labelledby={`${id}-title`} sx={({ tokens }) => ({ gap: tokens.semantic.spacing.desktop.gap["3"].value })}>
      <Box id={`${id}-title`}>
        <SectionHeader headingLevel="h2" title={title} subtitle={subtitle} />
      </Box>
      {children}
    </Stack>
  );
}

export default function DiscoveryPage() {
  return (
    <Box
      sx={({ tokens }) => ({
        minHeight: "100svh",
        background: `linear-gradient(135deg, ${tokens.semantic.color.background.baseGradientStart.value} 30%, ${tokens.semantic.color.background.baseGradientEnd.value} 100%)`,
        color: tokens.semantic.color.type.default.value,
      })}
    >
      <Container maxWidth="xl" sx={{ py: { xs: "24px", md: "40px" }, px: { xs: "16px", md: "32px" } }}>
        <Stack sx={({ tokens }) => ({ gap: tokens.semantic.spacing.desktop.gap["6"].value })}>
          <Stack sx={({ tokens }) => ({ gap: tokens.semantic.spacing.desktop.gap["3"].value })}>
            <Stack direction="row" gap="8px" flexWrap="wrap">
              <Chip size="small" label="Discovery" />
              <Chip size="small" label="Team Unicorn · Q1 2027 planning" />
            </Stack>
            <PageHeader
              pageTitle="Summary in AGAI"
              pageSubtitle="Where people need a book summary in the board meeting cycle, how others solve it, and what we should build."
              containerProps={{ sx: { px: 0 } }}
            />
            <Typography variant="textMd" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value, maxWidth: 820 })}>
              Scope: the regular book summary, used in the AGAI chat. Smart Prep, Audit and Risk Scanner are shown only to mark the boundary. Design rule: whatever we build, every summary carries context about the whole book.
            </Typography>
            <Takeaways />
          </Stack>

          <Section
            id="journey"
            title="Board meeting cycle: summary touchpoints"
            subtitle="Six phases, five personas. Darker cells have more summary touchpoints. Select a phase, persona or cell to drill down."
          >
            <JourneyMap />
          </Section>

          <Section
            id="others"
            title="How others solve this"
            subtitle="Board portals summarise per section. AI search products put context into retrieval and pre-generate orientation layers."
          >
            <Competitors />
          </Section>

          <Section
            id="needs"
            title="What the summary needs"
            subtitle="Eight requirements for an LLM-facing summary that mostly powers targeted questions, in priority order. Expand one to see why."
          >
            <Requirements />
          </Section>

          <Section
            id="recommendation"
            title="Recommendation: a book context layer"
            subtitle="Build a book context layer, generated at publish, that every feature reads. Select a part to see what it does."
          >
            <Recommendation />
          </Section>

          <Typography variant="textSm" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
            Sources: 27Q1 Planning, Smart Summary v2 PRD, Audit Smart Prep PRD, executive persona research, GovernAI feedback and trial analysis, Boards AI Assistant survey, Smart Assist use cases, director interview (28 Oct 2026). Full write-up: LLM-facing-summary-use-cases-and-practices.md.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
