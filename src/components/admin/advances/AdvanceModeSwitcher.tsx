'use client';

import Button from '@/components/ui/Button';
import type { AdvanceMode } from '@/types/database';

interface AdvanceModeSwitcherProps {
  value: AdvanceMode;
  onChange: (mode: AdvanceMode) => void;
  disabled?: boolean;
}

const MODES: Array<{ id: AdvanceMode; label: string; sub: string; description: string }> = [
  {
    id: 'internal',
    label: 'Internal',
    sub: 'Single organization',
    description: 'Submit an advance for your own organization. Browse your catalog, add items, and submit for internal review.',
  },
  {
    id: 'collection',
    label: 'Collection',
    sub: 'Multi-organization',
    description: 'Open an advance to collect submissions from external contractors, vendors, and collaborators.',
  },
];

export default function AdvanceModeSwitcher({ value, onChange, disabled }: AdvanceModeSwitcherProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {MODES.map((mode) => {
        const isActive = value === mode.id;
        return (
          <button
            key={mode.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(mode.id)}
            className={`
              rounded-xl border-2 p-5 text-left transition-all
              ${isActive
                ? 'border-foreground bg-bg-tertiary shadow-sm'
                : 'border-border bg-background hover:border-text-muted hover:bg-bg-secondary'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <h3 className="text-sm font-semibold text-foreground">{mode.label}</h3>
            <p className="text-[11px] text-text-muted">{mode.sub}</p>
            <p className="mt-2 text-xs text-text-secondary leading-relaxed">{mode.description}</p>
          </button>
        );
      })}
    </div>
  );
}
