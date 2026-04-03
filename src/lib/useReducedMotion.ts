'use client';

import { useState, useEffect } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Returns `true` when the user prefers reduced motion.
 * Subscribes to media query changes so the UI updates live.
 *
 * Usage:
 * ```tsx
 * const prefersReduced = useReducedMotion();
 * const transition = prefersReduced ? { duration: 0 } : fmTransition.enter;
 * ```
 */
export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);

    mql.addEventListener('change', handler);
    // Sync in case SSR value differs
    setPrefersReduced(mql.matches);

    return () => mql.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
}
