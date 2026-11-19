import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import {
  AIChatContextProvider,
  useAIChatContext,
} from "@diligentcorp/atlas-react-bundle";

import { adminBooks, type ChatMessage } from "../data/mockData.js";
import {
  mvpSourcesForScope,
  sourceScopeForPath,
  isBookReaderPath,
  type Source,
} from "../components/SourcesFilterButton.js";
import {
  type ChatThread,
  STATIC_CHAT_THREADS,
  CONVERSATION_VARIANTS,
  DIRECTOR_CONVERSATION_VARIANTS,
  DIRECTOR_HOME_CONVERSATION_VARIANTS,
  ONBOARDING_PROMPT,
  ONBOARDING_RICH_BLOCKS,
  matchTriggerResponse,
} from "../data/hybrid-search.constants.js";
import {
  isDemoPath,
  DEMO_STEPS,
  DEMO_DIRECTOR,
  DEMO_THINKING_LABEL_MS,
  matchDemoStep,
  type DemoStep,
} from "../data/demo-agai-integration-usecases.js";
import {
  isWsDemoPath,
  WS_DEMO_STEPS,
  WS_DEMO_DIRECTOR,
  WS_DEMO_THINKING_LABEL_MS,
  matchWsDemoStep,
  WS_WEB_OFFERS,
} from "../data/demo-web-search.js";
import {
  type ReasoningData,
  WEB_REASONING_STEP_MS,
  WEB_SCENARIO_QUESTION,
  WEB_SCENARIO_THREAD_TITLE,
  WEB_OFFER_REASONING,
  WEB_OFFER_CONTENT,
  WEB_OFFER_SOURCES,
  WEB_ANSWER_REASONING,
  WEB_DIRECT_REASONING,
  WEB_ANSWER_CONTENT,
  WEB_ANSWER_SOURCES,
  WEB_NOT_USED_REASONING,
} from "../data/web-search-scenario.js";
import WebSearchDisclosureDialog from "../components/webSearch/WebSearchDisclosureDialog.js";
import { DEFAULT_SOURCE_PACK_IDS } from "../data/web-search-sources.js";

export type SmartAssistAudience = "admin" | "director";

const COMPOSER_PLACEHOLDER = "Ask anything about your board materials";

// ─── Context shape ────────────────────────────────────────────────────────────

