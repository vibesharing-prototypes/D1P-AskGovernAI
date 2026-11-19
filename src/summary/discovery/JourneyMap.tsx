import { useState } from "react";
import {
  Box,
  ButtonBase,
  Chip,
  Divider,
  Drawer,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import AiSparkleIcon from "@diligentcorp/atlas-react-bundle/icons/AiSparkle";
import SearchIcon from "@diligentcorp/atlas-react-bundle/icons/Search";
import CloseIcon from "@diligentcorp/atlas-react-bundle/icons/Close";
import CaretRightIcon from "@diligentcorp/atlas-react-bundle/icons/CaretRight";
import BookPublishIcon from "@diligentcorp/atlas-react-bundle/icons/BookPublish";
import {
  JOURNEY,
  KIND_LABEL,
  MAX_CELL,
  PERSONAS,
  PHASES,
  countSummary,
  personaTotal,
  phaseTotal,
  type Activity,
  type PersonaId,
  type PhaseId,
  type TouchKind,
} from "./journeyData";

type Selection =
  | { type: "cell"; persona: PersonaId; phase: PhaseId }
  | { type: "phase"; phase: PhaseId }
  | { type: "persona"; persona: PersonaId }
  | null;

const PERSONA_COL = 200;
const PHASE_COL_MIN = 150;

// ─── Small building blocks ────────────────────────────────────────────────────

function KindMarker({ kind, size = "sm" }: { kind: TouchKind; size?: "sm" | "md" }) {
  if (kind === "summary") return <AiSparkleIcon size={size} aria-hidden />;
  if (kind === "search") return <SearchIcon size={size} aria-hidden />;
  return (
    <Box
      aria-hidden
      sx={({ tokens }) => ({
        width: 8,
        height: 8,
        borderRadius: tokens.semantic.radius.full.value,
        flexShrink: 0,
        mx: "4px",
        border: `1px solid ${tokens.semantic.color.outline.default.value}`,
        bgcolor:
          kind === "otherFeature"
            ? tokens.semantic.color.accent.gray.background.value
            : tokens.semantic.color.surface.default.value,
        borderStyle: kind === "otherFeature" ? "dashed" : "solid",
      })}
    />
  );
}

export function Legend() {
  const kinds: { kind: TouchKind; hint: string }[] = [
    { kind: "summary", hint: "The user asks AGAI for a summary, and the book context layer answers." },
    { kind: "search", hint: "AGAI answers from search with an exact citation. Not a summary." },
    { kind: "none", hint: "A step in the journey with no AI involved." },
    { kind: "otherFeature", hint: "Handled by Smart Prep, Risk Scanner or Smart Minutes. Out of scope here." },
  ];
  return (
    <Stack direction="row" flexWrap="wrap" sx={({ tokens }) => ({ gap: tokens.semantic.spacing.desktop.gap["3"].value })}>
      {kinds.map((k) => (
        <Tooltip key={k.kind} title={k.hint}>
          <Stack direction="row" alignItems="center" gap="6px" tabIndex={0} sx={{ cursor: "help" }}>
            <KindMarker kind={k.kind} />
            <Typography variant="textSm">{KIND_LABEL[k.kind]}</Typography>
          </Stack>
        </Tooltip>
      ))}
      <Tooltip title="Darker cells have more summary touchpoints.">
        <Stack direction="row" alignItems="center" gap="6px" tabIndex={0} sx={{ cursor: "help" }}>
          <Stack direction="row" aria-hidden>
            {[0, 0.5, 1].map((a) => (
              <Box
                key={a}
                sx={({ tokens }) => ({
                  width: 14,
                  height: 14,
                  border: `1px solid ${tokens.semantic.color.ui.divider.default.value}`,
                  bgcolor:
                    a === 0
                      ? tokens.semantic.color.surface.default.value
                      : heatColor(tokens.semantic.color.accent.lavender.background.value, tokens.semantic.color.accent.lavender.content.value, a),
                })}
              />
            ))}
          </Stack>
          <Typography variant="textSm">Touchpoint density</Typography>
        </Stack>
      </Tooltip>
    </Stack>
  );
}

// ─── Detail content (side sheet) ──────────────────────────────────────────────

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack gap="2px">
      <Typography variant="labelXs" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
        {label}
      </Typography>
      <Typography variant="textMd">{children}</Typography>
    </Stack>
  );
}

