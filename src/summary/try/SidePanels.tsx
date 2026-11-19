import { Box, Button, Chip, Divider, FormControlLabel, Stack, Switch, Typography } from "@mui/material";
import BookIcon from "@diligentcorp/atlas-react-bundle/icons/Book";
import DocumentIcon from "@diligentcorp/atlas-react-bundle/icons/Document";
import LockedIcon from "@diligentcorp/atlas-react-bundle/icons/Locked";
import AiSparkleIcon from "@diligentcorp/atlas-react-bundle/icons/AiSparkle";
import CheckedCircleIcon from "@diligentcorp/atlas-react-bundle/icons/CheckedCircle";
import { BOOK, DOCS, LAYERS, type LayerId } from "./scenarios.js";

// ─── Book pane (shown when AGAI is opened from the book) ─────────────────────

export function BookPane({
  onAskBook,
  onAskDoc,
}: {
  onAskBook: () => void;
  onAskDoc: (docId: string) => void;
}) {
  return (
    <Stack
      component="aside"
      aria-label="Board book"
      sx={({ tokens }) => ({
        width: 300,
        flexShrink: 0,
        borderRight: `1px solid ${tokens.semantic.color.ui.divider.default.value}`,
        backgroundColor: tokens.semantic.color.surface.default.value,
        p: tokens.semantic.spacing.desktop.padding["3"].value,
        gap: tokens.semantic.spacing.desktop.gap["3"].value,
        overflowY: "auto",
      })}
    >
      <Stack sx={({ tokens }) => ({ gap: tokens.semantic.spacing.desktop.gap["0_5"].value })}>
        <Stack direction="row" sx={({ tokens }) => ({ alignItems: "center", gap: tokens.semantic.spacing.desktop.gap["1"].value })}>
          <BookIcon size="md" aria-hidden />
          <Typography variant="labelLg" component="h2">
            {BOOK.title}
          </Typography>
        </Stack>
        <Typography variant="textSm" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
          Meeting {BOOK.meetingDate} · published {BOOK.publishedAt}
        </Typography>
      </Stack>

      <Button variant="contained" color="primary" startIcon={<AiSparkleIcon size="md" aria-hidden />} onClick={onAskBook}>
        Ask about this book
      </Button>

      <Stack
        direction="row"
        sx={({ tokens }) => ({
          alignItems: "center",
          gap: tokens.semantic.spacing.desktop.gap["1"].value,
          p: tokens.semantic.spacing.desktop.padding["2"].value,
          borderRadius: tokens.semantic.radius.md.value,
          backgroundColor: tokens.semantic.color.status.success.background.value,
          color: tokens.semantic.color.status.success.text.value,
        })}
      >
        <CheckedCircleIcon size="md" aria-hidden />
        <Typography variant="textSm">Book summary ready for AGAI</Typography>
      </Stack>

      <Divider />

      <Typography variant="labelSm" component="h3" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
        Documents
      </Typography>
      <Stack component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
        {DOCS.map((d) => (
          <Box
            component="li"
            key={d.id}
            sx={({ tokens }) => ({
              display: "flex",
              alignItems: "center",
              gap: tokens.semantic.spacing.desktop.gap["1"].value,
              py: tokens.semantic.spacing.desktop.padding["1_5"].value,
              borderBottom: `1px solid ${tokens.semantic.color.ui.divider.default.value}`,
              color: d.restricted ? tokens.semantic.color.type.muted.value : tokens.semantic.color.type.default.value,
            })}
          >
            {d.restricted ? <LockedIcon size="md" aria-hidden /> : <DocumentIcon size="md" aria-hidden />}
            <Stack sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="textSm">{d.title}</Typography>
              <Typography variant="textSm" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
                {d.restricted ? "You don't have access" : `${d.pages} pages`}
              </Typography>
            </Stack>
            {d.id === "ceo" && (
              <Button size="small" variant="text" onClick={() => onAskDoc(d.id)}>
                Ask
              </Button>
            )}
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}

// ─── "How it works" panel ────────────────────────────────────────────────────

const ORDER: LayerId[] = ["map", "notes", "synthesis", "index"];

export function HowItWorksPanel({
  activeLayers,
  stale,
  onStaleChange,
}: {
  activeLayers: LayerId[];
  stale: boolean;
  onStaleChange: (v: boolean) => void;
}) {
  return (
    <Stack
      component="aside"
      aria-label="How it works"
      sx={({ tokens }) => ({
        width: 340,
        flexShrink: 0,
        borderLeft: `1px solid ${tokens.semantic.color.ui.divider.default.value}`,
        backgroundColor: tokens.semantic.color.surface.subtle.value,
        p: tokens.semantic.spacing.desktop.padding["3"].value,
        gap: tokens.semantic.spacing.desktop.gap["3"].value,
        overflowY: "auto",
      })}
    >
      <Stack sx={({ tokens }) => ({ gap: tokens.semantic.spacing.desktop.gap["0_5"].value })}>
        <Typography variant="labelLg" component="h2">
          Book context layer
        </Typography>
        <Typography variant="textSm" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
          Generated once, when the book is published. Every answer reads from it. Highlighted parts were used in the latest answer.
        </Typography>
      </Stack>

      <Stack component="ol" sx={({ tokens }) => ({ listStyle: "none", m: 0, p: 0, gap: tokens.semantic.spacing.desktop.gap["1"].value })}>
        {ORDER.map((id, i) => {
          const active = activeLayers.includes(id);
          const l = LAYERS[id];
          return (
            <Box
              component="li"
              key={id}
              sx={({ tokens }) => ({
                p: tokens.semantic.spacing.desktop.padding["2"].value,
                borderRadius: tokens.semantic.radius.md.value,
                border: `1px solid ${active ? tokens.semantic.color.selection.primary.selectionIndicator.value : tokens.semantic.color.ui.divider.default.value}`,
                backgroundColor: active ? tokens.semantic.color.selection.primary.default.value : tokens.semantic.color.surface.default.value,
                transition: "background-color 200ms, border-color 200ms",
              })}
            >
              <Stack direction="row" sx={({ tokens }) => ({ alignItems: "center", gap: tokens.semantic.spacing.desktop.gap["1"].value })}>
                <Typography variant="labelSm" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
                  {i + 1}
                </Typography>
                <Typography variant="labelSm" sx={{ flex: 1 }}>
                  {l.title}
                </Typography>
                {active && <Chip size="small" label="Used" color="primary" />}
              </Stack>
              <Typography component="p" variant="textSm" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value, mt: tokens.semantic.spacing.desktop.gap["0_5"].value })}>
                {l.when}
              </Typography>
              <Typography component="p" variant="textSm" sx={({ tokens }) => ({ mt: tokens.semantic.spacing.desktop.gap["0_5"].value })}>
                {l.what}
              </Typography>
            </Box>
          );
        })}
      </Stack>

      <Divider />

      <Stack sx={({ tokens }) => ({ gap: tokens.semantic.spacing.desktop.gap["1"].value })}>
        <Typography variant="labelSm" component="h3">
          Demo controls
        </Typography>
        <FormControlLabel
          control={<Switch checked={stale} onChange={(e) => onStaleChange(e.target.checked)} />}
          label={<Typography variant="textSm">Book changed after publish</Typography>}
        />
        <Typography variant="textSm" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
          Turn this on, then ask about the book. AGAI says the summary may be out of date and offers to refresh it.
        </Typography>
      </Stack>
    </Stack>
  );
}
