import { useState, useMemo, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Switch,
  Checkbox,
  FormControlLabel,
  Button,
  Stack,
  OutlinedInput,
  InputAdornment,
  IconButton,
  Link,
  Drawer,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import BackupOutlinedIcon from "@mui/icons-material/BackupOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import { PageHeader, OverflowBreadcrumbs, Footer } from "@diligentcorp/atlas-react-bundle";
import { NavLink as RouterNavLink } from "react-router";
import SourcePacksPicker from "../components/webSearch/SourcePacksPicker.js";
import { useSmartAssist } from "../context/SmartAssistContext.js";

const SETTINGS_NAV = [
  "Infrastructure and security",
  "Organization and application properties",
  "Book management",
  "Document management",
  "Resource Center",
  "Home page",
  "Artificial intelligence (AI)",
] as const;

type SettingsTab = (typeof SETTINGS_NAV)[number];

interface AiFeature {
  name: string;
  description: string;
  note?: string;
  enabled: boolean;
}

const INITIAL_FEATURES: Record<string, AiFeature> = {
  askGovernAI: {
    name: "Ask GovernAI",
    description: "Find answers in your board materials with AI chat. Available to administrators",
    enabled: true,
  },
  smartSummary: {
    name: "Smart Summary",
    description: "Create and read an accurate executive summary of a book",
    enabled: true,
  },
  smartPrep: {
    name: "Smart Prep",
    note: "Requires Smart Summary to be enabled.",
    description: "Prepare smarter for a meeting with suggested discussion topics",
    enabled: true,
  },
  smartRiskScanner: {
    name: "Smart Risk Scanner",
    description: "Identify potential business risks in the book",
    enabled: true,
  },
};

// Tracks which chat-assistant features had an alert dismissed. The alert
// reappears if any of them is turned off again after being on.
type AlertDismissState = {
  dismissed: boolean;
  // snapshot of enabled states at dismiss time, used to detect re-triggers
  onStates: Record<string, boolean>;
};

const CHAT_ASSIST_KEYS = ["askGovernAI"] as const;
const INSIGHTS_KEYS = ["smartSummary", "smartPrep", "smartRiskScanner"] as const;

function shouldShowAlert(
  features: Record<string, AiFeature>,
  alertState: AlertDismissState | null,
  keys: readonly string[] = CHAT_ASSIST_KEYS,
): boolean {
  const anyOff = keys.some((k) => !features[k].enabled);
  if (!anyOff) return false;
  if (!alertState) return true;
  if (!alertState.dismissed) return true;
  const retriggered = keys.some((k) => alertState.onStates[k] && !features[k].enabled);
  return retriggered;
}

export default function OrganizationSettingsPage() {
  const {
    enabledSourcePackIds: committedSourcePackIds,
    setEnabledSourcePackIds: commitSourcePackIds,
    customPeers: committedPeers,
    setCustomPeers: commitPeers,
  } = useSmartAssist();
  const [activeTab, setActiveTab] = useState<SettingsTab>("Artificial intelligence (AI)");
  const [features, setFeatures] = useState(INITIAL_FEATURES);
  const [saved, setSaved] = useState(INITIAL_FEATURES);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [savedWebSearchEnabled, setSavedWebSearchEnabled] = useState(false);
  const [sourcePackIds, setSourcePackIds] = useState(committedSourcePackIds);
  const [peers, setPeers] = useState(committedPeers);
  const [peerFilingsEnabled, setPeerFilingsEnabled] = useState(false);
  const [savedPeerFilingsEnabled, setSavedPeerFilingsEnabled] = useState(false);
  const [sourcesSheetOpen, setSourcesSheetOpen] = useState(false);
  const {
    presets: { SideSheetPresets },
  } = useTheme();
  const { size: sideSheetSize, components: sideSheetComponents } = SideSheetPresets;
  const { Header: SideSheetHeader, Content: SideSheetContent } = sideSheetComponents;
  const [alertDismissState, setAlertDismissState] = useState<AlertDismissState | null>(null);
  const [insightsAlertDismissState, setInsightsAlertDismissState] = useState<AlertDismissState | null>(null);
  const [showToast, setShowToast] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAlert = shouldShowAlert(features, alertDismissState);
  const showInsightsAlert = shouldShowAlert(features, insightsAlertDismissState, INSIGHTS_KEYS);

  const changeCount = useMemo(() => {
    const featureChanges = Object.keys(features).filter((k) => features[k].enabled !== saved[k].enabled).length;
    const sourceChanges =
      sourcePackIds.length !== committedSourcePackIds.length ||
      sourcePackIds.some((id) => !committedSourcePackIds.includes(id))
        ? 1
        : 0;
    const peerChanges =
      peers.length !== committedPeers.length || peers.some((p) => !committedPeers.includes(p)) ? 1 : 0;
    return (
      featureChanges +
      (webSearchEnabled !== savedWebSearchEnabled ? 1 : 0) +
      sourceChanges +
      peerChanges +
      (peerFilingsEnabled !== savedPeerFilingsEnabled ? 1 : 0)
    );
  }, [
    features,
    saved,
    webSearchEnabled,
    savedWebSearchEnabled,
    sourcePackIds,
    committedSourcePackIds,
    peers,
    committedPeers,
    peerFilingsEnabled,
    savedPeerFilingsEnabled,
  ]);

  const toggleSourcePack = (id: string) =>
    setSourcePackIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const addPeer = (name: string) => setPeers((prev) => (prev.includes(name) ? prev : [...prev, name]));
  const removePeer = (name: string) => setPeers((prev) => prev.filter((p) => p !== name));
  const togglePeerFilings = () => setPeerFilingsEnabled((prev) => !prev);

  const toggleFeature = (key: string) => {
    const turningOff = features[key].enabled;
    setFeatures((prev) => {
      const next = { ...prev, [key]: { ...prev[key], enabled: !prev[key].enabled } };
      // When Summary turns off, force SmartPrep off too
      if (key === "smartSummary" && turningOff) {
        next.smartPrep = { ...next.smartPrep, enabled: false };
      }
      return next;
    });
    // Web search is a sub-option of Ask GovernAI — turning it off forces web search off too
    if (key === "askGovernAI" && turningOff) {
      setWebSearchEnabled(false);
    }
    if (turningOff) {
      if (CHAT_ASSIST_KEYS.includes(key as (typeof CHAT_ASSIST_KEYS)[number])) {
        setAlertDismissState(null);
      }
      if (INSIGHTS_KEYS.includes(key as (typeof INSIGHTS_KEYS)[number])) {
        setInsightsAlertDismissState(null);
      }
    }
  };

  const toggleWebSearch = () => setWebSearchEnabled((prev) => !prev);

  const smartPrepDisabled = !features.smartSummary.enabled;
  const webSearchDisabled = !features.askGovernAI.enabled;

  const handleDismissAlert = () => {
    setAlertDismissState({
      dismissed: true,
      onStates: Object.fromEntries(CHAT_ASSIST_KEYS.map((k) => [k, features[k].enabled])),
    });
  };

  const handleDismissInsightsAlert = () => {
    setInsightsAlertDismissState({
      dismissed: true,
      onStates: Object.fromEntries(INSIGHTS_KEYS.map((k) => [k, features[k].enabled])),
    });
  };

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const handleSave = () => {
    setSaved(features);
    setSavedWebSearchEnabled(webSearchEnabled);
    setSavedPeerFilingsEnabled(peerFilingsEnabled);
    commitSourcePackIds(sourcePackIds);
    commitPeers(peers);
    setShowToast(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setShowToast(false), 5000);
  };
  const handleCancel = () => {
    setFeatures(saved);
    setWebSearchEnabled(savedWebSearchEnabled);
    setPeerFilingsEnabled(savedPeerFilingsEnabled);
    setSourcePackIds(committedSourcePackIds);
    setPeers(committedPeers);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        px: 2,
        pt: 2,
      }}
    >
      {/* Fixed top: header + search */}
      <Box sx={{ flexShrink: 0 }}>
        <PageHeader
          pageTitle="Organization name"
          pageSubtitle="Manage attributes across organization."
          breadcrumbs={
            <OverflowBreadcrumbs
              leadingElement={<span>Boards</span>}
              items={[
                { id: "app-mgmt", label: "Application management", url: "#" },
                { id: "settings", label: "Settings", url: "/settings" },
              ]}
              hideLastItem={true}
              aria-label="Breadcrumbs"
            >
              {({ label, url }) => <RouterNavLink to={url}>{label}</RouterNavLink>}
            </OverflowBreadcrumbs>
          }
        />

        {/* Search */}
        <Box sx={{ maxWidth: 543, mt: 2 }}>
          <Typography
            sx={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: "#242628",
              letterSpacing: "0.3px",
              lineHeight: "16px",
              mb: "4px",
            }}
          >
            Search for settings
          </Typography>
          <OutlinedInput
            fullWidth
            size="small"
            placeholder="Search"
            startAdornment={
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 20, color: "#242628" }} />
              </InputAdornment>
            }
            sx={{
              height: 40,
              borderRadius: "8px",
              fontSize: 14,
              color: "#5d5e61",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#8f9193" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#8f9193" },
            }}
          />
        </Box>
      </Box>

      {/* Scrollable two-column layout */}
      <Box
        sx={{
          display: "flex",
          gap: "32px",
          flex: 1,
          minHeight: 0,
          mt: 3,
        }}
      >
        {/* Left: Settings categories — static, no scroll */}
        <Box sx={{ flex: "0 0 40%", overflowY: "visible" }}>
          {SETTINGS_NAV.map((tab, idx) => {
            const isActive = tab === activeTab;
            const isLast = idx === SETTINGS_NAV.length - 1;
            return (
              <Box
                key={tab}
                component="button"
                onClick={() => setActiveTab(tab)}
                sx={{
                  all: "unset",
                  boxSizing: "border-box",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  px: "12px",
                  py: "12px",
                  cursor: "pointer",
                  background: isActive ? "#ecf0ff" : "transparent",
                  borderRadius: isActive ? "12px" : 0,
                  borderBottom: !isActive && !isLast ? "1px solid #e2e2e5" : "none",
                  transition: "background 120ms ease",
                  "&:hover": {
                    background: isActive ? "#ecf0ff" : "#f9f9fb",
                    borderRadius: "12px",
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: isActive ? "#0040d5" : "#242628",
                    letterSpacing: "0.2px",
                    lineHeight: "24px",
                  }}
                >
                  {tab}
                </Typography>
                {isActive && (
                  <ChevronRightIcon sx={{ color: "#0040d5", fontSize: 24, flexShrink: 0 }} />
                )}
              </Box>
            );
          })}
        </Box>

        {/* Right: AI content panel — scrolls within the row */}
        <Box
          sx={{
            borderLeft: "1px solid #e2e2e5",
            pl: 4,
            pr: 4,
            flex: "1 1 0",
            minWidth: 0,
            minHeight: 0,
            pb: changeCount > 0 ? "120px" : "120px",
            overflowY: "auto",
          }}
        >
          <Stack gap="40px">
            {/* Main heading with 20px top padding */}
            <Box sx={{ pt: "20px" }}>
              <Typography
                sx={{ fontSize: 22, fontWeight: 600, color: "#242628", lineHeight: "28px" }}
              >
                Artificial intelligence (AI)
              </Typography>
            </Box>

            {/* Chat search section */}
            <Stack gap="8px">
              <Typography
                sx={{ fontSize: 18, fontWeight: 400, color: "#242628", lineHeight: "28px" }}
              >
                Chat search
              </Typography>

              {showAlert && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    px: "12px",
                    py: "10px",
                    borderRadius: "8px",
                    background: "#eef2ff",
                    border: "1px solid #c7d2fe",
                  }}
                >
                  <InfoOutlinedIcon sx={{ fontSize: 18, color: "#3730a3", mt: "1px", flexShrink: 0 }} />
                  <Typography
                    sx={{
                      fontSize: 14,
                      color: "#3730a3",
                      lineHeight: "20px",
                      letterSpacing: "0.2px",
                      flex: 1,
                    }}
                  >
                    Chat history is hidden, but kept when a feature is turned off and restored when it's turned back on.
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={handleDismissAlert}
                    sx={{ color: "#3730a3", p: "2px", flexShrink: 0, mt: "-2px" }}
                    aria-label="Dismiss"
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              )}

              <Box>
                <FeatureToggleRow
                  feature={features.askGovernAI}
                  onToggle={() => toggleFeature("askGovernAI")}
                  divider={false}
                />
                <WebSearchCheckboxRow
                  checked={webSearchEnabled}
                  onToggle={toggleWebSearch}
                  disabled={webSearchDisabled}
                />
                <PublicSourcesTrigger
                  selectedIds={sourcePackIds}
                  peers={peers}
                  peerFilingsEnabled={peerFilingsEnabled}
                  disabled={webSearchDisabled || !webSearchEnabled}
                  onOpen={() => setSourcesSheetOpen(true)}
                />
              </Box>
            </Stack>

            {/* GovernAI Insights section */}
            <Stack gap="8px">
              <Typography
                sx={{ fontSize: 18, fontWeight: 400, color: "#242628", lineHeight: "28px" }}
              >
                GovernAI Insights
              </Typography>

              {showInsightsAlert && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    px: "12px",
                    py: "10px",
                    borderRadius: "8px",
                    background: "#eef2ff",
                    border: "1px solid #c7d2fe",
                  }}
                >
                  <InfoOutlinedIcon sx={{ fontSize: 18, color: "#3730a3", mt: "1px", flexShrink: 0 }} />
                  <Typography
                    sx={{
                      fontSize: 14,
                      color: "#3730a3",
                      lineHeight: "20px",
                      letterSpacing: "0.2px",
                      flex: 1,
                    }}
                  >
                    Generated content is hidden but kept when a feature is off, and restored when it's turned back on.
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={handleDismissInsightsAlert}
                    sx={{ color: "#3730a3", p: "2px", flexShrink: 0, mt: "-2px" }}
                    aria-label="Dismiss"
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              )}

              <Box>
                <FeatureToggleRow
                  feature={features.smartSummary}
                  onToggle={() => toggleFeature("smartSummary")}
                  divider
                />
                <FeatureToggleRow
                  feature={features.smartPrep}
                  onToggle={() => toggleFeature("smartPrep")}
                  divider
                  disabled={smartPrepDisabled}
                />
                <FeatureToggleRow
                  feature={features.smartRiskScanner}
                  onToggle={() => toggleFeature("smartRiskScanner")}
                  divider={false}
                />
              </Box>
            </Stack>

            {/* Smart Builder section */}
            <Stack gap="24px">
              <Typography
                sx={{ fontSize: 22, fontWeight: 400, color: "#242628", lineHeight: "28px" }}
              >
                Smart Builder
              </Typography>
              <Stack gap="16px">
                <Box>
                  <Typography
                    sx={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: "#242628",
                      lineHeight: "24px",
                      letterSpacing: "0.2px",
                    }}
                  >
                    Smart Builder – Brand Style Guide
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: "#5d5e61",
                      lineHeight: "16px",
                      letterSpacing: "0.3px",
                      mt: "4px",
                    }}
                  >
                    Define brand styles like colors, fonts and layout preferences
                  </Typography>
                </Box>
                <Stack gap="16px">
                  <Typography
                    sx={{
                      fontSize: 14,
                      color: "#242628",
                      lineHeight: "20px",
                      letterSpacing: "0.2px",
                    }}
                  >
                    For presentation (landscape orientation)
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: "24px" }}>
                    <Button
                      variant="outlined"
                      startIcon={<BackupOutlinedIcon />}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: 14,
                        color: "#242628",
                        borderColor: "#8f9193",
                        borderRadius: "8px",
                        whiteSpace: "nowrap",
                        "&:hover": { borderColor: "#242628", background: "transparent" },
                      }}
                    >
                      Upload file
                    </Button>
                    <Typography
                      sx={{
                        fontSize: 12,
                        color: "#6f7377",
                        fontWeight: 600,
                        letterSpacing: "0.3px",
                        lineHeight: "16px",
                      }}
                    >
                      Format:PPTX · Max file size: 25 MB
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </Stack>
          </Stack>
        </Box>
      </Box>

      {/* Success toast */}
      {showToast && (
        <Box
          sx={{
            position: "fixed",
            top: "16px",
            right: "16px",
            zIndex: 1400,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            px: "16px",
            py: "12px",
            borderRadius: "8px",
            background: "#fff",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            border: "1px solid #e2e2e5",
            minWidth: "280px",
          }}
        >
          <CheckCircleOutlinedIcon sx={{ color: "#16a34a", fontSize: 20, flexShrink: 0 }} />
          <Typography sx={{ fontSize: 14, color: "#242628", lineHeight: "20px", flex: 1 }}>
            Changes saved successfully.
          </Typography>
          <Button
            onClick={() => setShowToast(false)}
            sx={{
              all: "unset",
              fontSize: 14,
              fontWeight: 600,
              color: "#0040d5",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Dismiss
          </Button>
        </Box>
      )}

      {/* Changes footer */}
      {changeCount > 0 && (
        <Box
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: "24px",
            borderTop: "1px solid #e2e2e5",
            background: "#fff",
            zIndex: 1300,
          }}
        >
          <Typography sx={{ fontSize: 14, color: "#242628", lineHeight: "20px", letterSpacing: "0.2px" }}>
            Changes: <strong>{changeCount}</strong>
          </Typography>
          <Stack direction="row" gap="8px">
            <Button
              variant="outlined"
              onClick={handleCancel}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: 14,
                color: "#242628",
                borderColor: "#8f9193",
                borderRadius: "8px",
                height: "40px",
                px: "20px",
                "&:hover": { borderColor: "#242628", background: "transparent" },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: 14,
                borderRadius: "8px",
                height: "40px",
                px: "20px",
                background: "#0040d5",
                boxShadow: "none",
                "&:hover": { background: "#0035b3", boxShadow: "none" },
              }}
            >
              Save
            </Button>
          </Stack>
        </Box>
      )}

      {/* Public sources side sheet */}
      <Drawer
        open={sourcesSheetOpen}
        onClose={() => setSourcesSheetOpen(false)}
        sx={{ ...sideSheetSize.medium.sx }}
        slotProps={{
          paper: { role: "dialog", "aria-labelledby": "public-sources-title" },
        }}
      >
        <SideSheetHeader
          variant="default"
          onClose={() => setSourcesSheetOpen(false)}
          title="Public sources"
          componentProps={{
            closeButton: { "aria-label": "Close public sources" },
            title: { component: "h2", id: "public-sources-title" },
          }}
        />
        <SideSheetContent ariaLabel="Public sources content">
          <SourcePacksPicker
            selectedIds={sourcePackIds}
            onToggle={toggleSourcePack}
            peerFilingsEnabled={peerFilingsEnabled}
            onTogglePeerFilings={togglePeerFilings}
            peers={peers}
            onAddPeer={addPeer}
            onRemovePeer={removePeer}
          />
        </SideSheetContent>
        <Footer
          primaryAction={
            <Button
              variant="contained"
              onClick={() => setSourcesSheetOpen(false)}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "8px",
                background: "#0040d5",
                boxShadow: "none",
                "&:hover": { background: "#0035b3", boxShadow: "none" },
              }}
            >
              Done
            </Button>
          }
          horizontalPadding="medium"
        />
      </Drawer>
    </Box>
  );
}

