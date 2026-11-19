import { useState } from "react";
import { Box, Checkbox, Chip, FormControlLabel, IconButton, OutlinedInput, Stack, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import { WEB_SOURCE_PACKS } from "../../data/web-search-sources.js";

// Admin picker for web search's source packs, plus the peer-company-filings
// sub-option. One site, one list — this is the only place it's configured;
// there is no per-board variant. Rendered as the content of the "Public
// sources" side sheet, opened from the "Enable web search" checkbox row in
// Organization settings.

interface SourcePacksPickerProps {
  selectedIds: string[];
  onToggle: (id: string) => void;
  peerFilingsEnabled: boolean;
  onTogglePeerFilings: () => void;
  peers: string[];
  onAddPeer: (name: string) => void;
  onRemovePeer: (name: string) => void;
}

export default function SourcePacksPicker({
  selectedIds,
  onToggle,
  peerFilingsEnabled,
  onTogglePeerFilings,
  peers,
  onAddPeer,
  onRemovePeer,
}: SourcePacksPickerProps) {
  const [peerInput, setPeerInput] = useState("");

  const addPeer = () => {
    const name = peerInput.trim();
    if (!name) return;
    onAddPeer(name);
    setPeerInput("");
  };

  return (
    <Stack gap="28px">
      <Box>
        <Typography sx={{ fontSize: 12, color: "#575a67", lineHeight: "16px", mb: "12px" }}>
          Choose the public sources Ask GovernAI can search for this site.
        </Typography>
        <Stack gap="16px">
          {WEB_SOURCE_PACKS.map((pack) => (
            <FormControlLabel
              key={pack.id}
              sx={{ alignItems: "flex-start", ml: 0, gap: "10px" }}
              control={
                <Checkbox
                  checked={selectedIds.includes(pack.id)}
                  onChange={() => onToggle(pack.id)}
                  size="small"
                  sx={{ p: 0, mt: "2px", flexShrink: 0, width: "16px", height: "16px" }}
                />
              }
              label={
                <Box>
                  <Typography sx={{ fontSize: 14, color: "#232429", lineHeight: "20px" }}>{pack.name}</Typography>
                  <Typography sx={{ fontSize: 12, color: "#575a67", lineHeight: "16px" }}>
                    {pack.description} ({pack.domains.join(", ")})
                  </Typography>
                </Box>
              }
            />
          ))}
        </Stack>
      </Box>

      <Box>
        <FormControlLabel
          sx={{ alignItems: "flex-start", ml: 0, gap: "10px" }}
          control={
            <Checkbox
              checked={peerFilingsEnabled}
              onChange={onTogglePeerFilings}
              size="small"
              sx={{ p: 0, mt: "2px", flexShrink: 0, width: "16px", height: "16px" }}
            />
          }
          label={
            <Box>
              <Typography sx={{ fontSize: 14, color: "#232429", lineHeight: "20px" }}>
                Peer company filings
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#575a67", lineHeight: "16px" }}>
                Add the peer companies you want this site's web search to cover.
              </Typography>
            </Box>
          }
        />

        {peerFilingsEnabled && (
          <Box sx={{ pl: "26px", mt: "12px" }}>
            <Stack direction="row" flexWrap="wrap" gap="6px" sx={{ mb: peers.length ? "8px" : 0 }}>
              {peers.map((p) => (
                <Chip
                  key={p}
                  label={p}
                  size="small"
                  onDelete={() => onRemovePeer(p)}
                  deleteIcon={<CloseIcon sx={{ fontSize: 14 }} />}
                  sx={{ fontSize: 12, height: 24 }}
                />
              ))}
            </Stack>
            <OutlinedInput
              fullWidth
              size="small"
              placeholder="Company name, e.g. Pacific Gas and Electric"
              value={peerInput}
              onChange={(e) => setPeerInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addPeer();
                }
              }}
              onBlur={addPeer}
              sx={{ fontSize: 13 }}
              endAdornment={
                peerInput && (
                  <IconButton size="small" onClick={addPeer} aria-label="Add peer company">
                    <AddIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                )
              }
            />
          </Box>
        )}
      </Box>
    </Stack>
  );
}
