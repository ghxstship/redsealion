'use client';

import { motion } from 'framer-motion';
import { fmTransition } from '@/lib/motion';
import { formatCurrency } from '@/lib/utils';
import type { PhaseAddon } from '@/types/database';

interface AddOnSelectorProps {
  addon: PhaseAddon;
  selected: boolean;
  onToggle: () => void;
  disabled: boolean;
}

export default function AddOnSelector({
  addon,
  selected,
  onToggle,
  disabled,
}: AddOnSelectorProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={[
        'w-full text-left rounded-xl border p-5 lg:p-6 transition-[color,background-color,border-color,opacity,box-shadow] duration-slow group',
        selected
          ? 'border-addon bg-addon-bg shadow-sm'
          : 'border-border bg-background hover:border-addon/40 hover:bg-addon-bg/50',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <div className="mt-0.5 shrink-0">
          <div
            className={[
              'h-5 w-5 rounded-md border-2 flex items-center justify-center transition-[color,background-color,border-color,opacity] duration-slow',
              selected
                ? 'border-addon bg-addon'
                : 'border-border group-hover:border-addon/60',
            ].join(' ')}
          >
            <motion.svg
              initial={false}
              animate={selected ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0 }}
              transition={fmTransition.spring}
              className="h-3 w-3 text-white"
              viewBox="0 0 12 12"
              fill="none"
            >
              <path
                d="M2.5 6L5 8.5L9.5 3.5"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-base font-medium text-foreground mb-0.5">
                {addon.name}
              </p>
              {addon.description && (
                <p className="text-sm text-text-secondary leading-relaxed">
                  {addon.description}
                </p>
              )}
              {addon.mutually_exclusive_group && (
                <p className="mt-2 text-xs font-medium tracking-wider uppercase text-addon">
                  {addon.mutually_exclusive_group}
                </p>
              )}
            </div>
            <div className="sm:text-right shrink-0">
              <motion.p
                key={selected ? 'selected' : 'unselected'}
                initial={{ y: -4, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={fmTransition.spring}
                className={[
                  'text-xl font-light tracking-tight',
                  selected ? 'text-addon' : 'text-foreground',
                ].join(' ')}
              >
                +{formatCurrency(addon.total_cost)}
              </motion.p>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
