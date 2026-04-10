'use client';

/**
 * CopilotProvider — global React context for the AI copilot state.
 *
 * Manages conversation state, streaming, panel visibility,
 * conversation persistence, auto-save, and auto-title generation.
 *
 * Updated for AI SDK v6: uses @ai-sdk/react with UIMessage,
 * sendMessage, and status-based loading detection.
 *
 * @module components/shared/CopilotProvider
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';
import { useChat, type UIMessage } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { usePathname } from 'next/navigation';

/* ─────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────── */

interface EntityContext {
  type: string;
  name: string;
  id: string;
}

interface SavedConversation {
  id: string;
  title: string | null;
  status: string;
  model: string;
  total_input_tokens: number;
  total_output_tokens: number;
  estimated_cost_usd: number;
  created_at: string;
  updated_at: string;
}

interface CopilotContextValue {
  /** Whether the copilot panel is visible */
  isOpen: boolean;
  /** Toggle panel visibility */
  toggle: () => void;
  /** Open the panel, optionally with a pre-filled prompt */
  open: (initialPrompt?: string) => void;
  /** Close the panel */
  close: () => void;
  /** Chat messages */
  messages: UIMessage[];
  /** Current input value (locally managed) */
  input: string;
  /** Set input value */
  setInput: (value: string) => void;
  /** Submit the current message */
  handleSubmit: (e?: React.FormEvent) => void;
  /** Whether a response is being streamed */
  isLoading: boolean;
  /** Clear conversation history */
  clearMessages: () => void;
  /** Set entity context for contextual queries */
  setEntityContext: (ctx: EntityContext | undefined) => void;
  /** Current entity context */
  entityContext: EntityContext | undefined;
  /** Stop the current stream */
  stop: () => void;
  /** Saved conversation history */
  conversationHistory: SavedConversation[];
  /** Load a saved conversation */
  loadConversation: (id: string) => Promise<void>;
  /** Delete a saved conversation */
  deleteConversation: (id: string) => Promise<void>;
  /** Start a new conversation (clears current and creates fresh) */
  startNewConversation: () => void;
  /** Export current conversation as markdown */
  exportConversation: () => string;
  /** Submit feedback for a message */
  submitFeedback: (messageIndex: number, rating: 'positive' | 'negative', comment?: string) => Promise<void>;
  /** Active conversation ID */
  activeConversationId: string | null;
  /** Whether conversation history is loading */
  isHistoryLoading: boolean;
}

const CopilotContext = createContext<CopilotContextValue | null>(null);

/* ─────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────── */

const WELCOME_MESSAGE: UIMessage = {
  id: 'welcome',
  role: 'assistant',
  parts: [
    {
      type: 'text',
      text: 'Hello! I\'m your FlyteDeck AI Copilot. I can help you query live data, draft proposals, analyze trends, and navigate your platform. What would you like to know?',
    },
  ],
};

const CLEARED_MESSAGE: UIMessage = {
  id: 'welcome',
  role: 'assistant',
  parts: [
    {
      type: 'text',
      text: 'Conversation cleared. How can I help you?',
    },
  ],
};

function getMessageText(msg: UIMessage): string {
  return (msg.parts ?? [])
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('');
}

/** Generate a short title from the first user message (GAP-30) */
function generateTitle(messages: UIMessage[]): string {
  const firstUser = messages.find((m) => m.role === 'user');
  if (!firstUser) return 'New Conversation';
  const text = getMessageText(firstUser);
  const truncated = text.length > 60 ? text.slice(0, 57) + '…' : text;
  return truncated || 'New Conversation';
}

/* ─────────────────────────────────────────────────────────
   Provider
   ───────────────────────────────────────────────────────── */

