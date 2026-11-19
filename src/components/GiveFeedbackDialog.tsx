import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import CloseIcon from "@diligentcorp/atlas-react-bundle/icons/Close";

// Give feedback: sends to the product's feedback pipeline (Amplitude in
// production). This prototype only simulates the send (toast + close).

export const FEEDBACK_FEATURES = [
  "Ask GovernAI",
  "Smart Summary",
  "Smart Prep",
  "Smart Audit",
  "Smart Risk Scanner",
] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface GiveFeedbackDialogProps {
  open: boolean;
  onClose: () => void;
  /** Preselects the feature dropdown and seeds the message, e.g. from an in-chat prompt. */
  defaultFeature?: (typeof FEEDBACK_FEATURES)[number];
  defaultMessage?: string;
}

export default function GiveFeedbackDialog({
  open,
  onClose,
  defaultFeature,
  defaultMessage,
}: GiveFeedbackDialogProps) {
  const { tokens: { semantic: { color, radius } } } = useTheme();

  const [feature, setFeature] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setFeature(defaultFeature ?? "");
      setMessage(defaultMessage ?? "");
      setEmail("");
    }
  }, [open, defaultFeature, defaultMessage]);

  const emailValid = email.trim() === "" || EMAIL_RE.test(email.trim());
  const canSend = feature !== "" && message.trim() !== "" && emailValid;

  const handleSend = () => {
    if (!canSend) return;
    // Prototype: no feedback pipeline wired up yet, so this just confirms to the user.
    setToastOpen(true);
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth={false}
        PaperProps={{ sx: { maxWidth: 440, width: "100%", borderRadius: radius.lg.value } }}
      >
        <Box sx={{ px: "24px", pt: "20px", pb: "4px" }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
            <Typography sx={{ fontSize: "18px", fontWeight: 600, lineHeight: "28px", color: color.type.default.value }}>
              Give feedback
            </Typography>
            <IconButton onClick={onClose} size="small" sx={{ p: "4px", mt: "2px" }} aria-label="Close">
              <CloseIcon size="md" />
            </IconButton>
          </Stack>
        </Box>

        <DialogContent sx={{ px: "24px", pt: "12px", pb: "24px" }}>
          <Stack gap="20px">
            <Box>
              <Typography sx={{ fontSize: "14px", fontWeight: 600, lineHeight: "20px", color: color.type.default.value, mb: "8px" }}>
                Which feature did you use? (Required)
              </Typography>
              <FormControl fullWidth>
                <Select
                  displayEmpty
                  value={feature}
                  onChange={(e) => setFeature(e.target.value)}
                  renderValue={(v) => (v === "" ? <Box component="span" sx={{ color: color.type.muted.value }}>Select...</Box> : (v as string))}
                >
                  {FEEDBACK_FEATURES.map((f) => (
                    <MenuItem key={f} value={f}>{f}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "14px", fontWeight: 600, lineHeight: "20px", color: color.type.default.value, mb: "8px" }}>
                What would you like to see improved? (Required)
              </Typography>
              <TextField
                multiline
                rows={4}
                fullWidth
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe what prompted this feedback"
                variant="outlined"
                inputProps={{ style: { fontSize: "14px" } }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: "14px", fontWeight: 600, lineHeight: "20px", color: color.type.default.value, mb: "8px" }}>
                Add your email for a personal follow-up to your feedback.
              </Typography>
              <TextField
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                variant="outlined"
                error={!emailValid}
                inputProps={{ style: { fontSize: "14px" } }}
              />
            </Box>

            <Stack direction="row" justifyContent="flex-end">
              <Button variant="contained" color="primary" onClick={handleSend} disabled={!canSend}>
                Send
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={toastOpen}
        autoHideDuration={5000}
        onClose={(_e, reason) => {
          if (reason === "clickaway") return;
          setToastOpen(false);
        }}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{ top: "24px !important", right: "24px !important" }}
      >
        <Alert
          severity="success"
          aria-live="polite"
          action={
            <IconButton size="small" aria-label="Dismiss" onClick={() => setToastOpen(false)}>
              <CloseIcon size="md" />
            </IconButton>
          }
          sx={{
            border: `1px solid ${color.outline.default.value}`,
            "&&&&": { boxShadow: "0px 32px 32px rgba(15, 17, 19, 0.10), 0px 0px 2px rgba(15, 17, 19, 0.10)" },
          }}
        >
          Thanks — your feedback was sent.
        </Alert>
      </Snackbar>
    </>
  );
}
