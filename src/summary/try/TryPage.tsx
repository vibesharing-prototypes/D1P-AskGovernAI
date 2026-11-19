import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  FormControlLabel,
  IconButton,
  Link,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AIChatAIMessage,
  AIChatBox,
  AIChatContent,
  AIChatMessageAvatar,
  AIChatMessageFooter,
  AIChatMessageHeader,
  AIChatMessageSourceListBlock,
  AIChatSuggestedActions,
  AIChatThinkingIndicator,
  AIChatToolCall,
  AIChatToolCallGroup,
  AIChatUI,
  AIChatUserMessage,
  useAIChatContext,
} from "@diligentcorp/atlas-react-bundle";
import ArrowLeftIcon from "@diligentcorp/atlas-react-bundle/icons/ArrowLeft";
import BookIcon from "@diligentcorp/atlas-react-bundle/icons/Book";
import CopyIcon from "@diligentcorp/atlas-react-bundle/icons/Copy";
import ThumbsUpIcon from "@diligentcorp/atlas-react-bundle/icons/ThumbsUp";
import ThumbsDownIcon from "@diligentcorp/atlas-react-bundle/icons/ThumbsDown";
import AiSummaryIcon from "@diligentcorp/atlas-react-bundle/icons/AiSummary";
import DocumentIcon from "@diligentcorp/atlas-react-bundle/icons/Document";
import SearchIcon from "@diligentcorp/atlas-react-bundle/icons/Search";
import KeyIcon from "@diligentcorp/atlas-react-bundle/icons/Key";
import ClockIcon from "@diligentcorp/atlas-react-bundle/icons/Clock";
import ShareIcon from "@diligentcorp/atlas-react-bundle/icons/Share";
import RefreshIcon from "@diligentcorp/atlas-react-bundle/icons/Refresh";
import LightbulbIcon from "@diligentcorp/atlas-react-bundle/icons/Lightbulb";
import RichAnswer from "./RichAnswer.js";
import { BookPane, HowItWorksPanel } from "./SidePanels.js";
import {
  BOOK,
  FALLBACK_BLOCKS,
  SCENARIOS,
  STALE_NOTICE,
  WELCOME_CHIP_IDS,
  byId,
  matchScenario,
  type LayerId,
  type Scenario,
  type ToolStep,
} from "./scenarios.js";

// ─── Types ───────────────────────────────────────────────────────────────────

type Entry = "home" | "book";

interface UserMsg {
  id: number;
  role: "user";
  text: string;
  time: string;
}

interface AiMsg {
  id: number;
  role: "ai";
  /** null → fallback answer */
  scenarioId: string | null;
  status: "thinking" | "done";
  /** Steps completed so far while thinking. */
  progress: number;
  steps: ToolStep[];
  /** Answer was generated while the book had changed after publish. */
  stale: boolean;
  /** Answer came from a refreshed summary. */
  refreshed: boolean;
  time: string;
}

type Msg = UserMsg | AiMsg;

const nowTime = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const STEP_MS = 450;

const LAYER_ICON: Record<LayerId | "access", ReactNode> = {
  synthesis: <AiSummaryIcon size="md" aria-hidden />,
  notes: <DocumentIcon size="md" aria-hidden />,
  map: <BookIcon size="md" aria-hidden />,
  index: <SearchIcon size="md" aria-hidden />,
  access: <KeyIcon size="md" aria-hidden />,
};

/** Builds the tool-call trail, adding the invocation-specific steps. */
function buildSteps(s: Scenario, entry: Entry, refreshed: boolean): ToolStep[] {
  const steps = [...s.steps];
  const bookScoped = !["fact", "trace"].includes(s.id);
  if (entry === "home" && bookScoped) {
    steps.unshift({
      label: "Picked the book for your next meeting",
      detail: `${BOOK.title}, ${BOOK.meetingDate}. Name another book to change it.`,
      layer: "map",
    });
  }
  if (refreshed) {
    steps.unshift(
      { label: "Rebuilt the note for the changed document", detail: "“Risk appetite statement update”, replaced on 4 Feb 2027.", layer: "notes" },
      { label: "Rebuilt the whole-book synthesis", detail: "Only the changed parts were regenerated.", layer: "synthesis" },
    );
  }
  return steps;
}

// ─── Small pieces ────────────────────────────────────────────────────────────

function AiHeader({ time, children }: { time: string; children?: ReactNode }) {
  return (
    <AIChatMessageHeader name="GovernAI" time={time} avatar={<AIChatMessageAvatar uniqueId="governai" initials="AI" />}>
      {children}
    </AIChatMessageHeader>
  );
}

