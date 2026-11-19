import { Chip, Tooltip, useTheme } from "@mui/material";
import LanguageIcon from "@diligentcorp/atlas-react-bundle/icons/Language";

// Composer chip shown while web search is on. Web search stays on across chats
// until the user turns it off, so the state must always be visible here.
export default function WebSearchComposerChip({ enabled, onTurnOff }: { enabled: boolean; onTurnOff: () => void }) {
  const { tokens: { semantic: { color } } } = useTheme();
  if (!enabled) return null;

  return (
    <Tooltip title="Answers can include information from public websites." placement="top">
      <Chip
        variant="outlined"
        size="small"
        icon={<LanguageIcon size="md" />}
        label=""
        onDelete={onTurnOff}
        aria-label="Web search is on. Press Delete to turn it off."
        sx={{
          alignSelf: "center",
          height: 24,
          borderRadius: "9999px",
          borderColor: color.outline.default.value,
          color: color.type.default.value,
          "& .MuiChip-icon": { ml: "6px", color: color.type.default.value },
          // Icon-only chip: the globe carries the meaning, the tooltip and aria-label name it.
          "& .MuiChip-label": { padding: 0, width: 0 },
          "& .MuiChip-deleteIcon": { mr: "4px" },
        }}
      />
    </Tooltip>
  );
}