interface FeatureToggleRowProps {
  feature: AiFeature;
  onToggle: () => void;
  divider: boolean;
  disabled?: boolean;
}

function FeatureToggleRow({ feature, onToggle, divider, disabled = false }: FeatureToggleRowProps) {
  return (
    <Box sx={{ position: "relative" }}>
      <Box
        component="button"
        onClick={disabled ? undefined : onToggle}
        disabled={disabled}
        sx={{
          all: "unset",
          boxSizing: "border-box",
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          py: "12px",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 14,
              color: "#232429",
              lineHeight: "20px",
              letterSpacing: "0.2px",
            }}
          >
            {feature.name}
          </Typography>
          {feature.note && (
            <Typography sx={{ fontSize: 12, color: "#232429", lineHeight: "16px" }}>
              {feature.note}
            </Typography>
          )}
          <Typography sx={{ fontSize: 10, color: "#575a67", lineHeight: "12px" }}>
            {feature.description}
          </Typography>
        </Box>
        <Switch
          checked={feature.enabled}
          onChange={disabled ? undefined : onToggle}
          onClick={(e) => e.stopPropagation()}
          size="small"
          color="primary"
          disabled={disabled}
          sx={{ flexShrink: 0, pointerEvents: "none", opacity: disabled ? 0.4 : 1 }}
        />
      </Box>
      {divider && (
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "1px",
            background: "#dee0e9",
          }}
        />
      )}
    </Box>
  );
}