function Provenance({ text }: { text: string }) {
  return (
    <Stack
      direction="row"
      sx={({ tokens }) => ({
        alignItems: "flex-start",
        gap: tokens.semantic.spacing.desktop.gap["1"].value,
        color: tokens.semantic.color.type.muted.value,
      })}
    >
      <Box sx={{ display: "flex", pt: "2px" }}>
        <ClockIcon size="md" aria-hidden />
      </Box>
      <Typography variant="textSm">{text}</Typography>
    </Stack>
  );
}

function PatternNote({ title, text }: { title: string; text: string }) {
  return (
    <Stack
      role="note"
      aria-label="How it works"
      direction="row"
      sx={({ tokens }) => ({
        gap: tokens.semantic.spacing.desktop.gap["1"].value,
        p: tokens.semantic.spacing.desktop.padding["2"].value,
        borderRadius: tokens.semantic.radius.md.value,
        backgroundColor: tokens.semantic.color.accent.lavender.background.value,
        color: tokens.semantic.color.accent.lavender.content.value,
      })}
    >
      <Box sx={{ display: "flex", pt: "2px" }}>
        <LightbulbIcon size="md" aria-hidden />
      </Box>
      <Stack>
        <Typography variant="labelSm">Pattern: {title}</Typography>
        <Typography variant="textSm">{text}</Typography>
      </Stack>
    </Stack>
  );
}

function Feedback() {
  const [value, setValue] = useState<"up" | "down" | null>(null);
  return (
    <>
      <Tooltip title="Good answer">
        <IconButton size="small" aria-label="Good answer" aria-pressed={value === "up"} color={value === "up" ? "primary" : "default"} onClick={() => setValue(value === "up" ? null : "up")}>
          <ThumbsUpIcon size="md" aria-hidden />
        </IconButton>
      </Tooltip>
      <Tooltip title="Bad answer">
        <IconButton size="small" aria-label="Bad answer" aria-pressed={value === "down"} color={value === "down" ? "primary" : "default"} onClick={() => setValue(value === "down" ? null : "down")}>
          <ThumbsDownIcon size="md" aria-hidden />
        </IconButton>
      </Tooltip>
    </>
  );
}

function ShareConfirm() {
  const [state, setState] = useState<"pending" | "shared" | "cancelled">("pending");
  if (state === "shared")
    return <AIChatToolCall label="Shared with Dana Liu" status="success" icon={<ShareIcon size="md" aria-hidden />} />;
  if (state === "cancelled")
    return <AIChatToolCall label="Sharing cancelled" status="failed" icon={<ShareIcon size="md" aria-hidden />} />;
  return (
    <AIChatToolCall
      label="Share this brief with Dana Liu?"
      status="paused"
      icon={<ShareIcon size="md" aria-hidden />}
      authorization={
        <>
          <Button variant="contained" size="small" onClick={() => setState("shared")}>
            Share
          </Button>
          <Button variant="outlined" size="small" onClick={() => setState("cancelled")}>
            Cancel
          </Button>
        </>
      }
    >
      <Typography variant="textSm">
        Dana will get the brief in Boards messages. Every citation links to a page she can open.
      </Typography>
    </AIChatToolCall>
  );
}

// ─── AI message ──────────────────────────────────────────────────────────────