interface SmartAssistContextValue {
  messages: ChatMessage[];
  sources: Source[];
  isGenerating: boolean;
  prompt: string;
  setPrompt: (value: string) => void;
  // Cross-surface "focus the composer" signal. Selecting a prompt template
  // bumps the nonce via requestComposerFocus(); whichever composer is mounted
  // consumes it once (consumeComposerFocus) and focuses its input. The
  // consume-once design covers the case where selecting a template also opens
  // a surface (e.g. the admin home rail opening the panel), so the focus lands
  // after the input mounts rather than being lost.
  composerFocusNonce: number;
  requestComposerFocus: () => void;
  consumeComposerFocus: () => boolean;
  // Opening personalization from the docked panel promotes Smart Assist to the
  // full-screen overlay (via the panel's own onExpand) and shows the
  // personalization page there. This is the signal half: same consume-once
  // nonce design as the composer focus signal — the overlay consumes the
  // request once it's the visible surface.
  requestPersonalization: () => void;
  consumePersonalizationRequest: () => boolean;
  panelOpen: boolean;
  overlayOpen: boolean;
  openPanel: () => void;
  openSmartAssist: () => void;
  openInBook: () => void;
  closePanel: () => void;
  closeOverlay: () => void;
  expandToOverlay: () => void;
  collapseToPanel: () => void;
  // Session-only memory of the director closing GovernAI inside a book. Once
  // true, re-entering a book keeps the panel closed until the page is
  // refreshed (in-memory state resets on full reload).
  bookPanelDismissed: boolean;
  setBookPanelDismissed: (v: boolean) => void;
  handleSend: (text: string, opts?: { newSession?: boolean }) => void;
  handleToggleSource: (id: string) => void;
  // ─── MVP conversation scope (book vs. global) ──────────────────────────────
  // The source selector shows only inside a book; outside it, a book-scoped
  // chat surfaces as a removable context chip (see SourcesFilterButton).
  inBook: boolean;                  // current route is a book reader
  currentBookTitle: string | null;  // title of the book currently open (route)
  bookScopeTitle: string | null;    // book the chat is scoped to (chip); null = global
  isBookScope: boolean;             // whether the chat is scoped to a book
  setBookScope: () => void;
  setGlobalScope: () => void;
  composerPlaceholder: string;      // scope-aware composer placeholder (MVP)
  resetChat: () => void;
  deleteAllThreads: () => void;
  loadThread: (messages: ChatMessage[], threadId?: string) => void;
  threads: ChatThread[];
  // ID of the thread currently awaiting an AI-generated title. The thread is
  // excluded from `threads` until the title resolves; once it arrives it becomes
  // visible in the list with its real name.
  generatingTitleForThreadId: string | null;
  chatTimestamp: string | null;
  threadSplitIndex: number | null;
  currentThreadId: string | null;
  overlayLeftPanelOpen: boolean;
  setOverlayLeftPanelOpen: (open: boolean) => void;
  activeTab: number;
  setActiveTab: (v: number) => void;
  selectedInsight: "summary" | "prep" | "risk" | "audit" | null;
  setSelectedInsight: (v: "summary" | "prep" | "risk" | "audit" | null) => void;
  audience: SmartAssistAudience;
  setAudience: (v: SmartAssistAudience) => void;
  // ─── AGAI integration use cases demo (the director view) ───────────────────────────────
  // Everything below is inert outside demo mode.
  demoMode: boolean;
  /** True on the web-search demo's own path. Picks which scripted step array,
   *  persona and copy are active; false falls back to the integration-usecases demo. */
  wsDemoMode: boolean;
  /** The scripted steps for whichever demo is active (integration usecases or web search). */
  activeDemoSteps: DemoStep[];
  /** The persona shown on messages for whichever demo is active. */
  activeDemoDirector: { name: string; initials: string; id: string };
  /** Scripted answers delivered so far (= index of the next step to prompt). */
  demoStepsDone: number;
  /** While a scripted answer is pending: which step is generating and which of
   *  its reasoning steps is active. Null otherwise. */
  demoPending: { step: number; active: number } | null;
  /** Outcome of the step 6 share confirmation. */
  demoShare: "pending" | "shared" | "cancelled";
  resolveDemoShare: (v: "shared" | "cancelled") => void;
  /** Presenter notes panel (header notes button toggles it). Persists for the session. */
  demoNotesOpen: boolean;
  setDemoNotesOpen: (open: boolean) => void;
  /** Start over: fresh chat, share card back to pending. */
  restartDemo: () => void;
  /** Web-search demo only: clicking the empty composer previews the next
   *  scripted prompt. Once a prompt is loaded it's left alone until sent —
   *  only an empty composer cycles. Resyncs to the next unanswered step
   *  whenever one lands. No-op outside wsDemoMode. */
  cycleComposerPrompt: () => void;
  // ─── Web search ────────────────────────────────────────────────────────────
  // Off by default. Once on, it stays on across chats until the user turns it
  // off (session-only in this prototype). The first time it's turned on, the
  // disclosure dialog sets the boundary of internet use.
  webSearchEnabled: boolean;
  /** Turn web search on; shows the disclosure dialog first if not yet accepted. */
  turnOnWebSearch: (onEnabled?: () => void) => void;
  turnOffWebSearch: () => void;
  /** Accept or decline the in-answer offer to search the web. */
  respondToWebOffer: (messageId: string, accept: boolean) => void;
  /** Live reasoning while a scripted web search answer is generating. */
  reasoningPending: (ReasoningData & { active: number }) | null;
  /** Composer Stop: cancels a scripted answer that is still generating. */
  stopGenerating: () => void;
  /** Composer-attached banner nudging toward feedback, after enough web searches in this chat. */
  showSourceFeedbackBanner: boolean;
  dismissSourceFeedbackBanner: () => void;
  // ─── Web search: sources in scope ──────────────────────────────────────────
  // One site, one admin-configured list — no per-board variant. Set in
  // Organization settings → Artificial intelligence (AI); read-only for
  // directors, shown to both audiences as "Sources in scope".
  enabledSourcePackIds: string[];
  setEnabledSourcePackIds: (ids: string[]) => void;
  customPeers: string[];
  setCustomPeers: (peers: string[]) => void;
}

const SmartAssistContext = createContext<SmartAssistContextValue | null>(null);

const formatChatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

// Resolve the active book's title from a reader path (.../books/:id) for the
// scope-switch notice. directorBooks is a subset of adminBooks, so adminBooks
// covers both readers. Returns undefined for non-reader paths.
const bookTitleForPath = (pathname: string): string | undefined => {
  const id = pathname.match(/\/books\/([^/]+)/)?.[1];
  return id ? adminBooks.find((b) => b.id === id)?.title : undefined;
};

export function useSmartAssist() {
  const ctx = useContext(SmartAssistContext);
  if (!ctx) throw new Error("useSmartAssist must be inside SmartAssistProvider");
  return ctx;
}

// ─── Inner provider (needs to be inside AIChatContextProvider) ────────────────

