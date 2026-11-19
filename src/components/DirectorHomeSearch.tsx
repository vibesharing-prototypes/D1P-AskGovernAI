import { useCallback, useRef, useState } from "react";
import { Box, Button, Chip, IconButton, Menu, MenuItem, MenuList, Paper, Popper, Stack, Switch, Tooltip, Typography, useTheme } from "@mui/material";

import { AIChatBox } from "@diligentcorp/atlas-react-bundle";
import CaretDownIcon from "@diligentcorp/atlas-react-bundle/icons/CaretDown";
import AuditAnalyticsIcon from "@diligentcorp/atlas-react-bundle/icons/AuditAnalytics";
import RiskEssentialsIcon from "@diligentcorp/atlas-react-bundle/icons/RiskEssentials";
import LockedIcon from "@diligentcorp/atlas-react-bundle/icons/Locked";
import StrategyIcon from "@diligentcorp/atlas-react-bundle/icons/Strategy";
import BriefcaseIcon from "@diligentcorp/atlas-react-bundle/icons/Briefcase";
import ReportsIcon from "@diligentcorp/atlas-react-bundle/icons/Reports";
import TargetIcon from "@diligentcorp/atlas-react-bundle/icons/Target";

import SuggestionChips from "./SuggestionChips.js";
import {
  ChatMicrophoneIcon,
  ExtendedThinkingIcon,
  ToolsSliderIcon,
  UploadFileIcon,
} from "./SmartAssistOverlay.js";
import { useSmartAssist } from "../context/SmartAssistContext.js";

// ─── Tools menu data — same catalog as the overlay/panel Tools menus ──────────
const EXPERT_SKILLS: { id: string; label: string; desc: string; slash: string; Icon: React.ElementType }[] = [
  { id: "audit",    label: "Audit & financial", desc: "Financial reporting, controls, the auditor",     slash: "/audit",    Icon: AuditAnalyticsIcon },
  { id: "risk",     label: "Enterprise risk",   desc: "Strategic & operational risk, concentrations",   slash: "/risk",     Icon: RiskEssentialsIcon },
  { id: "cyber",    label: "Cyber & privacy",   desc: "Security, data protection, third parties",       slash: "/cyber",    Icon: LockedIcon },
  { id: "strategy", label: "Strategy",          desc: "Board-level strategy & execution",               slash: "/strategy", Icon: StrategyIcon },
];

const AGENT_REPORTING: { id: string; label: string; tag: string; desc: string; Icon: React.ElementType }[] = [
  { id: "brief",         label: "Summarize & brief",  tag: "@briefcase",      desc: "Quick research synthesized into a board-ready brief.",           Icon: BriefcaseIcon },
  { id: "diligence",     label: "Due diligence",      tag: "@diligence",      desc: "Multi-area research with risk assessment and executive summary.", Icon: ReportsIcon },
  { id: "followthrough", label: "Track commitments",  tag: "@follow-through", desc: "Tracks who owns what and what's overdue.",                        Icon: TargetIcon },
];

const MENU_PAPER_SX = { minWidth: 224, borderRadius: "8px", border: "1px solid #DEE0E9", boxShadow: "0 8px 16px rgba(0,0,0,0.1), 0 0 2px rgba(0,0,0,0.08)", overflow: "visible" };

// ─── Component ────────────────────────────────────────────────────────────────
// Centered home hero: the Smart Assist composer lifted out of the right rail
// and dropped into the main content area, above the Overview/Explore tabs.
// Not sticky — it scrolls with the page. Composer caps at 700px, width 100%.

