import { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Link,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import CloseIcon from "@diligentcorp/atlas-react-bundle/icons/Close";
import LanguageIcon from "@diligentcorp/atlas-react-bundle/icons/Language";

// First-use disclosure: shown the first time a user turns on web search (from
// the in-chat offer or the Tools menu). Sets the boundary of internet use before
// anything is searched. Wording is a draft for UX writing and Legal review.

const POINTS = [
  "Your board materials, conversations and confidential details stay in Diligent.",
  "Powered by Amazon Web Services (Amazon Bedrock AgentCore web search) — results come from the public web.",
  "Web sources are marked separately, you can check them in each response's reasoning steps.",
  "Pages needing sign-in or a subscription aren't available.",
  "Web content isn't verified by Diligent and may contain inaccuracies.",
  "Deleting a chat removes its web search history too.",
];

const TOOLS_MENU_POINT = "Turn off web search anytime in Tools or the message box's globe chip.";

export default function WebSearchDisclosureDialog({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: (dontShowAgain: boolean) => void;
  onCancel: (dontShowAgain: boolean) => void;
}) {
  const { tokens: { semantic: { color } } } = useTheme();
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const closeWithCancel = () => onCancel(dontShowAgain);

  return (
    <Dialog
      open={open}
      onClose={closeWithCancel}
      aria-labelledby="web-search-disclosure-title"
      aria-describedby="web-search-disclosure-description"
      sx={{ zIndex: 1500 }}
    >
      <DialogTitle component="div">
        <h2 id="web-search-disclosure-title">Search the web</h2>
        <p>Ask GovernAI can search public websites when your board materials don't have the answer.</p>
        <IconButton aria-label="Close" onClick={closeWithCancel} color="inherit" size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack gap="16px" id="web-search-disclosure-description">
          <Stack component="ul" gap="10px" sx={{ m: 0, p: 0, listStyle: "none" }}>
            {POINTS.map((point) => (
              <Stack key={point} component="li" direction="row" gap="10px" alignItems="flex-start">
                <Box
                  sx={{
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    bgcolor: color.type.muted.value,
                    mt: "8px",
                    flexShrink: 0,
                  }}
                />
                <Typography sx={{ fontSize: "14px", lineHeight: "20px", color: color.type.default.value }}>
                  {point}
                </Typography>
              </Stack>
            ))}
            <Stack component="li" direction="row" gap="10px" alignItems="flex-start">
              <Box sx={{ color: color.type.muted.value, mt: "2px", display: "flex", flexShrink: 0 }}>
                <LanguageIcon size="md" />
              </Box>
              <Typography sx={{ fontSize: "14px", lineHeight: "20px", color: color.type.default.value }}>
                {TOOLS_MENU_POINT}
              </Typography>
            </Stack>
          </Stack>
          <Link
            href="#"
            onClick={(e) => e.preventDefault()}
            sx={{ fontSize: "14px", lineHeight: "20px", alignSelf: "flex-start" }}
          >
            Learn more about web search in Ask GovernAI
          </Link>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "space-between", gap: "8px" }}>
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
          }
          label={
            // Atlas's own FormControlLabel+Checkbox style forces the root's
            // flex `gap` to 0 (`:has(.MuiCheckbox-root) { gap: 0px; }`), which
            // beats a `gap` set via this component's own sx. Margin on the
            // label itself isn't touched by that rule, so it's used instead.
            <Typography
              sx={({ tokens }) => ({
                fontSize: "13px",
                lineHeight: "16px",
                color: color.type.default.value,
                ml: tokens.semantic.spacing.desktop.gap["0_5"].value,
              })}
            >
              Don't show this again
            </Typography>
          }
          sx={{ mr: 0 }}
        />
        <Stack direction="row" gap="8px" flexShrink={0}>
          <Button variant="outlined" size="small" onClick={closeWithCancel}>
            Cancel
          </Button>
          <Button variant="contained" size="small" onClick={() => onConfirm(dontShowAgain)} autoFocus>
            Turn on web search
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
