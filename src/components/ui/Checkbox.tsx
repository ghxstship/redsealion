'use client';

import { forwardRef, useEffect, useRef } from 'react';

interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Renders the checkbox in an indeterminate state (partially checked) */
  indeterminate?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Optional label rendered next to the checkbox */
  label?: string;
}

/**
 * Canonical Checkbox component — theme-aware, accessible, and consistent
 * across light and dark modes.
 *
 * Replaces raw `<input type="checkbox">` across the application.
 */
const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ indeterminate, size = 'sm', label, className = '', id, ...props }, ref) => {
    const internalRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
      const el = internalRef.current;
      if (el) el.indeterminate = !!indeterminate;
    }, [indeterminate]);

    const sizeClasses = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

    const checkbox = (
      <input
        ref={(el) => {
          internalRef.current = el;
          if (typeof ref === 'function') ref(el);
          else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = el;
        }}
        type="checkbox"
        id={id}
        className={`${sizeClasses} rounded border-border text-foreground focus:ring-2 focus:ring-foreground/20 focus:ring-offset-0 bg-background cursor-pointer accent-foreground ${className}`}
        {...props}
      />
    );

    if (label) {
      return (
        <label htmlFor={id} className="inline-flex items-center gap-2 cursor-pointer text-sm text-foreground">
          {checkbox}
          <span>{label}</span>
        </label>
      );
    }

    return checkbox;
  },
);

Checkbox.displayName = 'Checkbox';
export default Checkbox;
