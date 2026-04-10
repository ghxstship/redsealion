'use client';

/**
 * AiChatPanel — inline AI chat component for the standalone /app/ai page.
 *
 * Uses the global CopilotProvider context so conversations are shared
 * with the slide-over copilot panel and keyboard shortcut (⌘J).
 *
 * @module components/admin/ai/AiChatPanel
 */

import { useEffect, useRef, type FormEvent } from 'react';
import { Sparkles, Send, Trash2 } from 'lucide-react';
import { useCopilot } from '@/components/shared/CopilotProvider';
import type { UIMessage } from '@ai-sdk/react';

/* ─────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────── */

function getMessageText(msg: UIMessage): string {
  return (msg.parts ?? [])
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('');
}

function renderMarkdown(content: string): string {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-bg-secondary px-1 py-0.5 rounded text-xs font-mono">$1</code>')
    .replace(/^### (.+)$/gm, '<h4 class="font-semibold text-sm mt-3 mb-1">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="font-semibold text-base mt-3 mb-1">$1</h3>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-sm">$1</li>')
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, '<br/>');
}

/* ─────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────── */

export default function AiChatPanel() {
  const {
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

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-xl border border-border bg-background overflow-hidden shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 h-12 border-b border-border bg-bg-secondary/50">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400/20 to-orange-500/20">
            <Sparkles size={14} className="text-amber-600" />
          </div>
          <span className="text-sm font-medium text-foreground flex-1">AI Copilot Chat</span>
          <button
            onClick={clearMessages}
            className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-bg-secondary"
            aria-label="Clear conversation"
            title="Clear conversation"
          >
            <Trash2 size={13} className="text-text-muted" />
          </button>
        </div>

        {/* Messages */}
        <div className="h-[520px] overflow-y-auto px-6 py-5 space-y-4">
          {messages.map((msg) => {
            const text = getMessageText(msg);
            if (!text) return null;

            return (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-3 ${
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
              <div className="max-w-[85%] rounded-xl px-4 py-3 bg-bg-secondary/80 border border-border/50">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:300ms]" />
                  </div>
                  <span className="text-xs text-text-muted">Analyzing your data…</span>
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

        {/* Input */}
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
            ⏎ to send · Shift+⏎ for new line · ⌘J to toggle panel
          </p>
        </form>
      </div>
    </div>
  );
}
