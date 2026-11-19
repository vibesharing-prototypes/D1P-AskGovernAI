import { useState } from "react";
import { Box, Button, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import ExternalLinkIcon from "@diligentcorp/atlas-react-bundle/icons/ExternalLink";
import CopyIcon from "@diligentcorp/atlas-react-bundle/icons/Copy";
import type { Source } from "../../data/mockData.js";
import LanguageIcon from "@diligentcorp/atlas-react-bundle/icons/Language";

// Inline web citation. Unlike board-material citations (numbered badge → preview
// panel), a web citation shows the site name with an external-link mark and opens
// the page in a new browser tab. Hover or focus shows a card with the page title,
// site, date and excerpt, plus Open in new tab and Copy link.

function WebCitationCard({ source }: { source: Source }) {
  const { tokens: { semantic: { color } } } = useTheme();
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    if (!source.url) return;
    navigator.clipboard?.writeText(source.url).then(() => setCopied(true)).catch(() => setCopied(false));
  };

  return (
    <Stack gap="6px" sx={{ p: "4px", width: "280px" }}>
      <Stack direction="row" alignItems="center" gap="6px" sx={{ color: color.type.muted.value }}>
        <LanguageIcon size="md" />
        <Typography sx={{ fontSize: "12px", lineHeight: "16px", color: color.type.muted.value }}>
          {source.site}
          {source.published ? ` · ${source.published}` : ""}
        </Typography>
      </Stack>
      <Typography sx={{ fontSize: "13px", lineHeight: "18px", fontWeight: 600, color: color.type.default.value }}>
        {source.title}
      </Typography>
      {source.snippet && (
        <Typography sx={{ fontSize: "13px", lineHeight: "18px", color: color.type.muted.value }}>
          {source.snippet}
        </Typography>
      )}
      <Stack direction="row" gap="4px" sx={{ mt: "2px", ml: "-6px" }}>
        <Button
          variant="text"
          size="small"
          component="a"
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          startIcon={<ExternalLinkIcon size="md" />}
          aria-label={`Open ${source.site} in a new tab`}
        >
          Open in new tab
        </Button>
        <Button variant="text" size="small" startIcon={<CopyIcon size="md" />} onClick={copyLink}>
          {copied ? "Link copied" : "Copy link"}
        </Button>
      </Stack>
    </Stack>
  );
}

export default function WebCitationPill({ source }: { source: Source }) {
  const { tokens: { semantic: { color } } } = useTheme();

  return (
    <Tooltip
      title={<WebCitationCard source={source} />}
      placement="top"
      enterDelay={300}
      leaveDelay={150}
      componentsProps={{
        tooltip: {
          sx: {
            backgroundColor: color.surface.default.value,
            color: color.type.default.value,
            borderRadius: "8px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            border: `1px solid ${color.ui.divider.default.value}`,
            px: "12px",
            py: "10px",
            maxWidth: "none",
          },
        },
      }}
    >
      <Box
        component="a"
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Source: ${source.site}, ${source.title}. Opens in a new tab.`}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: "3px",
          height: "18px",
          px: "6px",
          mx: "2px",
          borderRadius: "9999px",
          backgroundColor: color.action.secondary.variant.value,
          color: color.action.secondary.onSecondary.value,
          fontSize: "11px",
          lineHeight: 1,
          fontWeight: 500,
          letterSpacing: "0.2px",
          verticalAlign: "middle",
          textDecoration: "none",
          whiteSpace: "nowrap",
          transition: "background-color 0.1s ease, box-shadow 0.1s ease",
          "&:hover, &:focus-visible": {
            backgroundColor: color.action.secondary.hoverFill.value,
            boxShadow: `inset 0 0 0 1px ${color.action.secondary.outline.value}`,
          },
          "& svg": { width: "12px", height: "12px", flexShrink: 0 },
        }}
      >
        {source.site}
        <ExternalLinkIcon size="md" />
      </Box>
    </Tooltip>
  );
}
