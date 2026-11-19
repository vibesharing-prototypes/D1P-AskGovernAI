import { Button, IconButton, Stack, Typography, useTheme } from "@mui/material";
import CloseIcon from "@diligentcorp/atlas-react-bundle/icons/Close";

// Composer-attached banner (input accessory), not a card in the message
// stream: fused to the top of the composer, like a file-upload-limit notice.
// Shown after the 2nd web search in a chat; neutral surface, not a severity
// color, since missing a source isn't an error or a warning.
export default function SourceFeedbackBanner({
  onGiveFeedback,
  onDismiss,
  roundedTop = false,
}: {
  onGiveFeedback: () => void;
  onDismiss: () => void;
  /** Rounds the top corners to match a floating composer card (Overlay). */
  roundedTop?: boolean;
}) {
  const { tokens: { semantic: { color } } } = useTheme();

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap="12px"
      sx={{
        px: "16px",
        py: "12px",
        backgroundColor: color.surface.variant.value,
        borderBottom: `1px solid ${color.ui.divider.default.value}`,
        ...(roundedTop ? { borderTopLeftRadius: "12px", borderTopRightRadius: "12px" } : {}),
      }}
    >
      <Typography sx={{ flex: 1, fontSize: "13px", lineHeight: "18px", color: color.type.default.value }}>
        Missing a web source, or have thoughts on the overall experience?
      </Typography>
      <Stack direction="row" alignItems="center" gap="4px" sx={{ flexShrink: 0 }}>
        <Button variant="text" size="xsmall" onClick={onGiveFeedback}>
          Give feedback
        </Button>
        <IconButton size="small" onClick={onDismiss} aria-label="Dismiss">
          <CloseIcon size="md" />
        </IconButton>
      </Stack>
    </Stack>
  );
}
