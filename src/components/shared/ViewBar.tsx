'use client';

import { useState, type ReactNode } from 'react';
import type { SavedView } from '@/hooks/useEntityViews';
import { Table, Kanban, Calendar, GanttChart, List, LayoutGrid, ArrowRight, FileText, X } from 'lucide-react';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';

const DISPLAY_ICONS: Record<string, ReactNode> = {
  table: <Table size={12} />,
  board: <Kanban size={12} />,
  calendar: <Calendar size={12} />,
  gantt: <GanttChart size={12} />,
  list: <List size={12} />,
  gallery: <LayoutGrid size={12} />,
  timeline: <ArrowRight size={12} />,
  form: <FileText size={12} />,
};

interface ViewBarProps {
  views: SavedView[];
  activeViewId: string | null;
  onSelectView: (id: string) => void;
  onCreateView: (name: string) => void;
  onDeleteView: (id: string) => void;
  onDuplicateView: (id: string) => void;
}

export default function ViewBar({
  views,
  activeViewId,
  onSelectView,
  onCreateView,
  onDeleteView,
  onDuplicateView,
}: ViewBarProps) {
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  function handleCreate() {
    if (!newName.trim()) return;
    onCreateView(newName.trim());
    setNewName('');
    setShowNew(false);
  }

  return (
    <div className="flex items-center gap-1 border-b border-border mb-4 overflow-x-auto">
      {/* View tabs */}
      {views.map((view) => (
        <div key={view.id} className="relative group flex-shrink-0">
          <button
            onClick={() => onSelectView(view.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeViewId === view.id
                ? 'border-foreground text-foreground'
                : 'border-transparent text-text-muted hover:text-text-secondary hover:border-border'
            }`}
          >
            <span className="flex items-center text-xs">{DISPLAY_ICONS[view.display_type] ?? <Table size={12} />}</span>
            {view.icon && <span className="text-xs">{view.icon}</span>}
            {view.name}
          </button>

          {/* Context menu trigger */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpenId(menuOpenId === view.id ? null : view.id);
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity rounded p-0.5 text-text-muted hover:text-foreground"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <circle cx="6" cy="2" r="1" />
              <circle cx="6" cy="6" r="1" />
              <circle cx="6" cy="10" r="1" />
            </svg>
          </button>

          {/* Context menu */}
          {menuOpenId === view.id && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpenId(null)} />
              <div className="absolute top-full left-0 mt-1 z-40 w-36 rounded-lg border border-border bg-white shadow-xl py-1">
                <button
                  onClick={() => { onDuplicateView(view.id); setMenuOpenId(null); }}
                  className="w-full px-3 py-1.5 text-left text-xs text-foreground hover:bg-bg-secondary transition-colors"
                >
                  Duplicate
                </button>
                <button
                  onClick={() => { onDeleteView(view.id); setMenuOpenId(null); }}
                  className="w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      ))}

      {/* Add view button */}
      {showNew ? (
        <div className="flex items-center gap-1 px-2 flex-shrink-0">
          <FormInput
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') setShowNew(false);
            }}
            placeholder="View name"
            autoFocus />
          <Button
            size="sm"
            onClick={handleCreate}
            className="px-2"
          >
            Save
          </Button>
          <button
            onClick={() => setShowNew(false)}
            className="rounded px-1 py-1 text-text-muted hover:text-foreground transition-colors"
            title="Cancel"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowNew(true)}
          className="flex-shrink-0 flex items-center gap-1 px-3 py-2.5 text-sm font-medium text-text-muted hover:text-foreground border-b-2 border-transparent transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="6" y1="2" x2="6" y2="10" />
            <line x1="2" y1="6" x2="10" y2="6" />
          </svg>
          Add View
        </button>
      )}
    </div>
  );
}
