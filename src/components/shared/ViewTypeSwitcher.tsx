'use client';

import { useState } from 'react';

interface ViewTypeSwitcherProps {
  views: { key: string; label: string; icon: string }[];
  activeView: string;
  onSwitch: (key: string) => void;
}

/**
 * Segmented control for switching between view types (Table, Board, Calendar, Gantt, etc.)
 * Renders as a compact button group in the page header.
 */
export default function ViewTypeSwitcher({ views, activeView, onSwitch }: ViewTypeSwitcherProps) {
  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-bg-secondary p-0.5">
      {views.map((view) => (
        <button
          key={view.key}
          onClick={() => onSwitch(view.key)}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            activeView === view.key
              ? 'bg-white text-foreground shadow-sm'
              : 'text-text-muted hover:text-foreground'
          }`}
          title={view.label}
        >
          <span>{view.icon}</span>
          <span className="hidden sm:inline">{view.label}</span>
        </button>
      ))}
    </div>
  );
}