function ActivityCard({ a, showContext }: { a: Activity; showContext?: string }) {
  const isSummary = a.kind === "summary";
  return (
    <Box
      sx={({ tokens }) => ({
        p: tokens.semantic.spacing.desktop.padding["2_5"].value,
        borderRadius: tokens.semantic.radius.lg.value,
        border: `1px solid ${tokens.semantic.color.ui.divider.default.value}`,
        bgcolor: isSummary ? tokens.semantic.color.surface.default.value : tokens.semantic.color.surface.subtle.value,
        boxShadow: isSummary ? tokens.semantic.shadow.low.value.stringValue : "none",
      })}
    >
      <Stack gap="12px">
        <Stack direction="row" alignItems="center" gap="8px" flexWrap="wrap">
          <KindMarker kind={a.kind} />
          <Typography variant="labelSm" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
            {KIND_LABEL[a.kind]}
            {a.useCase ? ` · ${a.useCase}` : ""}
            {showContext ? ` · ${showContext}` : ""}
          </Typography>
          {a.shape && <Chip size="small" label={a.shape} />}
          <Tooltip title={a.evidence === "D" ? "Backed by Diligent sources" : "Hypothesis, needs validation"}>
            <Chip
              size="small"
              label={a.evidence === "D" ? "Evidence" : "Hypothesis"}
              sx={({ tokens }) => ({
                bgcolor:
                  a.evidence === "D"
                    ? tokens.semantic.color.status.success.background.value
                    : tokens.semantic.color.status.warning.background.value,
                color:
                  a.evidence === "D" ? tokens.semantic.color.status.success.text.value : tokens.semantic.color.status.warning.text.value,
              })}
            />
          </Tooltip>
        </Stack>
        <Typography variant="h6">{a.title}</Typography>
        <DetailRow label="Moment">{a.moment}</DetailRow>
        <DetailRow label="What they want">{a.want}</DetailRow>
        {a.prompt && (
          <Stack gap="4px">
            <Typography variant="labelXs" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
              {isSummary ? "Asked in AGAI" : "Asked as"}
              {a.entry ? ` · ${a.entry}` : ""}
            </Typography>
            <Box
              sx={({ tokens }) => ({
                alignSelf: "flex-start",
                px: tokens.semantic.spacing.desktop.padding["2"].value,
                py: tokens.semantic.spacing.desktop.padding["1_5"].value,
                borderRadius: tokens.semantic.radius.lg.value,
                bgcolor: tokens.semantic.color.surface.variant.value,
              })}
            >
              <Typography variant="textMd">“{a.prompt}”</Typography>
            </Box>
          </Stack>
        )}
        {a.contextAdds && <DetailRow label="What whole-book context adds">{a.contextAdds}</DetailRow>}
        {a.note && <DetailRow label="Why it's not a summary touchpoint">{a.note}</DetailRow>}
        <DetailRow label={a.evidence === "D" ? "Evidence" : "Basis"}>{a.evidenceNote}</DetailRow>
      </Stack>
    </Box>
  );
}

