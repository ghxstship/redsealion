'use client';

/**
 * Task template library — create reusable task lists that can be
 * applied to projects. Replaces the need to manually recreate
 * common task sets.
 *
 * @module components/admin/tasks/TaskTemplateLibrary
 */

import { useCallback, useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import ModalShell from '@/components/ui/ModalShell';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import FormTextarea from '@/components/ui/FormTextarea';
import { Layers, Plus, Copy, Trash2 } from 'lucide-react';

interface TaskTemplateItem {
  title: string;
  priority: string;
  estimated_hours: number | null;
}

interface TaskTemplate {
  id: string;
  name: string;
  description: string | null;
  items: TaskTemplateItem[];
  created_at: string;
}

interface TaskTemplateLibraryProps {
  onApply?: (items: TaskTemplateItem[]) => void;
}

export default function TaskTemplateLibrary({ onApply }: TaskTemplateLibraryProps) {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newItems, setNewItems] = useState<TaskTemplateItem[]>([
    { title: '', priority: 'medium', estimated_hours: null },
  ]);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates ?? []);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const validItems = newItems.filter((i) => i.title.trim());
      const res = await fetch('/api/tasks/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          description: newDescription || null,
          items: validItems,
        }),
      });
      if (res.ok) {
        setNewName('');
        setNewDescription('');
        setNewItems([{ title: '', priority: 'medium', estimated_hours: null }]);
        setShowCreate(false);
        await fetchTemplates();
      }
    } catch { /* silent */ } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetch(`/api/tasks/templates/${id}`, { method: 'DELETE' });
    } catch {
      await fetchTemplates();
    }
  }

  function addItem() {
    setNewItems((prev) => [...prev, { title: '', priority: 'medium', estimated_hours: null }]);
  }

  function updateItem(idx: number, field: string, value: string | number | null) {
    setNewItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    );
  }

  function removeItem(idx: number) {
    setNewItems((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Layers size={14} className="text-text-muted" />
          Task Templates
        </h3>
        <button
          onClick={() => setShowCreate(true)}
          className="text-xs font-medium text-text-muted hover:text-foreground transition-colors flex items-center gap-1"
        >
          <Plus size={12} /> Create
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-text-muted text-center py-4">Loading…</p>
      ) : templates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-bg-secondary/30 px-4 py-6 text-center">
          <Layers size={20} className="mx-auto text-text-muted/50 mb-1" />
          <p className="text-xs text-text-muted">
            No task templates yet. Create one to quickly scaffold projects.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="rounded-xl border border-border bg-white p-4 group hover:border-foreground/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{tpl.name}</p>
                  {tpl.description && (
                    <p className="text-xs text-text-muted mt-0.5">{tpl.description}</p>
                  )}
                  <p className="text-[11px] text-text-muted mt-1">
                    {tpl.items.length} task{tpl.items.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onApply && (
                    <button
                      onClick={() => onApply(tpl.items)}
                      className="rounded p-1 text-text-muted hover:text-foreground hover:bg-bg-secondary transition-colors"
                      title="Apply to project"
                    >
                      <Copy size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(tpl.id)}
                    className="rounded p-1 text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete template"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Task preview */}
              <div className="mt-2 flex flex-wrap gap-1">
                {tpl.items.slice(0, 5).map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded bg-bg-secondary px-2 py-0.5 text-[11px] text-text-secondary"
                  >
                    {item.title}
                  </span>
                ))}
                {tpl.items.length > 5 && (
                  <span className="inline-flex items-center px-2 py-0.5 text-[11px] text-text-muted">
                    +{tpl.items.length - 5} more
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create template modal */}
      <ModalShell open={showCreate} onClose={() => setShowCreate(false)} title="Create Task Template">
        <div className="space-y-4">
          <div>
            <FormLabel>Template Name</FormLabel>
            <FormInput
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Brand Activation Checklist"
              required
            />
          </div>
          <div>
            <FormLabel>Description</FormLabel>
            <FormTextarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={2}
              placeholder="What this template is used for…"
            />
          </div>

          <div>
            <FormLabel>Tasks</FormLabel>
            <div className="space-y-2">
              {newItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <FormInput
                    type="text"
                    value={item.title}
                    onChange={(e) => updateItem(idx, 'title', e.target.value)}
                    placeholder={`Task ${idx + 1}`}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="text-text-muted hover:text-red-600 transition-colors p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addItem}
                className="text-xs font-medium text-text-muted hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Plus size={12} /> Add task
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={creating} disabled={!newName.trim()}>
              {creating ? 'Creating…' : 'Create Template'}
            </Button>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}