interface WebSearchCheckboxRowProps {
  checked: boolean;
  onToggle: () => void;
  disabled: boolean;
}

// Sub-option of the Ask GovernAI toggle above it, following the same pattern as
// "Administrators receive copies of book notifications" under Book notifications:
// a checkbox (not a switch) indented under the parent feature, disabled when the
// parent feature is off.
function WebSearchCheckboxRow({ checked, onToggle, disabled }: WebSearchCheckboxRowProps) {
  return (
    <Box sx={{ pb: "12px", opacity: disabled ? 0.4 : 1 }}>
      <FormControlLabel
        sx={{ alignItems: "flex-start", ml: 0, gap: "8px" }}
        control={
          <Checkbox
            checked={checked}
            onChange={disabled ? undefined : onToggle}
            disabled={disabled}
            size="small"
            sx={{ p: 0, mt: "2px", flexShrink: 0, width: "16px", height: "16px" }}
          />
        }
        label={
          <Box>
            <Typography
              sx={{ fontSize: 14, color: "#232429", lineHeight: "20px", letterSpacing: "0.2px" }}
            >
              Enable web search
            </Typography>
            <Typography sx={{ fontSize: 10, color: "#575a67", lineHeight: "12px", mt: "2px" }}>
              Let Ask GovernAI search public websites when board materials don't have the answer.{" "}
              <Link
                href="#"
                onClick={(e) => e.preventDefault()}
                sx={{ fontSize: 10, fontWeight: 600, color: "#0040d5" }}
              >
                Learn more
              </Link>
            </Typography>
          </Box>
        }
      />
    </Box>
  );
}

