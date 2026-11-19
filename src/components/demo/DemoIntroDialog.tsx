import { useState } from "react";
import { useLocation } from "react-router";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography, useTheme } from "@mui/material";
import { DEMO_INTRO_1, DEMO_START_PATH } from "../../data/demo-agai-integration-usecases.js";
import { WS_DEMO_INTRO_1, WS_DEMO_START_PATH } from "../../data/demo-web-search.js";

// Persona intro shown over the director home page. Open state lives in this
// component, so it only reappears on a full page load: "Restart proto" resets
// the chat without remounting the app and never brings it back.
export default function DemoIntroDialog() {
  const { tokens: { semantic: { color, radius }, core: { spacing } } } = useTheme();
  const { pathname } = useLocation();
  const isWs = pathname === WS_DEMO_START_PATH;
  const [open, setOpen] = useState(isWs || pathname === DEMO_START_PATH);
  const intro = isWs ? WS_DEMO_INTRO_1 : DEMO_INTRO_1;

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      aria-labelledby="demo-intro-title"
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: "rgba(255, 255, 255, 0.6)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          },
        },
        paper: {
          sx: { width: 560, maxWidth: "calc(100% - 32px)", borderRadius: radius.lg.value },
        },
      }}
    >
      <DialogTitle id="demo-intro-title">{isWs ? `Meet ${intro.name.split(" ")[0]}` : "Meet Janice"}</DialogTitle>
      <DialogContent>
        <Stack gap={spacing["2"].value}>
          <Stack direction="row" alignItems="center" gap={spacing["2"].value}>
            {!isWs && (
              <Box
                component="img"
                src="/janice-whitfield.png"
                alt=""
                sx={{ width: 72, height: 72, borderRadius: radius.md.value, objectFit: "cover", flexShrink: 0 }}
              />
            )}
            <Stack>
              <Typography variant="h3" component="h2">
                {intro.name}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: color.type.default.value }}>
                {intro.role}
              </Typography>
            </Stack>
          </Stack>
          <Box component="ul" sx={{ m: 0, pl: "20px", display: "flex", flexDirection: "column", gap: spacing["1"].value }}>
            {intro.bullets.map((b) => (
              <Typography key={b} component="li" variant="body1" sx={{ color: color.type.default.value }}>
                {b}
              </Typography>
            ))}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={() => setOpen(false)} autoFocus>
          Get started
        </Button>
      </DialogActions>
    </Dialog>
  );
}
