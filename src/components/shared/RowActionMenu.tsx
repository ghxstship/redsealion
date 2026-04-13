'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { MoreVertical, Eye, Pencil, Copy, Trash2 } from 'lucide-react';

/** A single item inside the row action dropdown. */
interface RowAction {
  label: string;
  icon?: ReactNode;
  variant?: 'default' | 'danger';
  onClick: () => void;
}

interface RowActionMenuProps {
  actions: RowAction[];
}

const DEFAULT_ICONS: Record<string, ReactNode> = {
  View: <Eye size={13} />,
  Edit: <Pencil size={13} />,
  Duplicate: <Copy size={13} />,
  Delete: <Trash2 size={13} />,
  Remove: <Trash2 size={13} />,
};

/**
 * Canonical row-level action menu (kebab ⋮ button → dropdown).
 *
 * Usage:
 * ```tsx
 * <RowActionMenu actions={[
 *   { label: 'View',   onClick: () => router.push(`/app/crew/${id}`) },
 *   { label: 'Edit',   onClick: () => setEditing(id) },
 *   { label: 'Delete', variant: 'danger', onClick: () => setDeleting(id) },
 * ]} />
 * ```
 */
export default function RowActionMenu({ actions }: RowActionMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="inline-flex items-center justify-center rounded-md p-1.5 text-text-muted hover:text-foreground hover:bg-bg-secondary transition-colors"
        title="Actions"
      >
        <MoreVertical size={14} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-40 w-40 rounded-lg border border-border bg-background shadow-xl py-1 animate-modal-content">
            {actions.map((action) => {
              const icon = action.icon ?? DEFAULT_ICONS[action.label] ?? null;
              const isDanger = action.variant === 'danger';

              return (
                <button
                  key={action.label}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                    action.onClick();
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs font-medium transition-colors ${
                    isDanger
                      ? 'text-red-600 hover:bg-red-500/10'
                      : 'text-foreground hover:bg-bg-secondary'
                  }`}
                >
                  {icon}
                  {action.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
