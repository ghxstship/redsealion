'use client';

/**
 * CopilotPanel — premium slide-over AI copilot panel.
 *
 * Right-edge drawer with streaming markdown rendering,
 * tool execution indicators, contextual suggestions, and
 * conversation management.
 *
 * Updated for AI SDK v6: uses UIMessage.parts for content
 * rendering instead of the deprecated content string.
 *
 * @module components/shared/CopilotPanel
 */

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Sparkles, Trash2, X, Send } from 'lucide-react';
import { useCopilot } from './CopilotProvider';
import { usePathname } from 'next/navigation';
import type { UIMessage } from '@ai-sdk/react';

/* ─────────────────────────────────────────────────────────
   Page-aware suggestions
   ───────────────────────────────────────────────────────── */

const pageSuggestions: Record<string, string[]> = {
  '/app': [
    'Give me a business overview',
    'What needs my attention today?',
    'Summarize this week\'s activity',
  ],
  '/app/proposals': [
    'Which proposals are at risk?',
    'Summarize proposals by status',
    'Draft a follow-up for stale proposals',
  ],
  '/app/pipeline': [
    'What\'s the weighted pipeline value?',
    'Which deals need attention?',
    'Show pipeline by stage',
  ],
  '/app/clients': [
    'Who are our top clients by revenue?',
    'Any clients without recent activity?',
    'Client summary',
  ],
  '/app/invoices': [
    'Any overdue invoices?',
    'Revenue collected this month',
    'AR summary',
  ],
  '/app/expenses': [
    'Pending expense approvals',
    'Spending by category this month',
    'Any unusual expense patterns?',
  ],
  '/app/tasks': [
    'What tasks are blocked?',
    'Tasks due today',
    'Suggest task priorities',
  ],
  '/app/calendar': [
    'What events are coming up?',
    'Schedule summary for this week',
  ],
  '/app/budgets': [
    'Budget utilization overview',
    'Which projects are over budget?',
  ],
};

function getSuggestions(pathname: string): string[] {
  // Try exact match first, then prefix match
  if (pageSuggestions[pathname]) return pageSuggestions[pathname];
  const prefix = Object.keys(pageSuggestions).find((k) =>
    pathname.startsWith(k)
  );
  return prefix ? pageSuggestions[prefix] : pageSuggestions['/app'];
}

/* ─────────────────────────────────────────────────────────
   Helpers — extract text from UIMessage parts
   ───────────────────────────────────────────────────────── */

function getMessageText(msg: UIMessage): string {
  return (msg.parts ?? [])
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('');
}

/* ─────────────────────────────────────────────────────────
   Markdown-lite renderer (no heavy deps)
   ───────────────────────────────────────────────────────── */

function renderMarkdown(content: string): string {
  return content
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-bg-secondary px-1 py-0.5 rounded text-xs font-mono">$1</code>')
    // Headers
    .replace(/^### (.+)$/gm, '<h4 class="font-semibold text-sm mt-3 mb-1">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="font-semibold text-base mt-3 mb-1">$1</h3>')
    // Bullet lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-sm">$1</li>')
    // Line breaks
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, '<br/>');
}

/* ─────────────────────────────────────────────────────────
   CopilotPanel Component
   ───────────────────────────────────────────────────────── */

export default function CopilotPanel() {
  const {
    isOpen,
    close,
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    clearMessages,
    stop,
  } = useCopilot();

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pathname = usePathname();
  const [suggestions] = useState(() => getSuggestions(pathname));

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  // ⌘J keyboard shortcut is handled in CopilotTrigger

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    handleSubmit(e);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!input.trim() || isLoading) return;
      handleSubmit();
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
    // Small delay to let state update, then submit
    setTimeout(() => {
      inputRef.current?.form?.requestSubmit();
    }, 50);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 animate-modal-backdrop md:bg-transparent md:pointer-events-none"
        onClick={close}
      />

      {/* Panel */}
      <aside
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[480px] flex flex-col bg-background/95 backdrop-blur-xl border-l border-border shadow-2xl animate-slide-in-right"
        role="complementary"
        aria-label="AI Copilot"
        id="copilot-panel"
      >
        {/* ── Header ──────────────────────────────────── */}
        <div className="flex items-center gap-3 px-5 h-14 border-b border-border shrink-0">
          {/* Sparkle icon */}
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400/20 to-orange-500/20">
            <Sparkles size={16} className="text-amber-600" />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-foreground">
              AI Copilot
            </h2>
            <p className="text-[10px] text-text-muted truncate">
              {pathname.replace('/app', '').replace(/\//g, ' › ').trim() || 'Dashboard'}
            </p>
          </div>

          {/* Clear conversation */}
          <button
            onClick={clearMessages}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-bg-secondary"
            aria-label="Clear conversation"
            title="Clear conversation"
          >
            <Trash2 size={14} className="text-text-muted" />
          </button>

          {/* Close */}
          <button
            onClick={close}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-bg-secondary"
            aria-label="Close copilot"
            title="Close (⌘J)"
          >
            <X size={14} className="text-text-muted" />
          </button>
        </div>

        {/* ── Messages ────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.map((msg) => {
            const text = getMessageText(msg);
            if (!text) return null;

            return (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-foreground text-white'
                      : 'bg-bg-secondary/80 text-foreground border border-border/50'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div
                      className="text-sm leading-relaxed prose-sm [&_li]:text-sm [&_strong]:font-semibold [&_code]:text-xs"
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(text),
                      }}
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{text}</p>
                  )}
                </div>
              </div>
            );
          })}

          {/* Streaming indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[90%] rounded-xl px-4 py-3 bg-bg-secondary/80 border border-border/50">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:300ms]" />
                  </div>
                  <span className="text-xs text-text-muted">
                    Analyzing your data…
                  </span>
                  <button
                    onClick={stop}
                    className="ml-2 text-[10px] text-text-muted hover:text-foreground transition-colors underline"
                  >
                    Stop
                  </button>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Suggestions ─────────────────────────────── */}
        {messages.length <= 1 && !isLoading && (
          <div className="px-5 pb-3 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => handleSuggestion(s)}
                className="text-xs rounded-full border border-border px-3 py-1.5 text-text-secondary transition-colors hover:border-amber-500/50 hover:text-amber-700 hover:bg-amber-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* ── Input ───────────────────────────────────── */}
        <form
          onSubmit={onSubmit}
          className="shrink-0 border-t border-border px-4 py-3"
        >
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask about your data…"
              disabled={isLoading}
              rows={1}
              className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 disabled:opacity-50 transition-colors max-h-32"
              style={{ fieldSizing: 'content' } as React.CSSProperties}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-foreground text-white transition-all duration-fast hover:bg-foreground/90 disabled:opacity-30 disabled:cursor-not-allowed press-scale shrink-0"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-text-muted text-center">
            ⏎ to send · Shift+⏎ for new line · ⌘J to toggle
          </p>
        </form>
      </aside>
    </>
  );
}
