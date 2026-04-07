'use client';

/**
 * CopilotProvider — global React context for the AI copilot state.
 *
 * Manages conversation state, streaming, and panel visibility.
 * Mounted in the root app layout alongside GlobalModalProvider.
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

/* ─────────────────────────────────────────────────────────
   Provider
   ───────────────────────────────────────────────────────── */

export function CopilotProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [entityContext, setEntityContext] = useState<EntityContext | undefined>();
  const [input, setInput] = useState('');
  const pendingPromptRef = useRef<string | null>(null);
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
