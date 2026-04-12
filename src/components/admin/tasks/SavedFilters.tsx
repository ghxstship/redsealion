'use client';

/**
 * Saved filters — save and restore filter presets for task views.
 *
 * @module components/admin/tasks/SavedFilters
 */

import { useCallback, useEffect, useState } from 'react';
import { Bookmark, Plus, Trash2 } from 'lucide-react';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';

interface SavedFilter {
  id: string;
  name: string;
  filters: Record<string, string>;
}

interface SavedFiltersProps {
  currentFilters: Record<string, string>;
  onApply: (filters: Record<string, string>) => void;
}

export default function SavedFilters({ currentFilters, onApply }: SavedFiltersProps) {
  const [saved, setSaved] = useState<SavedFilter[]>([]);
  const [showSave, setShowSave] = useState(false);
  const [newName, setNewName] = useState('');

  const fetchSaved = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks/saved-filters');
      if (res.ok) {
        const data = await res.json();
        setSaved(data.filters ?? []);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { void fetchSaved(); }, [fetchSaved]);

  async function handleSave() {
    if (!newName.trim()) return;
    try {
      const res = await fetch('/api/tasks/saved-filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, filters: currentFilters }),
      });
      if (res.ok) {
        setNewName('');
        setShowSave(false);
        await fetchSaved();
      }
    } catch { /* silent */ }
  }

  async function handleDelete(id: string) {
    setSaved((prev) => prev.filter((f) => f.id !== id));
    try {
      await fetch(`/api/tasks/saved-filters/${id}`, { method: 'DELETE' });
    } catch {
      await fetchSaved();
    }
  }

  const hasActiveFilters = Object.values(currentFilters).some(
    (v) => v && v !== 'all',
  );

  return (
    <div className="flex items-center gap-2">
      {/* Saved filter pills */}
      {saved.map((filter) => (
        <div key={filter.id} className="group relative">
          <Button
            onClick={() => onApply(filter.filters)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-text-secondary hover:bg-bg-secondary transition-colors"
          >
            <Bookmark size={11} />
            {filter.name}
          </Button>
          <Button
            onClick={() => handleDelete(filter.id)}
            className="absolute -top-1 -right-1 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white"
          >
            <Trash2 size={8} />
          </Button>
        </div>
      ))}

      {/* Save current filter */}
      {hasActiveFilters && !showSave && (
        <Button
          onClick={() => setShowSave(true)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1 text-xs text-text-muted hover:text-foreground hover:border-text-muted transition-colors"
        >
          <Plus size={11} /> Save filter
        </Button>
      )}

      {showSave && (
        <div className="flex items-center gap-2">
          <FormInput
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
            placeholder="Filter name"
            className="!py-1 !text-xs w-32"
            autoFocus
          />
          <Button
            onClick={handleSave}
            className="text-xs font-medium text-foreground"
            disabled={!newName.trim()}
          >
            Save
          </Button>
          <Button
            onClick={() => setShowSave(false)}
            className="text-xs text-text-muted"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
