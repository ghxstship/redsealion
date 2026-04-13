'use client';

import { useId, type ReactNode } from 'react';

/* ------------------------------------------------------------------ */
/*  Filter Pills — Horizontal segmented controls for data filtering   */
/* ------------------------------------------------------------------ */

interface FilterPillItem<T extends string = string> {
  key: T;
  label: string;
  /** Optional count badge rendered after the label */
  count?: number;
  /** Optional icon to render before the label */
  icon?: ReactNode;
}

interface FilterPillsProps<T extends string = string> {
  /** Pill definitions */
  items: FilterPillItem<T>[];
  /** Currently active pill key */
  activeKey: T;
  /** Called when a pill is clicked */
  onChange: (key: T) => void;
  /** Optional className on the wrapper */
  className?: string;
}

export default function FilterPills<T extends string = string>({
  items,
  activeKey,
  onChange,
  className,
}: FilterPillsProps<T>) {
  const id = useId();

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 ${className ?? ''}`}
      role="group"
      aria-label="Filters"
    >
      {items.map((item) => {
        const isActive = activeKey === item.key;
        return (
          <button
            key={item.key}
            id={`${id}-filter-${item.key}`}
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(item.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 cursor-pointer ${
              isActive
                ? 'bg-foreground text-background shadow-sm'
                : 'bg-bg-secondary text-text-secondary hover:bg-border/60 hover:text-foreground'
            }`}
          >
            {item.icon && <span className={isActive ? 'text-background/80' : 'text-text-muted'}>{item.icon}</span>}
            {item.label}
            {item.count != null && (
              <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] tabular-nums font-semibold ${
                isActive ? 'bg-background/20 text-background' : 'bg-border text-text-secondary'
              }`}>
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
