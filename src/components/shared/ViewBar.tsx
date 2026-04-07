'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import type { SavedView } from '@/hooks/useEntityViews';
import { Table, Kanban, Calendar, GanttChart, List, LayoutGrid, ArrowRight, FileText, X, Check } from 'lucide-react';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
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
  onCreateView: (opts: { name: string; display_type: string; inherit: boolean }) => void;
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
  const [newType, setNewType] = useState('table');
  const [newInherit, setNewInherit] = useState(true);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showNew && inputRef.current) {
      inputRef.current.focus();
    } else if (!showNew && addBtnRef.current) {
      addBtnRef.current.focus();
    }
  }, [showNew]);

  const existingNames = views.map(v => v.name.toLowerCase());
  const errorMsg = newName && existingNames.includes(newName.trim().toLowerCase()) 
    ? 'A view with this name already exists.' 
    : '';

  function handleCreate() {
    if (!newName.trim() || errorMsg) return;
    onCreateView({
      name: newName.trim(),
      display_type: newType,
      inherit: newInherit,
    });
    setNewName('');
    setNewType('table');
    setNewInherit(true);
    setShowNew(false);
  }

  return (
    <div className="flex items-center gap-1 mb-1 overflow-visible">
      {/* View tabs */}
      <div className="flex items-center gap-1 overflow-x-auto flex-nowrap pr-2">
        {views.map((view) => (
          <div key={view.id} className="relative group flex-shrink-0">
            <button
              onClick={() => onSelectView(view.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors rounded-md whitespace-nowrap ${
                activeViewId === view.id
                  ? 'bg-bg-secondary text-foreground shadow-sm'
                  : 'text-text-secondary hover:bg-bg-secondary/50 hover:text-foreground'
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
      </div>

      {/* Add view button */}
      <div className="relative group flex-shrink-0">
        <button
          ref={addBtnRef}
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-text-muted hover:text-foreground hover:bg-bg-secondary/50 rounded-md transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="6" y1="2" x2="6" y2="10" />
            <line x1="2" y1="6" x2="10" y2="6" />
          </svg>
          Add View
        </button>

        {showNew && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowNew(false)} />
            <div className="absolute top-full right-0 sm:left-0 mt-1 z-40 w-[280px] rounded-lg border border-border bg-white shadow-xl p-3 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">Create New View</h4>
                <button
                  onClick={() => setShowNew(false)}
                  className="rounded p-1 text-text-muted hover:text-foreground hover:bg-bg-secondary transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">View Name</label>
                <FormInput
                  ref={inputRef}
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate();
                    if (e.key === 'Escape') setShowNew(false);
                  }}
                  placeholder="e.g. My Custom View"
                />
                {errorMsg && <span className="text-xs text-red-600">{errorMsg}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">View Type</label>
                <FormSelect
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                >
                  <option value="table">Table</option>
                  <option value="board">Board</option>
                  <option value="calendar">Calendar</option>
                  <option value="list">List</option>
                  <option value="gantt">Gantt</option>
                  <option value="gallery">Gallery</option>
                </FormSelect>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="inheritSettings"
                  checked={newInherit}
                  onChange={(e) => setNewInherit(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/10"
                />
                <label htmlFor="inheritSettings" className="text-sm font-medium text-text-secondary cursor-pointer">
                  Inherit current filters & columns
                </label>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-border mt-1">
                <Button variant="ghost" size="sm" onClick={() => setShowNew(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleCreate} disabled={!newName.trim() || !!errorMsg}>
                  Create View
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
