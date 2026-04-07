'use client';

/**
 * Keyboard shortcut handler — global shortcuts for power users.
 *
 * Common patterns from ClickUp/Monday/Asana:
 * - `n` = new task
 * - `/` = focus search
 * - `?` = show help
 * - `g t` = go to tasks
 * - `g p` = go to pipeline
 *
 * @module components/shared/KeyboardShortcuts
 */

import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import ModalShell from '@/components/ui/ModalShell';

interface Shortcut {
  keys: string;
  label: string;
  category: string;
}

const SHORTCUTS: Shortcut[] = [
  { keys: 'n', label: 'New task', category: 'Tasks' },
  { keys: '/', label: 'Focus search', category: 'Navigation' },
  { keys: '?', label: 'Show keyboard shortcuts', category: 'Help' },
  { keys: 'g then t', label: 'Go to Tasks', category: 'Navigation' },
  { keys: 'g then p', label: 'Go to Pipeline', category: 'Navigation' },
  { keys: 'g then c', label: 'Go to Calendar', category: 'Navigation' },
  { keys: 'g then d', label: 'Go to Dashboard', category: 'Navigation' },
  { keys: 'g then i', label: 'Go to Invoices', category: 'Navigation' },
  { keys: 'Esc', label: 'Close modal/dropdown', category: 'General' },
];

interface KeyboardShortcutsProps {
  onNewTask?: () => void;
  onFocusSearch?: () => void;
}

export default function KeyboardShortcuts({ onNewTask, onFocusSearch }: KeyboardShortcutsProps) {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);
  const [pendingGo, setPendingGo] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      const tag = (e.target as HTMLElement).tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || (e.target as HTMLElement).isContentEditable) {
        return;
      }

      // "g" prefix for navigation
      if (pendingGo) {
        setPendingGo(false);
        switch (e.key) {
          case 't': e.preventDefault(); router.push('/app/tasks'); return;
          case 'p': e.preventDefault(); router.push('/app/pipeline'); return;
          case 'c': e.preventDefault(); router.push('/app/calendar'); return;
          case 'd': e.preventDefault(); router.push('/app/dashboard'); return;
          case 'i': e.preventDefault(); router.push('/app/invoices'); return;
        }
        return;
      }

      switch (e.key) {
        case 'n':
          e.preventDefault();
          onNewTask?.();
          break;
        case '/':
          e.preventDefault();
          onFocusSearch?.();
          break;
        case '?':
          e.preventDefault();
          setShowHelp(true);
          break;
        case 'g':
          e.preventDefault();
          setPendingGo(true);
          setTimeout(() => setPendingGo(false), 1500);
          break;
      }
    },
    [pendingGo, router, onNewTask, onFocusSearch],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Group shortcuts by category
  const categories = [...new Set(SHORTCUTS.map((s) => s.category))];

  return (
    <>
      {/* "Go" mode indicator */}
      {pendingGo && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-foreground text-white px-4 py-2 text-sm font-medium shadow-lg animate-fade-in">
          Press a key: <kbd className="mx-1 px-1.5 py-0.5 rounded bg-white/20 text-xs">t</kbd>asks ·
          <kbd className="mx-1 px-1.5 py-0.5 rounded bg-white/20 text-xs">p</kbd>ipeline ·
          <kbd className="mx-1 px-1.5 py-0.5 rounded bg-white/20 text-xs">c</kbd>alendar ·
          <kbd className="mx-1 px-1.5 py-0.5 rounded bg-white/20 text-xs">d</kbd>ashboard
        </div>
      )}

      {/* Help modal */}
      <ModalShell open={showHelp} onClose={() => setShowHelp(false)} title="Keyboard Shortcuts">
        <div className="space-y-6">
          {categories.map((cat) => (
            <div key={cat}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                {cat}
              </h4>
              <div className="space-y-1">
                {SHORTCUTS.filter((s) => s.category === cat).map((s) => (
                  <div
                    key={s.keys}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span className="text-sm text-text-secondary">{s.label}</span>
                    <div className="flex items-center gap-1">
                      {s.keys.split(' then ').map((k, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 && <span className="text-xs text-text-muted">then</span>}
                          <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded border border-border bg-bg-secondary px-1.5 text-xs font-mono text-foreground">
                            {k}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ModalShell>
    </>
  );
}