export default function DirectorHomeSearch() {
  const {
    tokens: {
      semantic: { color, font, fontWeight, borderWidth },
      component: { aiChatBox },
    },
  } = useTheme();
  const {
    handleSend,
    openSmartAssist,
    demoMode,
    wsDemoMode,
    activeDemoSteps,
    demoStepsDone,
    prompt,
    setPrompt,
    cycleComposerPrompt,
    webSearchEnabled,
    turnOnWebSearch,
    turnOffWebSearch,
  } = useSmartAssist();

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  // The composer wrapper element, used to anchor the suggestion dropdown above
  // it. Stored in state (callback ref) so the dropdown re-renders once mounted.
  const [composerAnchor, setComposerAnchor] = useState<HTMLDivElement | null>(null);
  const [extendedThinking, setExtendedThinking] = useState(false);
  // Same "Search the web" toggle already wired in the overlay/panel Tools
  // menus (turnOnWebSearch/turnOffWebSearch) — just exposed here too, since
  // this composer is where the first message of a chat actually gets sent.
  const [toolsMenuAnchor, setToolsMenuAnchor] = useState<HTMLElement | null>(null);
  const [expertSkillsAnchor, setExpertSkillsAnchor] = useState<HTMLElement | null>(null);
  const [agentReportingAnchor, setAgentReportingAnchor] = useState<HTMLElement | null>(null);
  const [activeExpertSkill, setActiveExpertSkill] = useState<string | null>(null);
  const [activeAgentMode, setActiveAgentMode] = useState<string | null>(null);
  const submenuDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeToolsMenus = () => {
    if (submenuDelayRef.current) clearTimeout(submenuDelayRef.current);
    setToolsMenuAnchor(null);
    setExpertSkillsAnchor(null);
    setAgentReportingAnchor(null);
  };
  const activeToolsItem = expertSkillsAnchor ? "expert" : agentReportingAnchor ? "agent" : null;
  const activeExpertSkillData = activeExpertSkill ? (EXPERT_SKILLS.find((s) => s.id === activeExpertSkill) ?? null) : null;
  const activeAgentModeData = activeAgentMode ? (AGENT_REPORTING.find((a) => a.id === activeAgentMode) ?? null) : null;

  // Drop a starter prompt in and focus the composer so the cursor blinks and
  // the user can immediately edit the pasted template.
  const fillAndFocus = (text: string) => {
    setPrompt(text);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      // Caret at the end so the user can keep typing from where the template ends.
      el.setSelectionRange(text.length, text.length);
    });
  };

  // Focus the composer without changing its draft — used when a chip opens its
  // suggestion dropdown (nothing is pasted until the user picks a prompt).
  const focusComposer = () => {
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    });
  };

  // Always a fresh entry point — start a new session regardless of what was
  // open before.
  const submit = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      // Open first: openSmartAssist() may consume a pending fresh-open reset
      // (after navigating here), which clears messages. Sending afterwards keeps
      // the new user message instead of having it wiped.
      openSmartAssist();
      handleSend(text, { newSession: true });
      setPrompt("");
    },
    [handleSend, setPrompt, openSmartAssist],
  );
  const submitRef = useRef(submit);
  submitRef.current = submit;

  // Atlas AIChatBox only submits on Enter while single-line, so capture Enter
  // ourselves (Shift+Enter still adds a line break) — same as the full-screen view.
  const registerInput = useCallback((node: HTMLTextAreaElement | null) => {
    inputRef.current = node;
    if (!node) return;
    node.addEventListener(
      "keydown",
      (e) => {
        if (e.key !== "Enter" || e.shiftKey || e.isComposing) return;
        e.preventDefault();
        e.stopPropagation();
        if (node.value.trim()) submitRef.current(node.value);
      },
      true,
    );
  }, []);

  // AGAI integration use cases demo: clicking into an empty composer drops in the next scripted
  // prompt, so the presenter can start the story from the home page.
  // Ignores clicks/focus that land on a button inside the composer (Tools,
  // attach, mic, send) — those are real actions, not "I want the next prompt".
  const prefillDemoPrompt = (e?: { target: EventTarget | null }) => {
    if (e?.target instanceof HTMLElement && e.target.closest("button, [role=\"button\"], a")) return;
    if (wsDemoMode) { cycleComposerPrompt(); return; }
    const next = activeDemoSteps[demoStepsDone];
    if (demoMode && next && !prompt.trim()) fillAndFocus(next.prompt);
  };

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        // Section caps at 800px and centers within the Overview left column.
        alignItems: "center",
      }}
    >
      {/* Base gap is 12px (the spacing the chips sit below the composer). The
          subtitle→composer gap is 32px (+20px top margin) and chips→Open-Smart-
          Assist is bumped back to 16px with a compensating +4px top margin. */}
      <Stack sx={{ width: "100%", maxWidth: "708px", gap: "12px" }}>
        {/* Heading + subtitle */}
        <Stack sx={{ gap: "4px", textAlign: "center" }}>
          <Typography
            component="h2"
            sx={{
              // Atlas h2-display (28px / 34px), weight 600. fontSize pinned so a
              // deploy-time token shift can't resize it.
              fontFamily: font.title.h2Display.fontFamily.value,
              fontSize: "28px",
              fontWeight: fontWeight.emphasis.value,
              lineHeight: font.title.h2Display.lineHeight.value,
              letterSpacing: font.title.h2Display.letterSpacing.value,
              color: color.type.default.value,
            }}
          >
            What would you like to know?
          </Typography>
          <Typography
            sx={{
              fontFamily: font.text.md.fontFamily.value,
              fontSize: font.text.md.fontSize.value,
              fontWeight: font.text.md.fontWeight.value,
              lineHeight: font.text.md.lineHeight.value,
              letterSpacing: font.text.md.letterSpacing.value,
              color: color.type.muted.value,
            }}
          >
            Select a prompt to get started, or ask your own question.
          </Typography>
        </Stack>

        {/* Composer — same treatment as the full-screen Ask GovernAI composer:
            indigo blur glow behind, a 1px #DEE0E9 frame with the Atlas low
            elevation shadow, and the Atlas gradient-border/glow turned off. */}
        <Box
          ref={setComposerAnchor}
          onFocus={prefillDemoPrompt}
          onClick={prefillDemoPrompt}
          sx={{
            position: "relative",
            width: "100%",
            // +20px so subtitle→composer is 32px against the 12px Stack gap.
            mt: "20px",
          }}
        >
          <Box
            role="presentation"
            sx={{
              width: "660px",
              maxWidth: "100%",
              height: "140px",
              position: "absolute",
              left: "50%",
              top: "-14px",
              transform: "translateX(-50%)",
              opacity: 0.48,
              background:
                "linear-gradient(90deg, rgba(255,255,255,0.5) 0%, rgba(64,105,254,0.5) 23%, rgba(0,64,213,0.5) 49%, rgba(64,105,254,0.5) 73%, rgba(255,255,255,0.5) 100%)",
              borderRadius: "9999px",
              filter: "blur(77px)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              borderRadius: "12px",
              overflow: "hidden",
              border: "1px solid #DEE0E9",
              boxShadow:
                "-1px 4px 8px rgba(135,135,135,0.08), -2px 9px 12px rgba(135,135,135,0.06), -12px 38px 24px rgba(135,135,135,0.02), -12px 40px 20px rgba(135,135,135,0.01)",
            }}
          >
            <AIChatBox
              onSubmit={submit}
              onStop={() => {}}
              isUploadAvailable={false}
              leadingActions={
                <>
                  <Tooltip title="Attach file">
                    <IconButton size="small" sx={{ width: 32, height: 32, p: "4px", borderRadius: "12px", color: "#232429" }}>
                      <UploadFileIcon />
                    </IconButton>
                  </Tooltip>
                  <Box sx={{ display: "inline-flex", alignSelf: "center" }}>
                    <Button
                      variant="text"
                      size="small"
                      startIcon={<ToolsSliderIcon />}
                      endIcon={<CaretDownIcon size="md" />}
                      onClick={(e) => { e.stopPropagation(); setToolsMenuAnchor(toolsMenuAnchor ? null : e.currentTarget); }}
                      onFocus={(e) => e.stopPropagation()}
                      sx={{ borderRadius: "12px", px: "8px", py: "4px", fontWeight: 500, fontSize: "14px", lineHeight: "20px", minWidth: 0, color: "#232429", textTransform: "none" }}
                    >
                      Tools
                    </Button>
                  </Box>
                  {activeExpertSkillData && (
                    <Chip
                      variant="outlined"
                      size="small"
                      label={activeExpertSkillData.label}
                      onDelete={() => setActiveExpertSkill(null)}
                      sx={{ alignSelf: "center", height: 24, borderRadius: "9999px", borderColor: "#888B9A", fontSize: "12px", fontWeight: 400, lineHeight: "16px", color: "#232429" }}
                    />
                  )}
                  {activeAgentModeData && (
                    <Chip
                      variant="outlined"
                      size="small"
                      label={activeAgentModeData.label}
                      onDelete={() => setActiveAgentMode(null)}
                      sx={{ alignSelf: "center", height: 24, borderRadius: "9999px", borderColor: "#888B9A", fontSize: "12px", fontWeight: 400, lineHeight: "16px", color: "#232429" }}
                    />
                  )}
                </>
              }
              trailingActions={
                <>
                  <Tooltip title="Voice input" placement="top">
                    <IconButton size="small" sx={{ width: 32, height: 32, p: "4px", borderRadius: "8px", color: "#232429" }}>
                      <ChatMicrophoneIcon />
                    </IconButton>
                  </Tooltip>
                </>
              }
              sx={{
                "& .MuiInputBase-input": { padding: "16px 24px 12px", fontSize: "14px !important" },
                "& .AtlasAIGlow-root": { display: "none !important" },
                "& .AtlasAIChatBox-gradient-border": { display: "none !important" },
              }}
              slotProps={{
                textField: {
                  placeholder: "Ask anything about your board materials",
                  slotProps: { textField: { inputRef: registerInput } },
                },
                disclaimer: { stackProps: { style: { display: "none" } } },
              }}
            />
          </Box>
        </Box>

        {/* ── Tools menu — rendered as a sibling of the composer's demo-prefill
            Box above, not nested inside it. The menu (its backdrop included)
            is otherwise still part of that Box's React subtree even though it
            portals its DOM elsewhere, so opening it, clicking its backdrop to
            close it, or picking an item would bubble into prefillDemoPrompt
            and keep overwriting the draft with the next scripted prompt.
            Mirrors how the overlay/panel Tools menus are kept outside their
            own composer boxes. ── */}
        <Menu
          open={Boolean(toolsMenuAnchor)}
          anchorEl={toolsMenuAnchor}
          onClose={closeToolsMenus}
          anchorOrigin={{ vertical: "top", horizontal: "left" }}
          transformOrigin={{ vertical: "bottom", horizontal: "left" }}
          slotProps={{ paper: { sx: { ...MENU_PAPER_SX, mb: "6px" } } }}
          MenuListProps={{ sx: { py: "4px" } }}
        >
          {/* Select a skill */}
          <MenuItem
            onMouseEnter={(e) => { const el = e.currentTarget; if (submenuDelayRef.current) clearTimeout(submenuDelayRef.current); submenuDelayRef.current = setTimeout(() => { setExpertSkillsAnchor(el); setAgentReportingAnchor(null); }, 560); }}
            onMouseLeave={() => { if (submenuDelayRef.current) clearTimeout(submenuDelayRef.current); }}
            onClick={(e) => { const el = e.currentTarget; if (submenuDelayRef.current) clearTimeout(submenuDelayRef.current); setExpertSkillsAnchor(el); setAgentReportingAnchor(null); }}
            sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: "12px", py: "8px", fontSize: "14px", color: "#232429", gap: "32px", minHeight: "auto", backgroundColor: activeToolsItem === "expert" ? "rgba(0,0,0,0.04)" : undefined, "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" } }}
          >
            Select a skill
            <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, flexShrink: 0 }}><path d="M13.9463 12.0003L8.35059 6.40466L9.4089 5.34636L15.5089 11.4003L15.063 11.9462L9.4089 18.654L8.35059 17.5957L13.9463 12.0003Z" fill="currentColor"/></svg>
          </MenuItem>

          {/* Generate insights */}
          <MenuItem
            onMouseEnter={(e) => { const el = e.currentTarget; if (submenuDelayRef.current) clearTimeout(submenuDelayRef.current); submenuDelayRef.current = setTimeout(() => { setAgentReportingAnchor(el); setExpertSkillsAnchor(null); }, 560); }}
            onMouseLeave={() => { if (submenuDelayRef.current) clearTimeout(submenuDelayRef.current); }}
            onClick={(e) => { const el = e.currentTarget; if (submenuDelayRef.current) clearTimeout(submenuDelayRef.current); setAgentReportingAnchor(el); setExpertSkillsAnchor(null); }}
            sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: "12px", py: "8px", fontSize: "14px", color: "#232429", gap: "32px", minHeight: "auto", backgroundColor: activeToolsItem === "agent" ? "rgba(0,0,0,0.04)" : undefined, "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" } }}
          >
            Generate insights
            <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, flexShrink: 0 }}><path d="M13.9463 12.0003L8.35059 6.40466L9.4089 5.34636L15.5089 11.4003L15.063 11.9462L9.4089 18.654L8.35059 17.5957L13.9463 12.0003Z" fill="currentColor"/></svg>
          </MenuItem>

          {/* Search the web (toggle) */}
          <Box
            onMouseEnter={() => { if (submenuDelayRef.current) clearTimeout(submenuDelayRef.current); setExpertSkillsAnchor(null); setAgentReportingAnchor(null); }}
            onClick={(e) => { e.stopPropagation(); webSearchEnabled ? turnOffWebSearch() : turnOnWebSearch(); }}
            sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: "12px", py: "8px", cursor: "pointer", "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" } }}
          >
            <Typography sx={{ fontSize: "14px", color: "#232429", lineHeight: "20px" }}>Search the web</Typography>
            <Switch
              size="small"
              checked={webSearchEnabled}
              inputProps={{ "aria-label": "Search the web" }}
              onChange={(e) => { e.stopPropagation(); webSearchEnabled ? turnOffWebSearch() : turnOnWebSearch(); }}
              onClick={(e) => e.stopPropagation()}
            />
          </Box>
        </Menu>

        {/* ── Select a skill submenu ── */}
        <Popper open={Boolean(expertSkillsAnchor)} anchorEl={expertSkillsAnchor} placement="left-start" style={{ zIndex: 1400, marginRight: "4px" }}>
          <Paper sx={{ ...MENU_PAPER_SX, minWidth: 280 }}>
            <MenuList sx={{ py: "4px" }}>
              {EXPERT_SKILLS.map(({ id, label, desc, slash, Icon }) => (
                <MenuItem key={id} onClick={() => { closeToolsMenus(); setActiveExpertSkill(id); }} sx={{ px: "12px", py: "8px", gap: "10px", alignItems: "flex-start", minHeight: "auto", "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" } }}>
                  <Box sx={{ mt: "2px", color: "#575A67", flexShrink: 0 }}><Icon size="md" /></Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#232429", lineHeight: "20px" }}>{label}</Typography>
                      <Typography component="span" sx={{ fontSize: "11px", fontWeight: 500, color: "#575A67", background: "rgba(0,0,0,0.06)", borderRadius: "4px", px: "4px", py: "1px", lineHeight: "16px", whiteSpace: "nowrap" }}>{slash}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: "12px", color: "#575A67", lineHeight: "16px", mt: "2px" }}>{desc}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </MenuList>
          </Paper>
        </Popper>

        {/* ── Generate insights submenu ── */}
        <Popper open={Boolean(agentReportingAnchor)} anchorEl={agentReportingAnchor} placement="left-start" style={{ zIndex: 1400, marginRight: "4px" }}>
          <Paper sx={{ ...MENU_PAPER_SX, minWidth: 296, maxWidth: 296 }}>
            <MenuList sx={{ py: "4px" }}>
              {AGENT_REPORTING.map(({ id, label, tag, desc, Icon }) => (
                <MenuItem key={id} onClick={() => { closeToolsMenus(); setActiveAgentMode(id); }} sx={{ px: "12px", py: "8px", gap: "10px", alignItems: "flex-start", minHeight: "auto" }}>
                  <Box sx={{ mt: "2px", color: "#575A67", flexShrink: 0 }}><Icon size="md" /></Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#232429", lineHeight: "20px" }}>{label}</Typography>
                      <Typography component="span" sx={{ fontSize: "11px", fontWeight: 500, color: "#4069FE", background: "rgba(64,105,254,0.08)", borderRadius: "4px", px: "4px", py: "1px", lineHeight: "16px", whiteSpace: "nowrap" }}>{tag}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: "12px", color: "#575A67", lineHeight: "16px", mt: "2px", whiteSpace: "normal", wordBreak: "break-word" }}>{desc}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </MenuList>
          </Paper>
        </Popper>

        {/* Suggestion chips — small Atlas outlined chips, centered below the
            composer. Clicking drops a starter prompt into the input. Shared with
            the full-screen and panel Smart Assist views (which use large). */}
        <SuggestionChips
          size="small"
          align="center"
          audience="director"
          maxVisible={3}
          promptSet="default"
          anchorEl={composerAnchor}
          placement="bottom"
          showIcon
          onSelectPrompt={fillAndFocus}
          onChipOpen={focusComposer}
          sx={{ mt: "4px" }}
        />

      </Stack>
    </Box>
  );
}
