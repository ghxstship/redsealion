'use client';

import { useState, useMemo, type ReactNode } from 'react';
import type { SavedView } from '@/hooks/useEntityViews';
import {
  Table, Kanban, Calendar, GanttChart, List, LayoutGrid,
  ArrowRight, FileText, Users, User, Lock, Star, Check,
  MoreHorizontal, Plus,
} from 'lucide-react';
import Tooltip from '@/components/ui/Tooltip';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';

interface ViewSidebarProps {
  views: SavedView[];
  activeViewId: string | null;
  onSelectView: (id: string) => void;
  onCreateView: (name: string) => void;
  onDeleteView: (id: string) => void;
  onDuplicateView: (id: string) => void;
  onUpdateView?: (id: string, updates: Partial<SavedView>) => void;
  onToggleFavorite?: (id: string) => void;
  loading: boolean;
}

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

const COLLAB_ICONS: Record<string, ReactNode> = {
  collaborative: <Users size={10} />,
  personal: <User size={10} />,
  locked: <Lock size={10} />,
};

const COLLAB_LABELS: Record<string, string> = {
  collaborative: 'Collaborative', personal: 'Personal', locked: 'Locked',
};

export default function ViewSidebar({
  views,
  activeViewId,
  onSelectView,
  onCreateView,
  onDeleteView,
  onDuplicateView,
  onUpdateView,
  onToggleFavorite,
  loading,
}: ViewSidebarProps) {
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [contextId, setContextId] = useState<string | null>(null);
  const [viewSearch, setViewSearch] = useState('');

  const filteredViews = useMemo(() => {
    if (!viewSearch) return views;
    const q = viewSearch.toLowerCase();
    return views.filter((v) => v.name.toLowerCase().includes(q));
  }, [views, viewSearch]);

  function handleCreate() {
    if (!newName.trim()) return;
    onCreateView(newName.trim());
    setNewName('');
    setShowNew(false);
  }

  function handleCollabChange(viewId: string, type: 'collaborative' | 'personal' | 'locked') {
    onUpdateView?.(viewId, { collaboration_type: type } as Partial<SavedView>);
    setContextId(null);
  }

  function renderViewItem(view: SavedView) {
    return (
      <div key={view.id} className="relative group">
        <button
          onClick={() => onSelectView(view.id)}
          className={`w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors text-left ${
            activeViewId === view.id
              ? 'bg-bg-secondary font-medium text-foreground'
              : 'text-text-secondary hover:bg-bg-secondary hover:text-foreground'
          }`}
        >
          <span className="flex items-center text-xs">{view.icon ?? DISPLAY_ICONS[view.display_type] ?? <Table size={12} />}</span>
          <span className="flex-1 truncate">{view.name}</span>
          {/* Favorite star */}
          {onToggleFavorite && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(view.id); }}
              className={`transition-opacity ${view.is_favorite ? 'opacity-100 text-amber-500' : 'opacity-0 group-hover:opacity-50 text-text-muted hover:text-amber-500'}`}
              title={view.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star size={12} fill={view.is_favorite ? 'currentColor' : 'none'} />
            </button>
          )}
          <Tooltip label={COLLAB_LABELS[view.collaboration_type]} position="right">
            <span className="flex items-center">{COLLAB_ICONS[view.collaboration_type] ?? ''}</span>
          </Tooltip>
        </button>

        {/* Context menu trigger */}
        <button
          onClick={(e) => { e.stopPropagation(); setContextId(contextId === view.id ? null : view.id); }}
          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity rounded p-0.5 text-text-muted hover:text-foreground"
          title="View options"
        >
          <MoreHorizontal size={12} />
        </button>

        {contextId === view.id && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setContextId(null)} />
            <div className="absolute top-full right-0 mt-1 z-40 w-44 rounded-lg border border-border bg-white shadow-xl py-1">
              <button onClick={() => { onDuplicateView(view.id); setContextId(null); }} className="w-full px-3 py-1.5 text-left text-xs text-foreground hover:bg-bg-secondary transition-colors">Duplicate</button>
              {onToggleFavorite && (
                <button onClick={() => { onToggleFavorite(view.id); setContextId(null); }} className="w-full px-3 py-1.5 text-left text-xs text-foreground hover:bg-bg-secondary transition-colors flex items-center gap-1.5">
                  <Star size={11} fill={view.is_favorite ? 'none' : 'currentColor'} />
                  {view.is_favorite ? 'Unfavorite' : 'Favorite'}
                </button>
              )}
              <div className="border-t border-border my-1" />
              <p className="px-3 py-1 text-[10px] font-medium text-text-muted uppercase tracking-wider">Collaboration</p>
              {(['collaborative', 'personal', 'locked'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => handleCollabChange(view.id, type)}
                  className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 transition-colors ${
                    view.collaboration_type === type ? 'text-foreground font-medium bg-bg-secondary' : 'text-text-secondary hover:bg-bg-secondary'
                  }`}
                >
                  <span className="flex items-center">{COLLAB_ICONS[type]}</span>
                  {COLLAB_LABELS[type]}
                  {view.collaboration_type === type && <Check size={12} className="ml-auto text-green-600" />}
                </button>
              ))}
              <div className="border-t border-border my-1" />
              <button onClick={() => { onDeleteView(view.id); setContextId(null); }} className="w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 transition-colors">Delete</button>
            </div>
          </>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-56 shrink-0 border-r border-border bg-white p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-bg-secondary rounded w-24" />
          <div className="h-8 bg-bg-secondary rounded" />
          <div className="h-8 bg-bg-secondary rounded" />
          <div className="h-8 bg-bg-secondary rounded" />
        </div>
      </div>
    );
  }

  const favorites = filteredViews.filter((v) => v.is_favorite);
  const nonFavorites = filteredViews.filter((v) => !v.is_favorite);

  return (
    <div className="w-56 shrink-0 border-r border-border bg-white p-4 space-y-1">
      <p className="text-xs font-medium uppercase tracking-wider text-text-muted px-2 mb-2">Views</p>

      {/* View search */}
      <div className="px-1 mb-2">
        <FormInput
          type="text"
          value={viewSearch}
          onChange={(e) => setViewSearch(e.target.value)}
          placeholder="Find a view..." />
      </div>

      {/* Favorited views section */}
      {favorites.length > 0 && (
        <>
          <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted px-2 mt-2 mb-1 flex items-center gap-1">
            <Star size={9} className="text-amber-500" fill="currentColor" /> My Views
          </p>
          {favorites.map((view) => renderViewItem(view))}
          <div className="border-t border-border my-2" />
          <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted px-2 mb-1">All Views</p>
        </>
      )}

      {nonFavorites.map((view) => renderViewItem(view))}

      {filteredViews.length === 0 && viewSearch && (
        <p className="px-2 py-3 text-xs text-text-muted text-center">No views match &ldquo;{viewSearch}&rdquo;</p>
      )}

      {/* Add view */}
      {showNew ? (
        <div className="px-2 pt-2 space-y-2">
          <FormInput
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowNew(false); }}
            placeholder="View name"
            autoFocus />
          <div className="flex gap-1">
            <Button size="sm" onClick={handleCreate} className="flex-1 px-2">Save</Button>
            <Button size="sm" variant="secondary" onClick={() => setShowNew(false)} className="flex-1 px-2 border-border text-text-muted hover:text-foreground">Cancel</Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowNew(true)}
          className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-text-muted hover:text-foreground hover:bg-bg-secondary transition-colors"
        >
          <Plus size={12} />
          Add View
        </button>
      )}
    </div>
  );
}
