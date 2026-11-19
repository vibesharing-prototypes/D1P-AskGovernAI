import { useNavigate } from "react-router";
import { Box, Button, Divider, Stack, Typography, useTheme } from "@mui/material";

import ArrowLeftIcon from "@diligentcorp/atlas-react-bundle/icons/ArrowLeft";

import DirectorHomeSearch from "../DirectorHomeSearch.js";
import { DOCUMENTS } from "../../data/documents.js";

const DOC = DOCUMENTS["ws-draft-10q-wildfire"];
// The risk-factor page itself — the second page of the document.
const RISK_FACTOR_PAGE = DOC.pages[1];

// Web-search demo landing: redresses the plain home hero to read as a book
// opened to the wildfire risk-factor page, so the chat composer sits under
// something the director is actually looking at — not a blank search box.
export default function WsDemoBookRedress() {
  const navigate = useNavigate();
  const {
    tokens: {
      semantic: { color, radius, fontWeight },
    },
  } = useTheme();

  return (
    <Stack sx={{ gap: "24px", pt: "8px" }}>
      <Stack direction="row" alignItems="center" sx={{ gap: "12px" }}>
        <Button
          variant="text"
          size="small"
          startIcon={<ArrowLeftIcon size="md" />}
          onClick={() => navigate("/director/books")}
          sx={{ textTransform: "none", color: color.type.default.value, px: "4px" }}
        >
          Back
        </Button>
        <Divider orientation="vertical" flexItem sx={{ my: "4px" }} />
        <Typography sx={{ fontSize: "14px", fontWeight: fontWeight.emphasis.value, color: color.type.default.value }}>
          {DOC.book}
        </Typography>
        <Divider orientation="vertical" flexItem sx={{ my: "4px" }} />
        <Typography sx={{ fontSize: "14px", color: color.type.muted.value }}>{DOC.title}</Typography>
        <Box sx={{ flex: 1 }} />
        <Typography sx={{ fontSize: "12px", color: color.type.muted.value }}>
          Page {RISK_FACTOR_PAGE.page} of {DOC.pages.length}
        </Typography>
      </Stack>

      <Box
        component="img"
        src={RISK_FACTOR_PAGE.image}
        alt={`${DOC.title} — ${RISK_FACTOR_PAGE.label}`}
        sx={{
          alignSelf: "center",
          width: "382px",
          maxWidth: "100%",
          borderRadius: radius.md.value,
          border: `1px solid ${color.ui.divider.default.value}`,
          boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)",
        }}
      />

      <DirectorHomeSearch />
    </Stack>
  );
}
