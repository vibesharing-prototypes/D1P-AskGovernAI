import { useState } from "react";
import { Box, Button, ClickAwayListener, Paper, Popper, Stack, Typography, useTheme } from "@mui/material";
import { Link as RouterLink } from "react-router";
import LanguageIcon from "@diligentcorp/atlas-react-bundle/icons/Language";
import { WEB_SOURCE_PACKS } from "../../data/web-search-sources.js";
import { useSmartAssist } from "../../context/SmartAssistContext.js";

// Read-only disclosure of what web search can actually reach: the admin's
// source packs plus any named peer companies. One site, one list — directors
// see the same scope admins configured, never a per-board variant.

export default function SourcesInScopeButton({ audience }: { audience: "admin" | "director" }) {
  const { tokens: { semantic: { color } } } = useTheme();
  const { enabledSourcePackIds, customPeers } = useSmartAssist();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const packs = WEB_SOURCE_PACKS.filter((p) => enabledSourcePackIds.includes(p.id));
  const count = packs.length + (customPeers.length ? 1 : 0);

  return (
    <>
      <Button
        variant="text"
        size="xsmall"
        onClick={(e) => { e.stopPropagation(); setAnchor(e.currentTarget); }}
        sx={{ alignSelf: "flex-start", fontSize: "12px", color: color.type.muted.value, textTransform: "none", px: "12px", minHeight: "auto", py: "4px" }}
      >
        Sources in scope ({count})
      </Button>
      <Popper
        open={Boolean(anchor)}
        anchorEl={anchor}
        placement="bottom-start"
        style={{ zIndex: 1400 }}
        modifiers={[{ name: "offset", options: { offset: [0, 4] } }]}
      >
      <ClickAwayListener onClickAway={() => setAnchor(null)}>
      <Paper sx={{ borderRadius: "8px", border: `1px solid ${color.ui.divider.default.value}`, boxShadow: "0 8px 16px rgba(0,0,0,0.1), 0 0 2px rgba(0,0,0,0.08)" }}>
        <Stack gap="10px" sx={{ p: "14px", width: "260px" }}>
          <Typography sx={{ fontSize: "13px", fontWeight: 600, color: color.type.default.value }}>
            Sources in scope
          </Typography>
          {count === 0 ? (
            <Typography sx={{ fontSize: "12px", color: color.type.muted.value }}>
              No public sources are turned on for this site yet.
            </Typography>
          ) : (
            <Stack gap="8px">
              {packs.map((p) => (
                <Box key={p.id}>
                  <Typography sx={{ fontSize: "13px", color: color.type.default.value }}>{p.name}</Typography>
                  <Typography sx={{ fontSize: "11px", color: color.type.muted.value }}>{p.domains.join(", ")}</Typography>
                </Box>
              ))}
              {customPeers.length > 0 && (
                <Box>
                  <Typography sx={{ fontSize: "13px", color: color.type.default.value }}>Peer company filings</Typography>
                  <Typography sx={{ fontSize: "11px", color: color.type.muted.value }}>{customPeers.join(", ")}</Typography>
                </Box>
              )}
            </Stack>
          )}
          <Stack direction="row" alignItems="center" gap="6px" sx={{ color: color.type.muted.value, pt: "4px", borderTop: `1px solid ${color.ui.divider.default.value}` }}>
            <LanguageIcon size="sm" />
            <Typography sx={{ fontSize: "11px", color: color.type.muted.value }}>
              Set for this site by your administrator.
            </Typography>
          </Stack>
          {audience === "admin" && (
            <Button
              component={RouterLink}
              to="/admin/settings"
              variant="text"
              size="xsmall"
              sx={{ alignSelf: "flex-start", fontSize: "12px", px: 0, minWidth: 0 }}
            >
              Manage in Organization settings
            </Button>
          )}
        </Stack>
      </Paper>
      </ClickAwayListener>
      </Popper>
    </>
  );
}