function AiMessage({
  msg,
  showHow,
  onAsk,
  onRefresh,
}: {
  msg: AiMsg;
  showHow: boolean;
  onAsk: (text: string) => void;
  onRefresh: () => void;
}) {
  const s = msg.scenarioId ? byId(msg.scenarioId) : null;

  if (msg.status === "thinking") {
    const total = msg.steps.length;
    return (
      <AIChatAIMessage header={<AiHeader time={msg.time}><AIChatThinkingIndicator label={s?.thinkingLabel ?? "Thinking"} /></AiHeader>}>
        {s && total > 0 && (
          <AIChatToolCallGroup label={s.toolGroupLabel} status="running" progress={{ completed: msg.progress, total }} defaultExpanded>
            {msg.steps.map((st, i) => (
              <AIChatToolCall
                key={i}
                label={st.label}
                icon={LAYER_ICON[st.layer ?? "access"]}
                status={i < msg.progress ? "success" : i === msg.progress ? "running" : "waiting"}
              />
            ))}
          </AIChatToolCallGroup>
        )}
      </AIChatAIMessage>
    );
  }

  // Fallback: no scripted match.
  if (!s) {
    return (
      <AIChatAIMessage
        header={<AiHeader time={msg.time} />}
        footer={
          <AIChatMessageFooter
            suggestedActions={
              <AIChatSuggestedActions
                label="Try asking"
                slotProps={{ buttons: { sx: { flexWrap: "wrap" } } }}
                buttons={SCENARIOS.map((x) => (
                  <Button key={x.id} variant="outlined" size="small" onClick={() => onAsk(x.prompt)}>
                    {x.prompt}
                  </Button>
                ))}
              />
            }
          />
        }
      >
        <RichAnswer blocks={FALLBACK_BLOCKS} sources={[]} />
      </AIChatAIMessage>
    );
  }

  const usesSummary = s.layers.includes("synthesis") || s.layers.includes("notes");
  const provenance = msg.refreshed
    ? s.provenance.replace(/generated at publish, [^·]+/, `refreshed today at ${msg.time}, after 1 document changed `)
    : s.provenance;

  return (
    <AIChatAIMessage
      header={<AiHeader time={msg.time} />}
      footer={
        <AIChatMessageFooter
          leadingActions={
            <Button size="small" variant="text" startIcon={<CopyIcon size="md" aria-hidden />}>
              Copy
            </Button>
          }
          trailingActions={<Feedback />}
          suggestedActions={
            <AIChatSuggestedActions
              label="Suggested follow-ups"
              slotProps={{ buttons: { sx: { flexWrap: "wrap" } } }}
              buttons={s.followUps.map((f) => (
                <Button key={f} variant="outlined" size="small" onClick={() => onAsk(f)}>
                  {f}
                </Button>
              ))}
            />
          }
        />
      }
    >
      <Stack sx={({ tokens }) => ({ gap: tokens.semantic.spacing.desktop.gap["3"].value })}>
        <AIChatToolCallGroup label={s.toolGroupLabel} status="complete">
          {msg.steps.map((st, i) => (
            <AIChatToolCall key={i} label={st.label} status="success" icon={LAYER_ICON[st.layer ?? "access"]}>
              <Typography variant="textSm">{st.detail}</Typography>
            </AIChatToolCall>
          ))}
        </AIChatToolCallGroup>

        {msg.stale && usesSummary && (
          <Alert
            severity="warning"
            action={
              <Stack direction="row" sx={({ tokens }) => ({ gap: tokens.semantic.spacing.desktop.gap["1"].value, alignItems: "center" })}>
                <Button size="small" variant="outlined" startIcon={<RefreshIcon size="md" aria-hidden />} onClick={onRefresh}>
                  Refresh summary
                </Button>
              </Stack>
            }
          >
            <AlertTitle>{STALE_NOTICE.title}</AlertTitle>
            {STALE_NOTICE.text}
          </Alert>
        )}

        {showHow && <PatternNote title={s.pattern.title} text={s.pattern.text} />}

        <RichAnswer blocks={s.blocks} sources={s.sources} />

        {s.shareConfirm && <ShareConfirm />}

        <Provenance text={provenance} />

        <AIChatMessageSourceListBlock
          label="Sources"
          limit={3}
          links={dedupeSources(s).map((src, i) => ({ text: src, href: `#source-${msg.id}-${i + 1}` }))}
        />
      </Stack>
    </AIChatAIMessage>
  );
}

