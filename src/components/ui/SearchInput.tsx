'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Debounce delay in ms. Set to 0 to disable. Default 200. */
  debounceMs?: number;
  className?: string;
}

/**
 * Canonical search input atom with leading icon, clear button, and optional debounce.
 */
export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 200,
  className = '',
}: SearchInputProps) {
  const [local, setLocal] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Sync external → local when consumer resets
  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleChange = useCallback(
    (next: string) => {
      setLocal(next);
      if (debounceMs <= 0) {
        onChange(next);
        return;
      }
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => onChange(next), debounceMs);
    },
    [onChange, debounceMs],
  );

  // Cleanup timer on unmount
  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div className={`relative w-full max-w-sm ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
      <input
        type="text"
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-background pl-9 pr-8 py-2.5 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-shadow"
      />
      {local && (
        <button
          onClick={() => handleChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-text-muted hover:text-foreground transition-colors"
          title="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