function DetailSheet({ selection, onClose, onSelect }: { selection: Selection; onClose: () => void; onSelect: (s: Selection) => void }) {
  let title = "";
  let subtitle = "";
  let body: React.ReactNode = null;

  if (selection?.type === "cell") {
    const persona = PERSONAS.find((p) => p.id === selection.persona)!;
    const phase = PHASES.find((p) => p.id === selection.phase)!;
    const items = JOURNEY[selection.persona][selection.phase];
    const sorted = [...items].sort((a, b) => Number(b.kind === "summary") - Number(a.kind === "summary"));
    title = `${persona.name} · ${phase.name}`;
    subtitle = `${phase.timing}. ${countSummary(items)} summary touchpoint${countSummary(items) === 1 ? "" : "s"}.`;
    body = sorted.length ? (
      sorted.map((a) => <ActivityCard key={a.id} a={a} />)
    ) : (
      <Typography variant="textMd">Nothing in this phase for this persona.</Typography>
    );
  }

  if (selection?.type === "phase") {
    const phase = PHASES.find((p) => p.id === selection.phase)!;
    const touch = PERSONAS.flatMap((p) =>
      JOURNEY[p.id][phase.id].filter((a) => a.kind === "summary").map((a) => ({ a, persona: p.name })),
    );
    title = phase.name;
    subtitle = `${phase.timing}. ${touch.length} summary touchpoint${touch.length === 1 ? "" : "s"} across personas.`;
    body = (
      <>
        <Typography variant="textMd">{phase.description}</Typography>
        {touch.length ? (
          touch.map(({ a, persona }) => <ActivityCard key={a.id} a={a} showContext={persona} />)
        ) : (
          <Typography variant="textMd" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
            No summary touchpoints. In the meeting, people need search with an exact citation, not a summary.
          </Typography>
        )}
      </>
    );
  }

  if (selection?.type === "persona") {
    const persona = PERSONAS.find((p) => p.id === selection.persona)!;
    title = persona.name;
    subtitle = `${persona.role}. Evidence strength: ${persona.evidenceStrength.toLowerCase()}.`;
    body = PHASES.map((ph) => {
      const items = JOURNEY[persona.id][ph.id].filter((a) => a.kind === "summary");
      return (
        <Stack key={ph.id} gap="8px">
          <ButtonBase
            onClick={() => onSelect({ type: "cell", persona: persona.id, phase: ph.id })}
            sx={({ tokens }) => ({
              justifyContent: "space-between",
              borderRadius: tokens.semantic.radius.md.value,
              p: tokens.semantic.spacing.desktop.padding["1"].value,
              "&:hover": { bgcolor: tokens.semantic.color.action.secondary.hover.value },
              "&:focus-visible": { outline: `2px solid ${tokens.semantic.color.ui.focusRing.value}` },
            })}
          >
            <Typography variant="labelLg">{ph.name}</Typography>
            <Stack direction="row" alignItems="center" gap="4px">
              <Typography variant="textSm">{items.length ? `${items.length} summary` : "None"}</Typography>
              <CaretRightIcon size="sm" aria-hidden />
            </Stack>
          </ButtonBase>
          {items.map((a) => (
            <Stack key={a.id} direction="row" alignItems="flex-start" gap="8px" sx={{ pl: "8px" }}>
              <Box sx={{ pt: "2px" }}>
                <AiSparkleIcon size="sm" aria-hidden />
              </Box>
              <Stack>
                <Typography variant="textMd">{a.title}</Typography>
                <Typography variant="textSm" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
                  “{a.prompt}”
                </Typography>
              </Stack>
            </Stack>
          ))}
          <Divider />
        </Stack>
      );
    });
  }

  return (
    <Drawer
      anchor="right"
      open={selection !== null}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: "100%", sm: 460 } } } }}
    >
      <Stack sx={({ tokens }) => ({ height: "100%", bgcolor: tokens.semantic.color.background.base.value })}>
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          sx={({ tokens }) => ({
            p: tokens.semantic.spacing.desktop.padding["3"].value,
            borderBottom: `1px solid ${tokens.semantic.color.ui.divider.default.value}`,
          })}
        >
          <Stack gap="4px">
            <Typography variant="h5" component="h2">
              {title}
            </Typography>
            <Typography variant="textSm" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
              {subtitle}
            </Typography>
          </Stack>
          <IconButton aria-label="Close details" onClick={onClose}>
            <CloseIcon size="md" aria-hidden />
          </IconButton>
        </Stack>
        <Stack
          sx={({ tokens }) => ({
            p: tokens.semantic.spacing.desktop.padding["3"].value,
            gap: tokens.semantic.spacing.desktop.gap["3"].value,
            overflowY: "auto",
          })}
        >
          {body}
        </Stack>
      </Stack>
    </Drawer>
  );
}

// ─── Map ──────────────────────────────────────────────────────────────────────

function heat(count: number) {
  if (count === 0) return 0;
  return count / MAX_CELL;
}

// Atlas tokens resolve to CSS variables, so tints are mixed in CSS, not in JS.
const mix = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

