'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';

interface TooltipProps {
  /** The text to display in the tooltip. */
  label: string;
  /** Position relative to the trigger element. Default: 'top'. */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Delay in ms before showing the tooltip. Default: 300. */
  delay?: number;
  /** The element that triggers the tooltip on hover. */
  children: ReactNode;
}

/**
 * Lightweight tooltip wrapper for icon-only UI elements.
 *
 * Usage:
 * ```tsx
 * <Tooltip label="Pin column">
 *   <IconPin size={12} />
 * </Tooltip>
 * ```
 */
export default function Tooltip({
  label,
  position = 'top',
  delay = 300,
  children,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleEnter() {
    timerRef.current = setTimeout(() => setVisible(true), delay);
  }

  function handleLeave() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const positionClasses: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  };

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className={`absolute z-50 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[11px] font-medium text-white shadow-lg pointer-events-none animate-fade-in ${positionClasses[position]}`}
        >
          {label}
        </span>
      )}
    </span>
  );
}