interface PublicSourcesTriggerProps {
  selectedIds: string[];
  peers: string[];
  peerFilingsEnabled: boolean;
  disabled: boolean;
  onOpen: () => void;
}

// Indented under the "Enable web search" checkbox, same pattern as that
// checkbox under Ask GovernAI. The picker's content now lives in the
// "Public sources" side sheet; this row just summarizes the current
// selection and opens it.
function PublicSourcesTrigger({ selectedIds, peers, peerFilingsEnabled, disabled, onOpen }: PublicSourcesTriggerProps) {
  const sourceCount = selectedIds.length;
  const peerCount = peerFilingsEnabled ? peers.length : 0;
  const summary =
    [
      sourceCount > 0 ? `${sourceCount} source${sourceCount === 1 ? "" : "s"}` : null,
      peerCount > 0 ? `${peerCount} peer compan${peerCount === 1 ? "y" : "ies"}` : null,
    ]
      .filter(Boolean)
      .join(" · ") || "No sources selected";

  return (
    <Box sx={{ pl: "26px", pb: "12px", opacity: disabled ? 0.4 : 1 }}>
      <Typography sx={{ fontSize: 14, color: "#232429", lineHeight: "20px", letterSpacing: "0.2px" }}>
        Public sources
      </Typography>
      <Typography sx={{ fontSize: 10, color: "#575a67", lineHeight: "12px", mt: "2px", mb: "8px" }}>
        {summary}
      </Typography>
      <Button
        variant="outlined"
        size="small"
        onClick={disabled ? undefined : onOpen}
        disabled={disabled}
        sx={{
          textTransform: "none",
          fontWeight: 600,
          fontSize: 13,
          color: "#242628",
          borderColor: "#8f9193",
          borderRadius: "8px",
          "&:hover": { borderColor: "#242628", background: "transparent" },
        }}
      >
        Manage sources
      </Button>
    </Box>
  );
}
