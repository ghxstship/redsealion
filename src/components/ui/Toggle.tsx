'use client';

import { useId } from 'react';

interface ToggleProps {
  /** Whether the toggle is on. */
  checked: boolean;
  /** Called when toggled. */
  onChange: (value: boolean) => void;
  /** Accessible label. */
  label?: string;
  /** Disable interaction. */
  disabled?: boolean;
  /** Extra class name on the wrapper. */
  className?: string;
}

/**
 * Canonical Toggle/Switch atom.
 * Replaces 5+ inline toggle implementations across the platform.
 */
export default function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
}: ToggleProps) {
  const id = useId();

  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center gap-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      <button
        id={id}
        role="switch"
        type="button"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
          checked ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      {label && (
        <span className="text-sm font-medium text-foreground select-none">{label}</span>
      )}
    </label>
  );
}
