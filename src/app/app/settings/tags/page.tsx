'use client';

import { useState } from 'react';

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

const fallbackTags: Record<EntityType, Tag[]> = {
  equipment: [
    { id: 'eq-1', name: 'Lighting', color: '#EAB308' },
    { id: 'eq-2', name: 'Audio', color: '#3B82F6' },
    { id: 'eq-3', name: 'Video', color: '#8B5CF6' },
    { id: 'eq-4', name: 'Rigging', color: '#F97316' },
    { id: 'eq-5', name: 'Power', color: '#EF4444' },
    { id: 'eq-6', name: 'Staging', color: '#22C55E' },
  ],
  crew: [
    { id: 'cr-1', name: 'Lighting Tech', color: '#EAB308' },
    { id: 'cr-2', name: 'Audio Engineer', color: '#3B82F6' },
    { id: 'cr-3', name: 'Video Op', color: '#8B5CF6' },
    { id: 'cr-4', name: 'Stage Manager', color: '#F97316' },
    { id: 'cr-5', name: 'Rigger', color: '#EF4444' },
    { id: 'cr-6', name: 'Driver', color: '#22C55E' },
  ],
  project: [
    { id: 'pr-1', name: 'Corporate', color: '#3B82F6' },
    { id: 'pr-2', name: 'Festival', color: '#EC4899' },
    { id: 'pr-3', name: 'Product Launch', color: '#8B5CF6' },
    { id: 'pr-4', name: 'Concert', color: '#EF4444' },
    { id: 'pr-5', name: 'Experiential', color: '#06B6D4' },
    { id: 'pr-6', name: 'Brand Activation', color: '#F97316' },
  ],
  lead: [
    { id: 'le-1', name: 'Hot', color: '#EF4444' },
    { id: 'le-2', name: 'Warm', color: '#F97316' },
    { id: 'le-3', name: 'Cold', color: '#3B82F6' },
    { id: 'le-4', name: 'VIP', color: '#8B5CF6' },
    { id: 'le-5', name: 'Returning', color: '#22C55E' },
  ],
  client: [
    { id: 'cl-1', name: 'Enterprise', color: '#3B82F6' },
    { id: 'cl-2', name: 'Mid-Market', color: '#06B6D4' },
    { id: 'cl-3', name: 'Startup', color: '#22C55E' },
    { id: 'cl-4', name: 'Agency', color: '#8B5CF6' },
    { id: 'cl-5', name: 'Brand', color: '#EC4899' },
  ],
};

export default function TagsSettingsPage() {
  const [activeType, setActiveType] = useState<EntityType>('equipment');
  const [tags, setTags] = useState<Record<EntityType, Tag[]>>(() => ({ ...fallbackTags }));
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(presetColors[0]);

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
    }).catch(() => {});

    setNewName('');
    setNewColor(presetColors[0]);
    setShowAdd(false);
  }

  function handleRemove(tagId: string) {
    setTags((prev) => ({
      ...prev,
      [activeType]: prev[activeType].filter((t) => t.id !== tagId),
    }));

    fetch(`/api/settings/tags?id=${tagId}`, { method: 'DELETE' }).catch(() => {});
  }

  const currentTags = tags[activeType];

  return (
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
          <button
            key={et.key}
            onClick={() => { setActiveType(et.key); setShowAdd(false); }}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeType === et.key
                ? 'bg-white text-foreground shadow-sm'
                : 'text-text-secondary hover:text-foreground'
            }`}
          >
            {et.label}
          </button>
        ))}
      </div>

      {/* Tags card */}
      <div className="rounded-xl border border-border bg-white px-6 py-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-foreground">
            {entityTypes.find((e) => e.key === activeType)?.label} Tags
          </h3>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:bg-foreground/90 transition-colors"
          >
            Add Tag
          </button>
        </div>

        {/* Add tag form */}
        {showAdd && (
          <div className="mb-5 rounded-lg border border-border bg-gray-50 p-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                Tag Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter tag name"
                className="w-full rounded-lg border border-border bg-white px-3.5 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                Color
              </label>
              <div className="flex gap-2">
                {presetColors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className={`h-7 w-7 rounded-full border-2 transition-[color,background-color,border-color,opacity,box-shadow] ${
                      newColor === c ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleAdd}
                className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:bg-foreground/90 transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-secondary hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Tag pills */}
        <div className="flex flex-wrap gap-2">
          {currentTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm border border-border bg-gray-50"
            >
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
              <button
                onClick={() => handleRemove(tag.id)}
                className="ml-0.5 text-text-muted hover:text-red-500 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          {currentTags.length === 0 && (
            <p className="text-sm text-text-muted py-4">No tags yet. Click &quot;Add Tag&quot; to create one.</p>
          )}
        </div>
      </div>
    </div>
  );
}