function dedupeSources(s: Scenario): string[] {
  const seen = new Map<string, number[]>();
  for (const src of s.sources) {
    const key = src.book === BOOK.title ? src.doc : `${src.doc} (${src.book})`;
    seen.set(key, [...(seen.get(key) ?? []), src.page]);
  }
  return [...seen.entries()].map(([k, pages]) => `${k}, page${pages.length > 1 ? "s" : ""} ${[...new Set(pages)].sort((a, b) => a - b).join(", ")}`);
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TryPage() {
  const { setIsGenerating, setHasStartedChat, hasStartedChat } = useAIChatContext();
  const [entry, setEntry] = useState<Entry>("home");
  const [showHow, setShowHow] = useState(false);
  const [stale, setStale] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const nextId = useRef(1);
  const timers = useRef<number[]>([]);
  const busy = messages.some((m) => m.role === "ai" && m.status === "thinking");

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  // Bring each new question to the top of the view, so its answer reads from the start.
  const lastUserId = [...messages].reverse().find((m) => m.role === "user")?.id;
  useEffect(() => {
    if (lastUserId === undefined) return;
    const t = window.setTimeout(() => {
      document.getElementById(`msg-${lastUserId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
    return () => window.clearTimeout(t);
  }, [lastUserId]);

  const runAnswer = useCallback(
    (scenario: Scenario | null, opts: { refreshed?: boolean } = {}) => {
      const id = nextId.current++;
      const steps = scenario ? buildSteps(scenario, entry, !!opts.refreshed) : [];
      const ai: AiMsg = {
        id,
        role: "ai",
        scenarioId: scenario?.id ?? null,
        status: "thinking",
        progress: 0,
        steps,
        stale: stale && !opts.refreshed,
        refreshed: !!opts.refreshed,
        time: nowTime(),
      };
      setMessages((m) => [...m, ai]);
      setIsGenerating(true);
      const update = (patch: Partial<AiMsg>) =>
        setMessages((m) => m.map((x) => (x.id === id && x.role === "ai" ? { ...x, ...patch } : x)));
      steps.forEach((_, i) => {
        timers.current.push(window.setTimeout(() => update({ progress: i + 1 }), STEP_MS * (i + 1)));
      });
      const doneAt = Math.max(1100, STEP_MS * steps.length + 350);
      timers.current.push(
        window.setTimeout(() => {
          update({ status: "done", progress: steps.length });
          setIsGenerating(false);
        }, doneAt),
      );
    },
    [entry, stale, setIsGenerating],
  );

  const ask = useCallback(
    (text: string) => {
      if (!text.trim() || busy) return;
      setHasStartedChat(true);
      const scenario = matchScenario(text);
      const shown = scenario && scenario.chip === text ? scenario.prompt : text;
      const userMsg: UserMsg = { id: nextId.current++, role: "user", text: shown, time: nowTime() };
      setMessages((m) => [...m, userMsg]);
      runAnswer(scenario);
    },
    [busy, runAnswer, setHasStartedChat],
  );

  const refresh = useCallback(() => {
    if (busy) return;
    setStale(false);
    const userMsg: UserMsg = { id: nextId.current++, role: "user", text: "Refresh the book summary", time: nowTime() };
    setMessages((m) => [...m, userMsg]);
    runAnswer(byId("orient"), { refreshed: true });
  }, [busy, runAnswer]);

  const restart = useCallback(() => {
    clearTimers();
    setMessages([]);
    setIsGenerating(false);
    setHasStartedChat(false);
  }, [setHasStartedChat, setIsGenerating]);

  const changeEntry = (e: Entry | null) => {
    if (!e || e === entry) return;
    setEntry(e);
    restart();
  };

  const activeLayers = useMemo<LayerId[]>(() => {
    const last = [...messages].reverse().find((m): m is AiMsg => m.role === "ai" && m.status === "done" && !!m.scenarioId);
    if (!last?.scenarioId) return [];
    const layers = new Set<LayerId>(byId(last.scenarioId).layers);
    last.steps.forEach((st) => st.layer && layers.add(st.layer));
    return [...layers];
  }, [messages]);

  const welcomeChips = (
    <Stack
      direction="row"
      sx={({ tokens }) => ({
        flexWrap: "wrap",
        justifyContent: "center",
        gap: tokens.semantic.spacing.desktop.gap["1"].value,
        mt: tokens.semantic.spacing.desktop.gap["2"].value,
      })}
    >
      {(entry === "book" ? [...WELCOME_CHIP_IDS.slice(0, 2), "doc", ...WELCOME_CHIP_IDS.slice(2)] : WELCOME_CHIP_IDS).map((id) => {
        const s = byId(id);
        return (
          <Chip
            key={id}
            label={s.chip}
            variant="outlined"
            clickable
            onClick={() => ask(s.chip)}
            icon={<AiSummaryIcon size="md" aria-hidden />}
          />
        );
      })}
    </Stack>
  );

  const chatBox = (
    <AIChatBox
      disabled={busy}
      onSubmit={(prompt) => {
        ask(prompt);
      }}
      onStop={() => {
        clearTimers();
        setIsGenerating(false);
        setMessages((m) => m.filter((x) => !(x.role === "ai" && x.status === "thinking")));
      }}
      leadingActions={
        entry === "book" ? (
          <Chip
            size="small"
            icon={<BookIcon size="md" aria-hidden />}
            label={BOOK.title}
            onDelete={() => changeEntry("home")}
            aria-label={`Context: ${BOOK.title}. Remove to ask about all books.`}
          />
        ) : (
          <Chip size="small" variant="outlined" icon={<BookIcon size="md" aria-hidden />} label="All your books" />
        )
      }
      contentBelow={hasStartedChat ? undefined : welcomeChips}
      slotProps={{
        textField: {
          label: entry === "book" ? "Ask about this book" : "Ask GovernAI",
          placeholder: entry === "book" ? `Ask anything about ${BOOK.title}` : "Ask anything about your board materials",
        },
      }}
    />
  );

  const chatContent = (
    <AIChatContent>
      {messages.map((m) =>
        m.role === "user" ? (
          <AIChatUserMessage
            key={m.id}
            alignment="end"
            message={m.text}
            slotProps={{ root: { id: `msg-${m.id}`, sx: { scrollMarginTop: "24px" } } }}
            header={<AIChatMessageHeader name="Greg" time={m.time} avatar={<AIChatMessageAvatar uniqueId="greg" initials="GH" />} />}
          />
        ) : (
          <AiMessage key={m.id} msg={m} showHow={showHow} onAsk={ask} onRefresh={refresh} />
        ),
      )}
    </AIChatContent>
  );

  return (
    <Stack
      sx={({ tokens }) => ({
        position: "fixed",
        inset: 0,
        background: `linear-gradient(135deg, ${tokens.semantic.color.background.baseGradientStart.value} 30%, ${tokens.semantic.color.background.baseGradientEnd.value} 100%)`,
        color: tokens.semantic.color.type.default.value,
      })}
    >
      {/* Top bar */}
      <Stack
        component="header"
        direction="row"
        sx={({ tokens }) => ({
          alignItems: "center",
          flexWrap: "wrap",
          gap: tokens.semantic.spacing.desktop.gap["3"].value,
          px: tokens.semantic.spacing.desktop.padding["3"].value,
          py: tokens.semantic.spacing.desktop.padding["2"].value,
          borderBottom: `1px solid ${tokens.semantic.color.ui.divider.default.value}`,
          backgroundColor: tokens.semantic.color.surface.default.value,
        })}
      >
        <Link
          href="summary-discovery.html"
          underline="hover"
          sx={({ tokens }) => ({ display: "inline-flex", alignItems: "center", gap: tokens.semantic.spacing.desktop.gap["0_5"].value })}
        >
          <ArrowLeftIcon size="md" aria-hidden />
          <Typography variant="labelSm" component="span">
            Back to discovery
          </Typography>
        </Link>
        <Stack direction="row" sx={({ tokens }) => ({ alignItems: "center", gap: tokens.semantic.spacing.desktop.gap["1"].value, flex: 1, minWidth: 200 })}>
          <Typography variant="labelLg" component="h1">
            Ask GovernAI
          </Typography>
          <Chip size="small" label="Summary demo" />
          <Typography variant="textSm" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
            Meridian Capital Group
          </Typography>
        </Stack>

        <Stack direction="row" sx={({ tokens }) => ({ alignItems: "center", gap: tokens.semantic.spacing.desktop.gap["1"].value })}>
          <Typography variant="textSm" id="entry-label" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
            Opened from
          </Typography>
          <ToggleButtonGroup size="small" exclusive value={entry} onChange={(_, v) => changeEntry(v)} aria-labelledby="entry-label">
            <ToggleButton value="home">Home</ToggleButton>
            <ToggleButton value="book">The book</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <FormControlLabel
          control={<Switch checked={showHow} onChange={(e) => setShowHow(e.target.checked)} />}
          label={<Typography variant="textSm">Show how it works</Typography>}
        />
        <Button variant="outlined" size="small" startIcon={<RefreshIcon size="md" aria-hidden />} onClick={restart}>
          Restart
        </Button>
      </Stack>

      {/* Body */}
      <Stack direction="row" sx={{ flex: 1, minHeight: 0 }}>
        {entry === "book" && <BookPane onAskBook={() => ask(byId("orient").prompt)} onAskDoc={() => ask(byId("doc").prompt)} />}
        <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <AIChatUI
            name="Greg"
            title={entry === "book" ? `what would you like to know about ${BOOK.title}?` : "what would you like to know?"}
            subtitle={
              entry === "book"
                ? `The book summary is ready. It was generated when the book was published on ${BOOK.publishedAt}.`
                : "Ask across your board books. Every answer cites the page it comes from."
            }
            chatBox={chatBox}
            chatContent={chatContent}
          />
        </Box>
        {showHow && <HowItWorksPanel activeLayers={activeLayers} stale={stale} onStaleChange={setStale} />}
      </Stack>
    </Stack>
  );
}
