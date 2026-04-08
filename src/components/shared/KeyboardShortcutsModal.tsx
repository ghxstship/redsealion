'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/* ─────────────────────────────────────────────────────────
   Shortcut data
   ───────────────────────────────────────────────────────── */

interface ShortcutEntry {
  keys: string[];
  description: string;
}

interface ShortcutSection {
  title: string;
  shortcuts: ShortcutEntry[];
}

const sections: ShortcutSection[] = [
  {
    title: 'General',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Open command palette' },
      { keys: ['?'], description: 'Keyboard shortcuts' },
      { keys: ['Esc'], description: 'Close dialog / panel' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['G', 'D'], description: 'Go to Dashboard' },
      { keys: ['G', 'P'], description: 'Go to Pipeline' },
      { keys: ['G', 'C'], description: 'Go to Clients' },
      { keys: ['G', 'I'], description: 'Go to Invoices' },
      { keys: ['G', 'T'], description: 'Go to Tasks' },
      { keys: ['G', 'S'], description: 'Go to Settings' },
    ],
  },
  {
    title: 'Actions',
    shortcuts: [
      { keys: ['N', 'P'], description: 'New Proposal' },
      { keys: ['N', 'I'], description: 'New Invoice' },
      { keys: ['N', 'C'], description: 'New Client' },
      { keys: ['N', 'L'], description: 'New Lead' },
    ],
  },
  {
    title: 'Tables',
    shortcuts: [
      { keys: ['↑', '↓'], description: 'Navigate rows' },
      { keys: ['Enter'], description: 'Open selected' },
      { keys: ['Space'], description: 'Toggle selection' },
      { keys: ['⌘', 'A'], description: 'Select all' },
    ],
  },
];

/* ─────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────── */

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 animate-modal-backdrop"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative w-full max-w-xl mx-4 rounded-xl border border-border bg-background shadow-2xl animate-modal-content overflow-hidden"
        role="dialog"
        aria-label="Keyboard Shortcuts"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-bg-secondary"
            aria-label="Close"
          >
            <X size={16} className="text-text-muted" />
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 max-h-[60vh] overflow-y-auto">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-3">
                {section.title}
              </h3>
              <div className="space-y-2">
                {section.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-sm text-text-secondary">{shortcut.description}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {shortcut.keys.map((key, i) => (
                        <span key={i}>
                          <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 rounded border border-border bg-bg-secondary px-1.5 text-[11px] font-medium text-text-muted">
                            {key}
                          </kbd>
                          {i < shortcut.keys.length - 1 && (
                            <span className="text-[10px] text-text-muted mx-0.5">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-3 text-center">
          <p className="text-[11px] text-text-muted">
            Press <kbd className="rounded border border-border bg-bg-secondary px-1 py-0.5 text-[10px] font-medium">?</kbd>{' '}
            anywhere to open this panel
          </p>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
