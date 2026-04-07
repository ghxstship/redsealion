'use client';

import { type ReactNode, useEffect, useState, useCallback } from 'react';
import Tooltip from '@/components/ui/Tooltip';

interface ViewTypeSwitcherProps {
  views: { key: string; label: string; icon: ReactNode }[];
  activeView: string;
  onSwitch: (key: string) => void;
  /**
   * If provided, the active view is persisted to localStorage under this key.
   * The consumer should initialise activeView from the same key on mount.
   * Convention: 'flytedeck:view:<module>' (e.g. 'flytedeck:view:tasks').
   */
  persistKey?: string;
}

/**
 * Segmented control for switching between view types (Table, Board, Calendar, Gantt, etc.)
 * Renders as a compact button group in the page header.
 *
 * Features:
 * - Responsive: icon + text at ≥sm, icon-only on mobile
 * - Tooltip on hover (visible at all sizes, especially useful on mobile icon-only)
 * - Optional localStorage persistence via `persistKey`
 * - Full ARIA tablist semantics
 */
export default function ViewTypeSwitcher({
  views,
  activeView,
  onSwitch,
  persistKey,
}: ViewTypeSwitcherProps) {
  /* ---- Persistence: save active view to localStorage ---- */
  useEffect(() => {
    if (persistKey) {
      try {
        localStorage.setItem(persistKey, activeView);
      } catch {
        // Silently ignore in SSR or private browsing
      }
    }
  }, [persistKey, activeView]);

  return (
    <div
      className="inline-flex items-center rounded-lg border border-border bg-bg-secondary p-0.5"
      role="tablist"
      aria-orientation="horizontal"
    >
      {views.map((view) => {
        const isActive = activeView === view.key;
        return (
          <Tooltip key={view.key} label={view.label} position="bottom" delay={400}>
            <button
              role="tab"
              aria-selected={isActive}
              aria-label={view.label}
              onClick={() => onSwitch(view.key)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-text-muted hover:text-foreground'
              }`}
            >
              <span className="flex items-center">{view.icon}</span>
              <span className="hidden sm:inline">{view.label}</span>
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}

/* ---- Helper: read persisted view from localStorage ---- */

/**
 * Read the persisted view preference from localStorage.
 * Returns the stored key if it exists in the allowed views list, otherwise returns the fallback.
 *
 * Usage in consumer components:
 * ```ts
 * const initial = getPersistedView('flytedeck:view:pipeline', ['board', 'table'], 'board');
 * const [view, setView] = useState(initial);
 * ```
 */
export function getPersistedView(
  persistKey: string,
  allowedKeys: string[],
  fallback: string,
): string {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(persistKey);
    if (stored && allowedKeys.includes(stored)) return stored;
  } catch {
    // Ignore
  }
  return fallback;
}
