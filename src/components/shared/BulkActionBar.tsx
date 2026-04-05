'use client';

import { useState } from 'react';
import ConfirmDialog from './ConfirmDialog';

interface BulkAction {
  label: string;
  icon?: React.ReactNode;
  variant?: 'danger' | 'warning' | 'default';
  /** If true, shows a confirmation dialog before executing */
  confirm?: { title: string; message: string };
  onClick: (selectedIds: string[]) => void | Promise<void>;
}

interface BulkActionBarProps {
  selectedIds: Set<string>;
  onDeselectAll: () => void;
  actions: BulkAction[];
  entityLabel?: string;
}

export default function BulkActionBar({
  selectedIds,
  onDeselectAll,
  actions,
  entityLabel = 'item',
}: BulkActionBarProps) {
  const [confirmAction, setConfirmAction] = useState<BulkAction | null>(null);
  const count = selectedIds.size;

  if (count === 0) return null;

  const plural = count === 1 ? entityLabel : `${entityLabel}s`;

  async function executeAction(action: BulkAction) {
    await action.onClick(Array.from(selectedIds));
    onDeselectAll();
    setConfirmAction(null);
  }

  return (
    <>
      <div className="sticky top-0 z-20 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 mb-4 animate-modal-content">
        <div className="flex items-center gap-2 text-sm font-medium text-blue-900">
          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-bold text-white tabular-nums">
            {count}
          </span>
          <span>{plural} selected</span>
        </div>

        <div className="mx-2 h-4 w-px bg-blue-200" />

        <div className="flex items-center gap-1.5">
          {actions.map((action) => {
            const btnClass =
              action.variant === 'danger'
                ? 'text-red-700 hover:bg-red-100'
                : action.variant === 'warning'
                  ? 'text-amber-700 hover:bg-amber-100'
                  : 'text-blue-800 hover:bg-blue-100';

            return (
              <button
                key={action.label}
                onClick={() => {
                  if (action.confirm) setConfirmAction(action);
                  else void executeAction(action);
                }}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${btnClass}`}
              >
                {action.icon}
                {action.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={onDeselectAll}
          className="ml-auto text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          Clear selection
        </button>
      </div>

      {confirmAction?.confirm && (
        <ConfirmDialog
          open
          title={confirmAction.confirm.title}
          message={confirmAction.confirm.message}
          confirmLabel={confirmAction.label}
          variant={confirmAction.variant ?? 'default'}
          onConfirm={() => executeAction(confirmAction)}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </>
  );
}
