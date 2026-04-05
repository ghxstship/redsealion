'use client';

import { useState } from 'react';

interface ColumnDef {
  key: string;
  label: string;
  visible: boolean;
  pinned: boolean;
}

interface ColumnConfigPanelProps {
  open: boolean;
  onClose: () => void;
  columns: ColumnDef[];
  onColumnsChange: (columns: ColumnDef[]) => void;
  rowHeight: 'compact' | 'default' | 'tall';
  onRowHeightChange: (height: 'compact' | 'default' | 'tall') => void;
}

const ROW_HEIGHT_OPTIONS = [
  { key: 'compact' as const, label: 'Compact', icon: '▤' },
  { key: 'default' as const, label: 'Default', icon: '▥' },
  { key: 'tall' as const, label: 'Tall', icon: '☰' },
];

export default function ColumnConfigPanel({
  open,
  onClose,
  columns,
  onColumnsChange,
  rowHeight,
  onRowHeightChange,
}: ColumnConfigPanelProps) {
  const [localColumns, setLocalColumns] = useState(columns);

  if (!open) return null;

  function toggleVisibility(key: string) {
    setLocalColumns((prev) =>
      prev.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c))
    );
  }

  function togglePin(key: string) {
    setLocalColumns((prev) =>
      prev.map((c) => (c.key === key ? { ...c, pinned: !c.pinned } : c))
    );
  }

  function moveColumn(index: number, direction: 'up' | 'down') {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= localColumns.length) return;
    const next = [...localColumns];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    setLocalColumns(next);
  }

  function handleApply() {
    onColumnsChange(localColumns);
    onClose();
  }

  function handleReset() {
    setLocalColumns(columns.map((c) => ({ ...c, visible: true, pinned: false })));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 animate-modal-backdrop" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-xl border border-border bg-white shadow-xl animate-modal-content">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-foreground">Column Settings</h3>
          <button onClick={onClose} className="text-text-muted hover:text-foreground transition-colors">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="4" x2="14" y2="14" /><line x1="14" y1="4" x2="4" y2="14" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
          {/* Row height */}
          <div className="mb-5">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-2">Row Height</p>
            <div className="flex gap-1 rounded-lg border border-border p-1 bg-bg-secondary">
              {ROW_HEIGHT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => onRowHeightChange(opt.key)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    rowHeight === opt.key ? 'bg-white text-foreground shadow-sm' : 'text-text-muted hover:text-foreground'
                  }`}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Column list */}
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-2">Columns</p>
          <div className="space-y-1">
            {localColumns.map((col, index) => (
              <div
                key={col.key}
                className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-bg-secondary transition-colors"
              >
                <input
                  type="checkbox"
                  checked={col.visible}
                  onChange={() => toggleVisibility(col.key)}
                  className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/20"
                />
                <span className="flex-1 text-sm text-foreground">{col.label}</span>
                <button
                  onClick={() => togglePin(col.key)}
                  title={col.pinned ? 'Unpin' : 'Pin'}
                  className={`text-xs transition-colors ${col.pinned ? 'text-blue-600' : 'text-text-muted hover:text-foreground'}`}
                >
                  📌
                </button>
                <div className="flex flex-col">
                  <button
                    onClick={() => moveColumn(index, 'up')}
                    disabled={index === 0}
                    className="text-text-muted hover:text-foreground disabled:opacity-20 text-[10px] leading-none"
                  >▲</button>
                  <button
                    onClick={() => moveColumn(index, 'down')}
                    disabled={index === localColumns.length - 1}
                    className="text-text-muted hover:text-foreground disabled:opacity-20 text-[10px] leading-none"
                  >▼</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-border">
          <button onClick={handleReset} className="text-xs font-medium text-text-muted hover:text-foreground transition-colors">
            Reset to defaults
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary">
              Cancel
            </button>
            <button onClick={handleApply} className="rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-foreground/90">
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