export function CopilotProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [entityContext, setEntityContext] = useState<EntityContext | undefined>();
  const [input, setInput] = useState('');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<SavedConversation[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const pendingPromptRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedCountRef = useRef(0);
  const pathname = usePathname();

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
  } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/ai/chat',
      body: {
        context: {
          currentPage: pathname,
          entityContext,
        },
      },
    }),
    messages: [WELCOME_MESSAGE],
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  // ── Auto-save conversation (GAP-06, GAP-32) ──────────────
  useEffect(() => {
    // Skip if only welcome/cleared message or currently streaming
    const realMessages = messages.filter((m) => m.id !== 'welcome');
    if (realMessages.length === 0 || isLoading) return;
    if (realMessages.length === lastSavedCountRef.current) return;

    // Debounce saves
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const title = generateTitle(messages);
        const res = await fetch('/api/ai/chat/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: activeConversationId,
            title,
            messages: messages.map((m) => ({ id: m.id, role: m.role, parts: m.parts })),
            context: entityContext ? { currentPage: pathname, entityContext } : { currentPage: pathname },
            model: 'claude-sonnet-4-20250514',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (!activeConversationId && data.id) {
            setActiveConversationId(data.id);
          }
          lastSavedCountRef.current = realMessages.length;
        }
      } catch {
        // Silent fail — don't disrupt chat
      }
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [messages, isLoading, activeConversationId, entityContext, pathname]);

  // ── Load conversation history on mount ────────────────────
  const refreshHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const res = await fetch('/api/ai/chat/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversationHistory(data.conversations ?? []);
      }
    } catch {
      // Silent fail
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  // ── Panel controls ─────────────────────────────────────────
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const close = useCallback(() => setIsOpen(false), []);

  const open = useCallback(
    (initialPrompt?: string) => {
      setIsOpen(true);
      if (initialPrompt) {
        pendingPromptRef.current = initialPrompt;
        setInput(initialPrompt);
      }
    },
    []
  );

  const clearMessages = useCallback(() => {
    setMessages([CLEARED_MESSAGE]);
    setActiveConversationId(null);
    lastSavedCountRef.current = 0;
  }, [setMessages]);

  const startNewConversation = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    setActiveConversationId(null);
    lastSavedCountRef.current = 0;
    setInput('');
  }, [setMessages]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const text = input.trim();
      if (!text) return;
      setInput('');
      sendMessage({ text });
    },
    [input, sendMessage]
  );

  // ── Conversation management ────────────────────────────────
  const loadConversation = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/ai/chat/conversations/${id}`);
        if (res.ok) {
          const data = await res.json();
          const conv = data.conversation;
          if (conv?.messages && Array.isArray(conv.messages)) {
            setMessages(conv.messages);
            setActiveConversationId(id);
            lastSavedCountRef.current = conv.messages.filter(
              (m: UIMessage) => m.id !== 'welcome'
            ).length;
          }
        }
      } catch {
        // Silent fail
      }
    },
    [setMessages]
  );

  const deleteConversation = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/ai/chat/conversations/${id}`, { method: 'DELETE' });
        setConversationHistory((prev) => prev.filter((c) => c.id !== id));
        if (activeConversationId === id) {
          startNewConversation();
        }
      } catch {
        // Silent fail
      }
    },
    [activeConversationId, startNewConversation]
  );

  // ── Export conversation as markdown (GAP-33) ───────────────
  const exportConversation = useCallback(() => {
    const lines: string[] = ['# AI Copilot Conversation\n'];
    for (const msg of messages) {
      if (msg.id === 'welcome') continue;
      const text = getMessageText(msg);
      if (!text) continue;
      const role = msg.role === 'user' ? '**You**' : '**AI Copilot**';
      lines.push(`### ${role}\n\n${text}\n`);
    }
    return lines.join('\n');
  }, [messages]);

  // ── Feedback (GAP-26) ─────────────────────────────────────
  const submitFeedback = useCallback(
    async (messageIndex: number, rating: 'positive' | 'negative', comment?: string) => {
      if (!activeConversationId) return;
      try {
        await fetch('/api/ai/chat/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversation_id: activeConversationId,
            message_index: messageIndex,
            rating,
            comment,
          }),
        });
      } catch {
        // Silent fail
      }
    },
    [activeConversationId]
  );

  return (
    <CopilotContext.Provider
      value={{
        isOpen,
        toggle,
        open,
        close,
        messages,
        input,
        setInput,
        handleSubmit,
        isLoading,
        clearMessages,
        setEntityContext,
        entityContext,
        stop,
        conversationHistory,
        loadConversation,
        deleteConversation,
        startNewConversation,
        exportConversation,
        submitFeedback,
        activeConversationId,
        isHistoryLoading,
      }}
    >
      {children}
    </CopilotContext.Provider>
  );
}

/* ─────────────────────────────────────────────────────────
   Hook
   ───────────────────────────────────────────────────────── */

export function useCopilot() {
  const context = useContext(CopilotContext);
  if (!context) {
    throw new Error('useCopilot must be used within a CopilotProvider');
  }
  return context;
}
