'use client';

import FormInput from '@/components/ui/FormInput';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

import { RoleGate } from '@/components/shared/RoleGate';
type EntityType = 'equipment' | 'crew' | 'project' | 'lead' | 'client';

const entityTypes: { key: EntityType; label: string }[] = [
  { key: 'equipment', label: 'Equipment' },
  { key: 'crew', label: 'Crew' },
  { key: 'project', label: 'Projects' },
  { key: 'lead', label: 'Leads' },
  { key: 'client', label: 'Clients' },
];

const presetColors = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899',
];

interface Tag {
  id: string;
  name: string;
  color: string;
}

// Fallback data removed - tags load from server

export default function TagsSettingsPage() {
  const [activeType, setActiveType] = useState<EntityType>('equipment');
  const [tags, setTags] = useState<Record<EntityType, Tag[]>>({
    equipment: [], crew: [], project: [], lead: [], client: []
  });
  const [loaded, setLoaded] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(presetColors[0]);

  useEffect(() => {
    fetch('/api/settings/tags')
      .then((res) => res.json())
      .then((data) => {
        if (data.tags && Array.isArray(data.tags)) {
          const grouped: Record<EntityType, Tag[]> = {
            equipment: [], crew: [], project: [], lead: [], client: []
          };
          data.tags.forEach((t: { id: string; entity_type: EntityType; name: string; color: string }) => {
            if (grouped[t.entity_type]) {
              grouped[t.entity_type].push({ id: t.id, name: t.name, color: t.color });
            }
          });
          setTags(grouped);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  function handleAdd() {
    if (!newName.trim()) return;
    const tag: Tag = {
      id: `new-${Date.now()}`,
      name: newName.trim(),
      color: newColor,
    };
    setTags((prev) => ({
      ...prev,
      [activeType]: [...prev[activeType], tag],
    }));

    // Persist to API
    fetch('/api/settings/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_type: activeType, name: tag.name, color: tag.color }),
    }).catch(() => { /* best-effort, failure is non-critical */ });

    setNewName('');
    setNewColor(presetColors[0]);
    setShowAdd(false);
  }

  function handleRemove(tagId: string) {
    setTags((prev) => ({
      ...prev,
      [activeType]: prev[activeType].filter((t) => t.id !== tagId),
    }));

    fetch(`/api/settings/tags?id=${tagId}`, { method: 'DELETE' }).catch(() => { /* best-effort, failure is non-critical */ });
  }

  const currentTags = tags[activeType] || [];

  if (!loaded) return null;

  return (
    <RoleGate resource="settings">
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Tags & Categories</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Organize equipment, crew, projects, leads, and clients.
        </p>
      </div>

      {/* Entity type tabs */}
      <div className="flex gap-1 rounded-lg bg-bg-secondary p-1">
        {entityTypes.map((et) => (
          <Button
            key={et.key}
            onClick={() => { setActiveType(et.key); setShowAdd(false); }}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeType === et.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-text-secondary hover:text-foreground'
            }`}
          >
            {et.label}
          </Button>
        ))}
      </div>

      {/* Tags card */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-foreground">
            {entityTypes.find((e) => e.key === activeType)?.label} Tags
          </h3>
            <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
            Add Tag
            </Button>
        </div>

        {/* Add tag form */}
        {showAdd && (
          <div className="mb-5 rounded-lg border border-border bg-bg-secondary p-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                Tag Name
              </label>
              <FormInput
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter tag name"
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                Color
              </label>
              <div className="flex gap-2">
                {presetColors.map((c) => (
                  <Button variant="ghost"
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={`h-7 w-7 rounded-full border-2 transition-[color,background-color,border-color,opacity,box-shadow] ${
                      newColor === c ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    <span className="sr-only">{c}</span>
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={handleAdd}>
                Add
                </Button>
              <Button
                onClick={() => setShowAdd(false)}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-secondary transition-colors"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Tag pills */}
        <div className="flex flex-wrap gap-2">
          {currentTags.length === 0 ? (
            <EmptyState
              message="No tags created yet"
              description="Create tags to categorize your projects, tasks, and clients."
            />
          ) : (
            currentTags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm border border-border bg-bg-secondary"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
                <Button
                  onClick={() => handleRemove(tag.id)}
                  className="ml-0.5 text-text-muted hover:text-red-500 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </span>
            ))
          )}
        </div>
      </Card>
    </div>
  </RoleGate>
  );
}
