import { Box, Button, Stack, Typography, useTheme } from "@mui/material";
import { AIChatThinkingIndicator } from "@diligentcorp/atlas-react-bundle";
import CheckedCircleIcon from "@diligentcorp/atlas-react-bundle/icons/CheckedCircle";
import SearchIcon from "@diligentcorp/atlas-react-bundle/icons/Search";
import DemoReasoning from "../demo/DemoReasoning.js";
import LanguageIcon from "@diligentcorp/atlas-react-bundle/icons/Language";
import AICallout from "./AICallout.js";
import { useSmartAssist } from "../../context/SmartAssistContext.js";
import type { ChatMessage } from "../../data/mockData.js";
import type { ReasoningData, ReasoningStepData } from "../../data/web-search-scenario.js";

// Shared pieces of the web search flow, used by both chat surfaces
// (full overlay and docked panel).

// ─── Reasoning step details ───────────────────────────────────────────────────

function StepDetail({ step }: { step: ReasoningStepData }) {
  const { tokens: { semantic: { color } } } = useTheme();
  const muted = color.type.muted.value;
  return (
    <Stack gap="8px">
      {step.text && <Box component="span">{step.text}</Box>}
      {step.queries && (
        <Stack gap="6px">
          <Typography sx={{ fontSize: "13px", lineHeight: "18px", color: muted }}>Search terms sent</Typography>
          {step.queries.map((q) => (
            <Stack key={q} direction="row" gap="8px" alignItems="center">
              <Box sx={{ color: muted, display: "flex" }}><SearchIcon size="md" /></Box>
              <Box component="span">“{q}”</Box>
            </Stack>
          ))}
        </Stack>
      )}
      {step.pages && (
        <Stack gap="6px">
          {step.pages.map((p) => (
            <Stack key={p.title} direction="row" gap="8px" alignItems="flex-start">
              <Box sx={{ color: muted, display: "flex", mt: "2px" }}><LanguageIcon size="md" /></Box>
              <Box component="span">
                <Box component="span" sx={{ fontWeight: 600 }}>{p.site}</Box>
                {` · ${p.title}`}
              </Box>
            </Stack>
          ))}
        </Stack>
      )}
      {step.note && <Box component="span" sx={{ color: muted }}>{step.note}</Box>}
    </Stack>
  );
}

const toSteps = (r: ReasoningData) => r.steps.map((s) => ({ title: s.title, detail: <StepDetail step={s} /> }));

/** Reasoning kept on an answer as an audit trail (collapsed). */
export function MessageReasoning({ msg }: { msg: ChatMessage }) {
  if (!msg.reasoning) return null;
  return <DemoReasoning steps={toSteps(msg.reasoning)} intro={msg.reasoning.intro} activeIndex={null} />;
}

/** Live reasoning while a scripted web search answer is generating; otherwise the default indicator. */
export function PendingReasoning({ fallbackLabel = "Thinking" }: { fallbackLabel?: string }) {
  const { reasoningPending } = useSmartAssist();
  if (!reasoningPending) return <AIChatThinkingIndicator label={fallbackLabel} />;
  return <DemoReasoning steps={toSteps(reasoningPending)} intro={reasoningPending.intro} activeIndex={reasoningPending.active} />;
}

// ─── Offer card ───────────────────────────────────────────────────────────────

/** In-answer offer to search the web when board materials don't have the answer. */
export function WebSearchOfferCard({ msg }: { msg: ChatMessage }) {
  const { tokens: { semantic: { color } } } = useTheme();
  const { respondToWebOffer, isGenerating, webSearchEnabled } = useSmartAssist();
  if (!msg.webOffer) return null;

  if (msg.webOffer === "accepted") {
    return (
      <Stack role="status" direction="row" gap="8px" alignItems="center" sx={{ mt: "12px", color: color.type.muted.value }}>
        <CheckedCircleIcon size="md" />
        <Typography sx={{ fontSize: "13px", lineHeight: "18px", color: color.type.muted.value }}>
          {webSearchEnabled
            ? "Web search is on. Turn it off at any time from the globe chip or Tools."
            : "Web search was used for the next answer."}
        </Typography>
      </Stack>
    );
  }

  const declined = msg.webOffer === "declined";

  // Atlas AI Callout: tertiary action first, primary last (Figma: Deny · Accept).
  return (
    <AICallout
      aria-label="Search the web"
      aria-live="polite"
      title={declined ? "Web search not used" : (msg.webOfferTitle ?? "Search the web for the SEC rules")}
      actions={
        <>
          {!declined && (
            <Button variant="text" size="xsmall" disabled={isGenerating} onClick={() => respondToWebOffer(msg.id, false)}>
              Not now
            </Button>
          )}
          <Button variant="contained" size="xsmall" disabled={isGenerating} onClick={() => respondToWebOffer(msg.id, true)}>
            Search the web
          </Button>
        </>
      }
    >
      {declined
        ? "This answer uses your board materials only. You can still search the web for the SEC rules."
        : "Only the search terms leave Diligent. Your board materials and this conversation stay private."}
    </AICallout>
  );
}