/** 0 → nothing, small → light lavender, 1 → lavender with a stronger content tint. */
function heatColor(bg: string, content: string, level: number) {
  if (level <= 0) return "transparent";
  // 1 touchpoint = plain lavender background, max = lavender with 30% content tint.
  const contentPct = Math.round(Math.max(0, (level - 0.5) * 2) * 30);
  return `color-mix(in srgb, ${content} ${contentPct}%, ${bg})`;
}

export default function JourneyMap() {
  const [selection, setSelection] = useState<Selection>(null);
  const [view, setView] = useState<"glance" | "detail">("glance");

  const gridColumns = `${PERSONA_COL}px repeat(${PHASES.length}, minmax(${PHASE_COL_MIN}px, 1fr))`;
  const maxPhase = Math.max(...PHASES.map((p) => phaseTotal(p.id)));
  const maxPersona = Math.max(...PERSONAS.map((p) => personaTotal(p.id)));

  const focusRing = (c: string) => ({ "&:focus-visible": { outline: `2px solid ${c}`, outlineOffset: "2px" } });

  return (
    <Stack sx={({ tokens }) => ({ gap: tokens.semantic.spacing.desktop.gap["3"].value })}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        sx={({ tokens }) => ({ gap: tokens.semantic.spacing.desktop.gap["2"].value })}
      >
        <Legend />
        <ToggleButtonGroup
          size="small"
          exclusive
          value={view}
          onChange={(_, v) => v && setView(v)}
          aria-label="Map density"
        >
          <ToggleButton value="glance">At a glance</ToggleButton>
          <ToggleButton value="detail">Show activities</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Box
        sx={({ tokens }) => ({
          overflowX: "auto",
          borderRadius: tokens.semantic.radius.lg.value,
          border: `1px solid ${tokens.semantic.color.ui.divider.default.value}`,
          bgcolor: tokens.semantic.color.surface.default.value,
        })}
      >
        <Box
          role="grid"
          aria-label="Board meeting cycle journey map"
          sx={{ display: "grid", gridTemplateColumns: gridColumns, minWidth: PERSONA_COL + PHASES.length * PHASE_COL_MIN }}
        >
          {/* Header row */}
          <Box
            role="columnheader"
            sx={({ tokens }) => ({
              p: tokens.semantic.spacing.desktop.padding["2"].value,
              position: "sticky",
              left: 0,
              zIndex: 2,
              bgcolor: tokens.semantic.color.surface.subtle.value,
              borderBottom: `1px solid ${tokens.semantic.color.ui.divider.default.value}`,
              borderRight: `1px solid ${tokens.semantic.color.ui.divider.default.value}`,
              display: "flex",
              alignItems: "flex-end",
            })}
          >
            <Typography variant="labelSm" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
              Persona / phase
            </Typography>
          </Box>
          {PHASES.map((ph, i) => {
            const total = phaseTotal(ph.id);
            return (
              <Box key={ph.id} role="columnheader" sx={{ display: "flex" }}>
              <ButtonBase
                onClick={() => setSelection({ type: "phase", phase: ph.id })}
                aria-label={`${ph.name}, ${total} summary touchpoints. Open phase details.`}
                sx={({ tokens }) => ({
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  justifyContent: "flex-start",
                  textAlign: "left",
                  gap: "6px",
                  p: tokens.semantic.spacing.desktop.padding["2"].value,
                  bgcolor: ph.isGenerationPoint ? tokens.semantic.color.accent.blue.background.value : tokens.semantic.color.surface.subtle.value,
                  borderBottom: `1px solid ${tokens.semantic.color.ui.divider.default.value}`,
                  borderRight: i < PHASES.length - 1 ? `1px solid ${tokens.semantic.color.ui.divider.default.value}` : "none",
                  "&:hover": { bgcolor: tokens.semantic.color.action.secondary.hover.value },
                  ...focusRing(tokens.semantic.color.ui.focusRing.value),
                })}
              >
                <Typography variant="labelXs" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
                  {i + 1} · {ph.timing}
                </Typography>
                <Stack direction="row" alignItems="center" justifyContent="space-between" gap="4px">
                  <Typography variant="labelLg">{ph.name}</Typography>
                  <CaretRightIcon size="sm" aria-hidden />
                </Stack>
                {/* Phase total bar */}
                <Stack direction="row" alignItems="center" gap="6px">
                  <Box
                    sx={({ tokens }) => ({
                      flex: 1,
                      height: 6,
                      borderRadius: tokens.semantic.radius.full.value,
                      bgcolor: tokens.semantic.color.surface.variant.value,
                      overflow: "hidden",
                    })}
                  >
                    <Box
                      sx={({ tokens }) => ({
                        width: `${maxPhase ? (total / maxPhase) * 100 : 0}%`,
                        height: "100%",
                        background: tokens.semantic.gradients.ai.defaultHorizontal.value,
                      })}
                    />
                  </Box>
                  <Typography variant="labelSm">{total}</Typography>
                </Stack>
                {ph.isGenerationPoint && (
                  <Stack direction="row" alignItems="center" gap="4px">
                    <BookPublishIcon size="sm" aria-hidden />
                    <Typography variant="labelXs" sx={({ tokens }) => ({ color: tokens.semantic.color.accent.blue.content.value })}>
                      Book context generated here
                    </Typography>
                  </Stack>
                )}
              </ButtonBase>
              </Box>
            );
          })}

          {/* Persona rows */}
          {PERSONAS.map((p, rowIndex) => {
            const total = personaTotal(p.id);
            const isLast = rowIndex === PERSONAS.length - 1;
            return [
              <Box
                key={`${p.id}-label`}
                role="rowheader"
                sx={({ tokens }) => ({
                  position: "sticky",
                  left: 0,
                  zIndex: 1,
                  display: "flex",
                  bgcolor: tokens.semantic.color.surface.default.value,
                  borderRight: `1px solid ${tokens.semantic.color.ui.divider.default.value}`,
                  borderBottom: isLast ? "none" : `1px solid ${tokens.semantic.color.ui.divider.default.value}`,
                })}
              >
              <ButtonBase
                onClick={() => setSelection({ type: "persona", persona: p.id })}
                aria-label={`${p.name}, ${total} summary touchpoints. Open persona journey.`}
                sx={({ tokens }) => ({
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  justifyContent: "flex-start",
                  textAlign: "left",
                  gap: "6px",
                  p: tokens.semantic.spacing.desktop.padding["2"].value,
                  "&:hover": { bgcolor: tokens.semantic.color.action.secondary.hover.value },
                  ...focusRing(tokens.semantic.color.ui.focusRing.value),
                })}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="labelLg">{p.name}</Typography>
                  <CaretRightIcon size="sm" aria-hidden />
                </Stack>
                <Stack direction="row" alignItems="center" gap="6px">
                  <Box
                    sx={({ tokens }) => ({
                      flex: 1,
                      height: 6,
                      borderRadius: tokens.semantic.radius.full.value,
                      bgcolor: tokens.semantic.color.surface.variant.value,
                      overflow: "hidden",
                    })}
                  >
                    <Box
                      sx={({ tokens }) => ({
                        width: `${maxPersona ? (total / maxPersona) * 100 : 0}%`,
                        height: "100%",
                        background: tokens.semantic.gradients.ai.defaultHorizontal.value,
                      })}
                    />
                  </Box>
                  <Typography variant="labelSm">{total}</Typography>
                </Stack>
                {p.evidenceStrength === "Thin" && (
                  <Typography variant="labelXs" sx={({ tokens }) => ({ color: tokens.semantic.color.status.warning.text.value })}>
                    Thin evidence
                  </Typography>
                )}
              </ButtonBase>
              </Box>,
              ...PHASES.map((ph, colIndex) => {
                const items = JOURNEY[p.id][ph.id];
                const s = countSummary(items);
                const others = items.filter((a) => a.kind !== "summary");
                const isEmpty = items.length === 0;
                const borders = (divider: string) => ({
                  borderRight: colIndex < PHASES.length - 1 ? `1px solid ${divider}` : "none",
                  borderBottom: isLast ? "none" : `1px solid ${divider}`,
                });
                if (isEmpty) {
                  return (
                    <Box
                      key={`${p.id}-${ph.id}`}
                      role="gridcell"
                      sx={({ tokens }) => ({
                        ...borders(tokens.semantic.color.ui.divider.default.value),
                        p: tokens.semantic.spacing.desktop.padding["2"].value,
                      })}
                    >
                      <Typography variant="textSm" sx={({ tokens }) => ({ color: tokens.semantic.color.type.disabled.value })}>
                        —
                      </Typography>
                    </Box>
                  );
                }
                return (
                  <Box
                    key={`${p.id}-${ph.id}`}
                    role="gridcell"
                    sx={({ tokens }) => ({
                      ...borders(tokens.semantic.color.ui.divider.default.value),
                      p: tokens.semantic.spacing.desktop.padding["1"].value,
                      display: "flex",
                    })}
                  >
                    <ButtonBase
                      onClick={() => setSelection({ type: "cell", persona: p.id, phase: ph.id })}
                      aria-label={`${p.name} in ${ph.name}: ${s} summary touchpoints, ${others.length} other activities. Open details.`}
                      sx={({ tokens }) => ({
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "stretch",
                        justifyContent: "flex-start",
                        textAlign: "left",
                        gap: "8px",
                        p: tokens.semantic.spacing.desktop.padding["1_5"].value,
                        borderRadius: tokens.semantic.radius.md.value,
                        border: `1px solid ${s ? mix(tokens.semantic.color.accent.lavender.content.value, 25) : tokens.semantic.color.ui.divider.default.value}`,
                        bgcolor: s
                          ? heatColor(tokens.semantic.color.accent.lavender.background.value, tokens.semantic.color.accent.lavender.content.value, heat(s))
                          : tokens.semantic.color.surface.default.value,
                        transition: "box-shadow 120ms, border-color 120ms",
                        "&:hover": {
                          borderColor: tokens.semantic.color.outline.hover.value,
                          boxShadow: tokens.semantic.shadow.low.value.stringValue,
                        },
                        ...focusRing(tokens.semantic.color.ui.focusRing.value),
                      })}
                    >
                      {s > 0 ? (
                        <Stack direction="row" alignItems="center" gap="6px">
                          <AiSparkleIcon size="md" aria-hidden />
                          <Typography variant="numberMd" sx={({ tokens }) => ({ color: tokens.semantic.color.accent.lavender.content.value })}>
                            {s}
                          </Typography>
                          <Typography variant="textSm" sx={({ tokens }) => ({ color: tokens.semantic.color.accent.lavender.content.value })}>
                            summary
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography variant="textSm" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
                          No summary
                        </Typography>
                      )}
                      {view === "glance" ? (
                        others.length > 0 && (
                          <Stack direction="row" alignItems="center" gap="4px" flexWrap="wrap">
                            {others.map((o) => (
                              <KindMarker key={o.id} kind={o.kind} />
                            ))}
                            <Typography variant="textSm" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
                              {others.length} other
                            </Typography>
                          </Stack>
                        )
                      ) : (
                        <Stack gap="6px">
                          {[...items]
                            .sort((a, b) => Number(b.kind === "summary") - Number(a.kind === "summary"))
                            .map((a) => (
                              <Stack key={a.id} direction="row" alignItems="flex-start" gap="6px">
                                <Box sx={{ pt: "2px", display: "flex" }}>
                                  <KindMarker kind={a.kind} />
                                </Box>
                                <Typography
                                  variant="textSm"
                                  sx={({ tokens }) => ({
                                    color: a.kind === "summary" ? tokens.semantic.color.type.default.value : tokens.semantic.color.type.muted.value,
                                  })}
                                >
                                  {a.title}
                                </Typography>
                              </Stack>
                            ))}
                        </Stack>
                      )}
                    </ButtonBase>
                  </Box>
                );
              }),
            ];
          })}
        </Box>
      </Box>

      <Typography variant="textSm" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
        Select a phase, a persona or a cell to see the use cases, the prompt in AGAI and the evidence behind it.
      </Typography>

      <DetailSheet selection={selection} onClose={() => setSelection(null)} onSelect={setSelection} />
    </Stack>
  );
}