function SmartAssistProviderInner({ children }: { children: React.ReactNode }) {
  const { setIsGenerating, isGenerating, setPrompt, prompt } = useAIChatContext();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const location = useLocation();
  // The director view IS the demo: no URL flag, so it survives any navigation.
  const demoMode = isDemoPath(location.pathname);
  // The web-search demo is a sub-path of the director demo — its own persona
  // and scripted steps, same presenter-notes/share/restart machinery.
  const wsDemoMode = isWsDemoPath(location.pathname);
  const activeDemoSteps = wsDemoMode ? WS_DEMO_STEPS : DEMO_STEPS;
  const activeDemoDirector = wsDemoMode ? WS_DEMO_DIRECTOR : DEMO_DIRECTOR;
  const [demoPending, setDemoPending] = useState<{ step: number; active: number } | null>(null);
  const [demoNotesOpen, setDemoNotesOpenState] = useState(
    () => sessionStorage.getItem("agai-integration-usecases-demo-notes-open") !== "0",
  );
  const setDemoNotesOpen = (open: boolean) => {
    setDemoNotesOpenState(open);
    sessionStorage.setItem("agai-integration-usecases-demo-notes-open", open ? "1" : "0");
  };
  const [demoShare, setDemoShare] = useState<"pending" | "shared" | "cancelled">("pending");
  const demoTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearDemoTimers = () => {
    demoTimersRef.current.forEach(clearTimeout);
    demoTimersRef.current = [];
    setDemoPending(null);
  };
  // ─── Web search state ──────────────────────────────────────────────────────
  // The disclosure dialog pops up on every search activation unless the user
  // checked "Don't show this again" — that choice is persisted so it sticks
  // across reloads.
  const WEB_DISCLOSURE_DISMISSED_KEY = "webSearchDisclosureDismissed";
  const readWebDisclosureDismissed = () => {
    try {
      return localStorage.getItem(WEB_DISCLOSURE_DISMISSED_KEY) === "true";
    } catch {
      return false;
    }
  };
  const writeWebDisclosureDismissed = () => {
    try {
      localStorage.setItem(WEB_DISCLOSURE_DISMISSED_KEY, "true");
    } catch {
      /* localStorage unavailable — preference just isn't persisted */
    }
  };
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [enabledSourcePackIds, setEnabledSourcePackIds] = useState<string[]>(DEFAULT_SOURCE_PACK_IDS);
  const [customPeers, setCustomPeers] = useState<string[]>([]);
  const webDisclosureDismissedRef = useRef(readWebDisclosureDismissed());
  const [webDisclosureOpen, setWebDisclosureOpen] = useState(false);
  const afterWebEnabledRef = useRef<(() => void) | null>(null);
  const [reasoningPending, setReasoningPending] = useState<(ReasoningData & { active: number }) | null>(null);
  // Composer-attached feedback banner: counts actual web searches (not offers)
  // in the current chat; shows after the 2nd, resets when the thread changes.
  const [webSearchCount, setWebSearchCount] = useState(0);
  const [feedbackBannerDismissed, setFeedbackBannerDismissed] = useState(false);
  const showSourceFeedbackBanner = webSearchCount >= 2 && !feedbackBannerDismissed;
  const webTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearWebTimers = () => {
    webTimersRef.current.forEach(clearTimeout);
    webTimersRef.current = [];
    setReasoningPending(null);
  };
  const turnOnWebSearch = (onEnabled?: () => void) => {
    if (webDisclosureDismissedRef.current) {
      setWebSearchEnabled(true);
      onEnabled?.();
      return;
    }
    afterWebEnabledRef.current = onEnabled ?? null;
    setWebDisclosureOpen(true);
  };
  const confirmWebDisclosure = (dontShowAgain: boolean) => {
    if (dontShowAgain) {
      webDisclosureDismissedRef.current = true;
      writeWebDisclosureDismissed();
    }
    setWebDisclosureOpen(false);
    setWebSearchEnabled(true);
    const after = afterWebEnabledRef.current;
    afterWebEnabledRef.current = null;
    after?.();
  };
  const cancelWebDisclosure = (dontShowAgain: boolean) => {
    if (dontShowAgain) {
      webDisclosureDismissedRef.current = true;
      writeWebDisclosureDismissed();
    }
    setWebDisclosureOpen(false);
    afterWebEnabledRef.current = null;
  };
  const nowTime = () => new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  // Stashes what to run if a given offer message is accepted. Shared by any
  // caller of runScriptedAnswer with a webOffer — today that's the admin SEC
  // scenario (falls back to WEB_ANSWER_REASONING below when nothing is
  // stashed) and the director web-search demo's J2/J3 offers.
  const pendingWsAnswerRef = useRef<
    Record<string, { reasoning: ReasoningData; richContent: ChatMessage["richContent"]; sources: ChatMessage["sources"]; demoStep?: number }>
  >({});
  // Plays a scripted answer: reasoning steps go live one by one, then the answer
  // lands with the reasoning kept on it as an audit trail.
  const runScriptedAnswer = (
    reasoning: ReasoningData,
    answer: Pick<ChatMessage, "richContent" | "sources" | "webOffer" | "webOfferTitle" | "demoStep"> & { id?: string; isWebSearch?: boolean },
  ) => {
    clearWebTimers();
    setIsGenerating(true);
    setReasoningPending({ ...reasoning, active: 0 });
    reasoning.steps.forEach((_, i) => {
      if (i === 0) return;
      webTimersRef.current.push(setTimeout(() => setReasoningPending({ ...reasoning, active: i }), i * WEB_REASONING_STEP_MS));
    });
    webTimersRef.current.push(setTimeout(() => {
      webTimersRef.current = [];
      setReasoningPending(null);
      const { id, isWebSearch, ...rest } = answer;
      setMessages((prev) => [
        ...prev,
        { id: id ?? `${Date.now()}-ai`, role: "ai" as const, content: "", timestamp: nowTime(), reasoning, ...rest },
      ]);
      if (isWebSearch) setWebSearchCount((c) => c + 1);
      setIsGenerating(false);
    }, reasoning.steps.length * WEB_REASONING_STEP_MS));
  };
  const respondToWebOffer = (messageId: string, accept: boolean) => {
    hasInteractedWithThread.current = true;
    const mark = (status: ChatMessage["webOffer"]) =>
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, webOffer: status } : m)));
    if (!accept) { mark("declined"); return; }
    const pending = pendingWsAnswerRef.current[messageId];
    turnOnWebSearch(() => {
      mark("accepted");
      if (pending) {
        runScriptedAnswer(pending.reasoning, { richContent: pending.richContent, sources: pending.sources, demoStep: pending.demoStep, isWebSearch: true });
        delete pendingWsAnswerRef.current[messageId];
      } else {
        runScriptedAnswer(WEB_ANSWER_REASONING, { richContent: WEB_ANSWER_CONTENT, sources: WEB_ANSWER_SOURCES, isWebSearch: true });
      }
    });
  };

  const inBook = isBookReaderPath(location.pathname);
  const currentBookTitle = inBook ? (bookTitleForPath(location.pathname) ?? "This book") : null;
  const [sources, setSources] = useState<Source[]>(() =>
    mvpSourcesForScope(sourceScopeForPath(location.pathname), bookTitleForPath(location.pathname)),
  );
  // ─── Conversation-pinned scope (MVP) ────────────────────────────────────────
  // Scope belongs to the conversation, not the page. While a chat is new/empty
  // the default selection follows the current location; the first message PINS
  // it, after which navigation never changes scope silently. A pinned book-scoped
  // chat carried outside its book surfaces as a removable context chip (see
  // SourcesFilterButton); the selector itself is only shown inside a book.
  const scopePinnedRef = useRef(false); // false while chat is new/empty

  // While the chat is empty and unpinned, the default selection follows the
  // current location. Once pinned (first send) or non-empty, this bails so the
  // conversation's scope is held.
  useEffect(() => {
    if (scopePinnedRef.current || messages.length > 0) return;
    setSources(mvpSourcesForScope(sourceScopeForPath(location.pathname), bookTitleForPath(location.pathname)));
  }, [location.pathname, messages.length]);

  // Re-seed the (unpinned) scope when a fresh conversation begins, from the
  // current location.
  const reseedScopeForFreshChat = () => {
    scopePinnedRef.current = false;
    setSources(mvpSourcesForScope(sourceScopeForPath(location.pathname), bookTitleForPath(location.pathname)));
  };

  // MVP scope readouts + setters, derived from the two-source selection.
  const bookSource = sources.find((s) => s.id === "this-book");
  const isBookScope = bookSource?.enabled === true;
  const bookScopeTitle = isBookScope ? (bookSource?.label ?? null) : null;
  const setBookScope = () => setSources(mvpSourcesForScope("book", currentBookTitle ?? "This book"));
  const setGlobalScope = () => setSources(mvpSourcesForScope("home"));
  const composerPlaceholder = COMPOSER_PLACEHOLDER;
  const [variantIndex, setVariantIndex] = useState(0);
  const [audience, setAudienceState] = useState<SmartAssistAudience>("admin");
  const audienceRef = useRef<SmartAssistAudience>("admin");
  audienceRef.current = audience;
  // Switching persona (director ↔ admin) is a fresh start: wipe all Smart
  // Assist UI + conversation state so e.g. an Insights tab or GovernAI view
  // opened as a director doesn't carry over into the admin experience.
  const setAudience = (v: SmartAssistAudience) => {
    if (audienceRef.current === v) return;
    audienceRef.current = v;
    setAudienceState(v);
    clearWebTimers();
    setIsGenerating(false);
    setVariantIndex(0);
    setActiveTab(0);
    setSelectedInsight(null);
    setPanelOpen(false);
    setOverlayOpen(false);
    setPreferredMode(null);
    setBookPanelDismissed(false);
    setMessages([]);
    setChatTimestamp(null);
    setCurrentThreadId(null);
    setThreadSplitIndex(null);
    hasInteractedWithThread.current = false;
    reseedScopeForFreshChat();
  };
  const [panelOpen, setPanelOpen] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  // Session-only preference for how Smart Assist opens. `null` means the user
  // hasn't picked a mode yet, so each surface falls back to its own default
  // (overlay outside a book, panel inside a book). Once the user expands or
  // collapses, the explicit choice is remembered everywhere — including the
  // book — until the page is refreshed.
  const [preferredMode, setPreferredMode] = useState<"overlay" | "panel" | null>(null);
  const [userThreads, setUserThreads] = useState<ChatThread[]>([]);
  const [staticThreadsCleared, setStaticThreadsCleared] = useState(false);
  const [generatingTitleForThreadId, setGeneratingTitleForThreadId] = useState<string | null>(null);
  const [chatTimestamp, setChatTimestamp] = useState<string | null>(null);
  const [threadSplitIndex, setThreadSplitIndex] = useState<number | null>(null);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  // A new or different thread starts the web-search count and banner fresh.
  useEffect(() => {
    setWebSearchCount(0);
    setFeedbackBannerDismissed(false);
  }, [currentThreadId]);
  const [overlayLeftPanelOpen, setOverlayLeftPanelOpen] = useState(true);
  const [bookPanelDismissed, setBookPanelDismissed] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedInsight, setSelectedInsight] = useState<"summary" | "prep" | "risk" | null>(null);
  // Composer focus signal (see context type for rationale). The consumed ref
  // lives at provider level so it survives a composer mounting/unmounting.
  const [composerFocusNonce, setComposerFocusNonce] = useState(0);
  const composerFocusConsumed = useRef(0);
  const requestComposerFocus = useCallback(() => setComposerFocusNonce((n) => n + 1), []);
  // Identity changes only when the nonce does, so a consumer's focus effect
  // re-runs on a new request but not on every unrelated provider render.
  const consumeComposerFocus = useCallback(() => {
    if (composerFocusNonce > composerFocusConsumed.current) {
      composerFocusConsumed.current = composerFocusNonce;
      return true;
    }
    return false;
  }, [composerFocusNonce]);
  // Personalization-fullscreen signal (see context type for rationale).
  const [personalizationNonce, setPersonalizationNonce] = useState(0);
  const personalizationConsumed = useRef(0);
  const consumePersonalizationRequest = useCallback(() => {
    if (personalizationNonce > personalizationConsumed.current) {
      personalizationConsumed.current = personalizationNonce;
      return true;
    }
    return false;
  }, [personalizationNonce]);
  // Tracks last activity time for each thread (overrides updatedAt for sort order)
  const [threadLastActivity, setThreadLastActivity] = useState<Record<string, string>>({});
  // True only after the user sends a message in the current thread; reset on thread load/new chat
  const hasInteractedWithThread = useRef(false);
  // Dedup guard: tracks the timestamp of the last handleSend call to prevent
  // accidental double-fires (e.g. Enter + button click, or StrictMode double-invoke).
  const lastSendAtRef = useRef(0);

  // If the user closes Smart Assist and then navigates to a different page,
  // the next time they open it should be a brand-new session — fresh chat,
  // Insights back at the hub. Leaving it open across nav, or closing and
  // reopening on the same page, both preserve the existing session.
  const lastPathRef = useRef(location.pathname);
  const [pendingFreshOpen, setPendingFreshOpen] = useState(false);
  useEffect(() => {
    if (lastPathRef.current !== location.pathname) {
      if (!panelOpen && !overlayOpen) setPendingFreshOpen(true);
      lastPathRef.current = location.pathname;
    }
  }, [location.pathname, panelOpen, overlayOpen]);
  const consumeFreshOpen = () => {
    if (!pendingFreshOpen) return;
    clearWebTimers();
    setIsGenerating(false);
    setMessages([]);
    setChatTimestamp(null);
    setCurrentThreadId(null);
    setThreadSplitIndex(null);
    hasInteractedWithThread.current = false;
    setActiveTab(0);
    setSelectedInsight(null);
    setPendingFreshOpen(false);
    reseedScopeForFreshChat();
  };

  const threads = [...userThreads, ...(staticThreadsCleared ? [] : STATIC_CHAT_THREADS)]
    .filter((t) => t.id !== generatingTitleForThreadId && !t.projectId)
    .sort((a, b) => {
      const aDate = threadLastActivity[a.id] ?? a.updatedAt;
      const bDate = threadLastActivity[b.id] ?? b.updatedAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

  const handleToggleSource = (id: string) =>
    setSources((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));

  // Sync user thread messages and last-activity whenever AI finishes responding,
  // but only if the user actually sent a message (not just selected the thread).
  useEffect(() => {
    if (currentThreadId && messages.length > 0 && !isGenerating && hasInteractedWithThread.current) {
      const now = new Date().toISOString();
      setUserThreads((prev) => prev.map((t) =>
        t.id === currentThreadId
          ? { ...t, messages: [...messages], updatedAt: now }
          : t
      ));
      setThreadLastActivity((prev) => ({ ...prev, [currentThreadId]: now }));
    }
  }, [messages, isGenerating, currentThreadId]);

  const handleSend = (text: string, opts?: { newSession?: boolean }) => {
    const now = Date.now();
    if (now - lastSendAtRef.current < 500) return;
    // A scripted web search answer is still streaming its reasoning.
    if (reasoningPending) return;
    lastSendAtRef.current = now;
    hasInteractedWithThread.current = true;
    // Sending a message is always a chat action — make sure Smart Assist is on
    // the chat tab so the response is visible, not stuck on the Insights tab
    // (e.g. after opening a Smart Summary earlier this session).
    setActiveTab(0);
    setSelectedInsight(null);

    const isOnboarding = text.trim() === ONBOARDING_PROMPT;
    // AGAI integration use cases demo (or the web-search demo): an exact
    // scripted prompt returns its authored answer.
    const demoIdx = wsDemoMode ? matchWsDemoStep(text) : demoMode ? matchDemoStep(text) : -1;
    const demoStep = demoIdx >= 0 ? activeDemoSteps[demoIdx] : null;
    const triggerMatch = demoStep
      ? { threadTitle: demoStep.threadTitle, sources: demoStep.sources, richContent: demoStep.richContent }
      : !isOnboarding ? matchTriggerResponse(text) : null;
    const variantPool = audienceRef.current === "director"
      ? (inBook ? DIRECTOR_CONVERSATION_VARIANTS : DIRECTOR_HOME_CONVERSATION_VARIANTS)
      : CONVERSATION_VARIANTS;
    const responseVariant = variantPool[variantIndex % variantPool.length];
    // Web search scenario: the first question of a new admin chat (outside the
    // director demo) is the scripted "not enough in your board materials" case.
    const isFreshChat = opts?.newSession || messages.length === 0;
    const webScenario = audienceRef.current === "admin" && !demoMode && !isOnboarding && !triggerMatch && isFreshChat;

    // Build the user bubble — for trigger matches use the verbatim typed text.
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: isOnboarding ? text : (triggerMatch ? text : webScenario ? WEB_SCENARIO_QUESTION : responseVariant.userQuestion),
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    };

    // `newSession` forces a fresh thread even if a previous conversation is
    // still in state — used by the home-page widget, which is always a new
    // chat entry point regardless of what was open before.
    const startNew = opts?.newSession || messages.length === 0;
    if (startNew) {
      // First message pins the conversation's scope to whatever is selected
      // (auto-default or a manual override) at the location it began.
      scopePinnedRef.current = true;
      // New chat: auto-create thread, date shown at top
      const now = new Date().toISOString();
      // The demo story happens on Thursday, November 12, 2026.
      setChatTimestamp(formatChatDate(demoMode ? "2026-11-12T12:00:00" : now));
      setThreadSplitIndex(null);
      const id = `u-${Date.now()}`;
      // Create thread with an empty title so the list hides it until the title
      // arrives. Title is generated asynchronously (simulated AI call).
      setUserThreads((prev) => [{ id, title: "", createdAt: now, updatedAt: now, messages: [userMsg] }, ...prev]);
      setCurrentThreadId(id);
      setThreadLastActivity((prev) => ({ ...prev, [id]: now }));
      setGeneratingTitleForThreadId(id);
      // Simulate async AI title generation using the variant's pre-authored
      // ≤5-word title, then reveal the thread in the list.
      setTimeout(() => {
        const title = isOnboarding
          ? "Welcome"
          : (triggerMatch ? triggerMatch.threadTitle : webScenario ? WEB_SCENARIO_THREAD_TITLE : responseVariant.threadTitle);
        setUserThreads((prev) =>
          prev.map((t) => (t.id === id ? { ...t, title } : t)),
        );
        setGeneratingTitleForThreadId(null);
      }, 800);
    } else {
      // Continuing a loaded thread: show date before first new message, unless already used today
      if (!chatTimestamp && threadSplitIndex !== -1) setChatTimestamp(formatChatDate(new Date().toISOString()));
      if (currentThreadId) {
        setThreadLastActivity((prev) => ({ ...prev, [currentThreadId]: new Date().toISOString() }));
      }
    }
    setMessages((prev) => (startNew ? [userMsg] : [...prev, userMsg]));
    setPrompt("");
    setIsGenerating(true);

    if (webScenario) {
      // Web already on: search straight away. Otherwise answer from board
      // materials and offer to search the web.
      if (webSearchEnabled) {
        runScriptedAnswer(WEB_DIRECT_REASONING, { richContent: WEB_ANSWER_CONTENT, sources: WEB_ANSWER_SOURCES, isWebSearch: true });
      } else {
        runScriptedAnswer(WEB_OFFER_REASONING, { richContent: WEB_OFFER_CONTENT, sources: WEB_OFFER_SOURCES, webOffer: "pending" });
      }
      return;
    }

    // Web-search demo: J2/J3 go through the same offer/disclosure/search
    // mechanism as the admin scenario above, keyed by the matched step
    // instead of "first message of a fresh chat". J1 has no entry here and
    // falls through to the flat scripted-answer path below unchanged.
    const wsOfferCfg = wsDemoMode && demoIdx >= 0 ? WS_WEB_OFFERS[demoIdx] : undefined;
    if (wsOfferCfg) {
      if (webSearchEnabled) {
        runScriptedAnswer(wsOfferCfg.directReasoning, { richContent: wsOfferCfg.answerContent, sources: wsOfferCfg.answerSources, demoStep: demoIdx, isWebSearch: true });
      } else {
        const offerId = `${Date.now()}-ai`;
        pendingWsAnswerRef.current[offerId] = {
          reasoning: wsOfferCfg.answerReasoning,
          richContent: wsOfferCfg.answerContent,
          sources: wsOfferCfg.answerSources,
          demoStep: demoIdx,
        };
        runScriptedAnswer(wsOfferCfg.offerReasoning, {
          id: offerId,
          richContent: wsOfferCfg.offerContent,
          sources: wsOfferCfg.offerSources,
          webOffer: "pending",
          webOfferTitle: wsOfferCfg.webOfferTitle,
        });
      }
      return;
    }

    // Scripted demo answers show each thinking label in turn before the answer.
    const stepMs = wsDemoMode ? WS_DEMO_THINKING_LABEL_MS : DEMO_THINKING_LABEL_MS;
    const answerDelay = demoStep ? demoStep.reasoning.length * stepMs : 1800;
    if (demoStep) {
      clearDemoTimers();
      if (demoStep.action === "share") setDemoShare("pending");
      setDemoPending({ step: demoIdx, active: 0 });
      demoStep.reasoning.forEach((_, i) => {
        if (i === 0) return;
        demoTimersRef.current.push(
          setTimeout(() => setDemoPending({ step: demoIdx, active: i }), i * stepMs),
        );
      });
    }

    const answerTimer = setTimeout(() => {
      if (demoStep) setDemoPending(null);
      const richContent = isOnboarding
        ? ONBOARDING_RICH_BLOCKS
        : (triggerMatch ? triggerMatch.richContent : responseVariant.richContent);
      const sources = isOnboarding
        ? []
        : (triggerMatch ? triggerMatch.sources : responseVariant.sources);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "ai" as const,
          content: "",
          richContent,
          sources,
          timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          ...(demoStep ? { demoStep: demoIdx } : {}),
          // Admin chat with web search on: say the web wasn't needed for this one.
          ...(webSearchEnabled && audienceRef.current === "admin" && !demoMode && !isOnboarding ? { reasoning: WEB_NOT_USED_REASONING } : {}),
        },
      ]);
      if (!isOnboarding && !triggerMatch) setVariantIndex((i) => (i + 1) % variantPool.length);
      setIsGenerating(false);
    }, answerDelay);
    if (demoStep) demoTimersRef.current.push(answerTimer);
  };

  const demoStepsDone = demoMode ? messages.filter((m) => m.demoStep !== undefined).length : 0;

  // Web-search demo: clicking the empty composer drops in the next scripted
  // prompt. Once a prompt is loaded, further clicks (to position the cursor,
  // re-focus, or interact with the Tools menu) leave it alone until it's sent
  // — only an empty composer previews the next unanswered step, which also
  // resyncs whenever one lands.
  const [wsCycleOffset, setWsCycleOffset] = useState(0);
  useEffect(() => { setWsCycleOffset(0); }, [demoStepsDone]);
  const lastCycleAtRef = useRef(0);
  const cycleComposerPrompt = () => {
    if (!wsDemoMode || isGenerating || prompt.trim()) return;
    const now = Date.now();
    // A single click fires both onFocus and onClick on the same composer
    // wrapper — debounce so one click advances exactly one step.
    if (now - lastCycleAtRef.current < 150) return;
    lastCycleAtRef.current = now;
    const maxOffset = Math.max(activeDemoSteps.length - 1 - demoStepsDone, 0);
    const idx = Math.min(demoStepsDone + wsCycleOffset, activeDemoSteps.length - 1);
    const step = activeDemoSteps[idx];
    if (!step) return;
    setPrompt(step.prompt);
    setWsCycleOffset((o) => Math.min(o + 1, maxOffset));
  };

  const resetDemoState = () => {
    clearDemoTimers();
    clearWebTimers();
    setDemoShare("pending");
    setIsGenerating(false);
    setWsCycleOffset(0);
  };

  return (
    <SmartAssistContext.Provider
      value={{
        messages,
        sources,
        isGenerating,
        prompt,
        setPrompt,
        composerFocusNonce,
        requestComposerFocus,
        consumeComposerFocus,
        requestPersonalization: () => setPersonalizationNonce((n) => n + 1),
        consumePersonalizationRequest,
        panelOpen,
        overlayOpen,
        openPanel: () => { consumeFreshOpen(); setPanelOpen(true); },
        openSmartAssist: () => {
          consumeFreshOpen();
          // Outside a book: default to overlay unless the user chose panel.
          if (preferredMode === "panel") setPanelOpen(true);
          else setOverlayOpen(true);
        },
        openInBook: () => {
          consumeFreshOpen();
          // Inside a book: default to the docked panel unless the user chose overlay.
          if (preferredMode === "overlay") setOverlayOpen(true);
          else setPanelOpen(true);
        },
        closePanel: () => setPanelOpen(false),
        closeOverlay: () => setOverlayOpen(false),
        expandToOverlay: () => { setPanelOpen(false); setOverlayOpen(true); setPreferredMode("overlay"); },
        collapseToPanel: () => { setOverlayOpen(false); setPanelOpen(true); setPreferredMode("panel"); },
        bookPanelDismissed,
        setBookPanelDismissed,
        handleSend,
        handleToggleSource,
        inBook,
        currentBookTitle,
        bookScopeTitle,
        isBookScope,
        setBookScope,
        setGlobalScope,
        composerPlaceholder,
        resetChat: () => {
          resetDemoState();
          setMessages([]);
          setChatTimestamp(null);
          setCurrentThreadId(null);
          setThreadSplitIndex(null);
          hasInteractedWithThread.current = false;
          reseedScopeForFreshChat();
        },
        deleteAllThreads: () => {
          resetDemoState();
          setUserThreads([]);
          setStaticThreadsCleared(true);
          setMessages([]);
          setChatTimestamp(null);
          setCurrentThreadId(null);
          setThreadSplitIndex(null);
          hasInteractedWithThread.current = false;
          reseedScopeForFreshChat();
        },
        loadThread: (msgs: ChatMessage[], threadId?: string) => {
          resetDemoState();
          hasInteractedWithThread.current = false;
          setMessages(msgs);
          setChatTimestamp(null);
          setCurrentThreadId(threadId ?? null);
          const usedToday = threadId && threadLastActivity[threadId]
            ? new Date(threadLastActivity[threadId]).toDateString() === new Date().toDateString()
            : false;
          // -1 = already used today, skip separator; ≥0 = separator before first new message
          setThreadSplitIndex(usedToday ? -1 : msgs.length);
          // A loaded thread is an existing conversation: pin so navigation
          // holds its scope. (Per-thread scope isn't persisted in this MVP, so
          // the chip/dropdown reflects the current selection.)
          scopePinnedRef.current = true;
        },
        threads,
        generatingTitleForThreadId,
        chatTimestamp,
        threadSplitIndex,
        currentThreadId,
        overlayLeftPanelOpen,
        setOverlayLeftPanelOpen,
        activeTab,
        setActiveTab,
        selectedInsight,
        setSelectedInsight,
        audience,
        setAudience,
        demoMode,
        wsDemoMode,
        activeDemoSteps,
        activeDemoDirector,
        demoStepsDone,
        demoPending,
        demoNotesOpen,
        setDemoNotesOpen,
        demoShare,
        resolveDemoShare: setDemoShare,
        restartDemo: () => {
          resetDemoState();
          setMessages([]);
          setChatTimestamp(null);
          setCurrentThreadId(null);
          setThreadSplitIndex(null);
          hasInteractedWithThread.current = false;
          setPrompt("");
          reseedScopeForFreshChat();
        },
        cycleComposerPrompt,
        webSearchEnabled,
        turnOnWebSearch,
        turnOffWebSearch: () => setWebSearchEnabled(false),
        respondToWebOffer,
        reasoningPending,
        stopGenerating: () => {
          clearDemoTimers();
          clearWebTimers();
          setIsGenerating(false);
        },
        showSourceFeedbackBanner,
        dismissSourceFeedbackBanner: () => setFeedbackBannerDismissed(true),
        enabledSourcePackIds,
        setEnabledSourcePackIds,
        customPeers,
        setCustomPeers,
      }}
    >
      {children}
      <WebSearchDisclosureDialog open={webDisclosureOpen} onConfirm={confirmWebDisclosure} onCancel={cancelWebDisclosure} />
    </SmartAssistContext.Provider>
  );
}

// ─── Exported provider ────────────────────────────────────────────────────────

export function SmartAssistProvider({ children }: { children: React.ReactNode }) {
  return (
    <AIChatContextProvider>
      <SmartAssistProviderInner>{children}</SmartAssistProviderInner>
    </AIChatContextProvider>
  );
}
