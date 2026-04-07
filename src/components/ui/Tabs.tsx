'use client';

import { useId } from 'react';

/* ------------------------------------------------------------------ */
/*  Canonical underline tab bar — design-system atom                  */
/* ------------------------------------------------------------------ */

export interface TabItem<T extends string = string> {
  key: T;
  label: string;
  /** Optional count badge rendered after the label */
  count?: number;
}

interface TabsProps<T extends string = string> {
  /** Tab definitions */
  tabs: TabItem<T>[];
  /** Currently active tab key */
  activeTab: T;
  /** Called when a tab is clicked */
  onTabChange: (key: T) => void;
  /** Optional className on the wrapper */
  className?: string;
}

export default function Tabs<T extends string = string>({
  tabs,
  activeTab,
  onTabChange,
  className,
}: TabsProps<T>) {
  const id = useId();

  return (
    <div
      className={`border-b border-border ${className ?? ''}`}
      role="tablist"
      aria-orientation="horizontal"
    >
      <nav className="-mb-px flex gap-6">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              id={`${id}-tab-${tab.key}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${id}-panel-${tab.key}`}
              onClick={() => onTabChange(tab.key)}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
                isActive
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-text-muted hover:text-text-secondary hover:border-border'
              }`}
            >
              {tab.label}
              {tab.count != null && (
                <span className="ml-1.5 text-xs tabular-nums">
                  ({tab.count})
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
