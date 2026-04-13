'use client';

/**
 * Keyboard shortcut handler — global shortcuts for power users.
 *
 * Standard shortcuts:
 * - `n` = new task (when not in input)
 * - `/` = focus search
 * - `?` = show help
 * - `g t` = go to tasks
 * - `g p` = go to pipeline
 * - `⌘N` / `Ctrl+N` = new item (works even in inputs)
 * - `⌘S` / `Ctrl+S` = save (prevents browser default)
 *
 * X-05 remediation: Added ⌘N/⌘S modifier shortcuts.
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
  { keys: '⌘ + N', label: 'New item', category: 'Actions' },
  { keys: '⌘ + S', label: 'Save current form', category: 'Actions' },
  { keys: 'n', label: 'New task (when not typing)', category: 'Tasks' },
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
  onSave?: () => void;
}

export default function KeyboardShortcuts({ onNewTask, onFocusSearch, onSave }: KeyboardShortcutsProps) {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);
  const [pendingGo, setPendingGo] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const metaOrCtrl = e.metaKey || e.ctrlKey;

      // ⌘N / Ctrl+N — new item (works even in inputs)
      if (metaOrCtrl && e.key === 'n') {
        e.preventDefault();
        onNewTask?.();
        return;
      }

      // ⌘S / Ctrl+S — save (prevent browser Save dialog)
      if (metaOrCtrl && e.key === 's') {
        e.preventDefault();
        onSave?.();
        return;
      }

      // Skip remaining shortcuts if user is typing in an input
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
    [pendingGo, router, onNewTask, onFocusSearch, onSave],
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
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium shadow-lg animate-fade-in">
          Press a key: <kbd className="mx-1 px-1.5 py-0.5 rounded bg-background/20 text-xs">t</kbd>asks ·
          <kbd className="mx-1 px-1.5 py-0.5 rounded bg-background/20 text-xs">p</kbd>ipeline ·
          <kbd className="mx-1 px-1.5 py-0.5 rounded bg-background/20 text-xs">c</kbd>alendar ·
          <kbd className="mx-1 px-1.5 py-0.5 rounded bg-background/20 text-xs">d</kbd>ashboard
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
