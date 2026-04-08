'use client';

import { useState, useEffect } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';

interface Tag {
  id: string;
  name: string;
  color: string | null;
}

interface BulkTagModalProps {
  open: boolean;
  onClose: () => void;
  /** IDs of selected entities */
  selectedIds: string[];
  /** Label for confirmation */
  entityLabel: string;
  /** Called with the tag name to apply */
  onConfirm: (tag: string) => Promise<void>;
}

/**
 * Modal to pick/create a tag for bulk tagging.
 * Fetches existing org tags from `/api/settings/tags` and allows free-text entry.
 */
export default function BulkTagModal({
  open,
  onClose,
  selectedIds,
  entityLabel,
  onConfirm,
}: BulkTagModalProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setSelectedTag(null);

    async function fetchTags() {
      setLoading(true);
      try {
        const res = await fetch('/api/settings/tags');
        if (res.ok) {
          const json = await res.json();
          setTags(
            (json.tags ?? []).map((t: Record<string, unknown>) => ({
              id: t.id as string,
              name: (t.name as string) ?? '',
              color: (t.color as string) ?? null,
            })),
          );
        }
      } catch {
        setTags([]);
      } finally {
        setLoading(false);
      }
    }

    void fetchTags();
  }, [open]);

  const filtered = search
    ? tags.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    : tags;

  const isNewTag = search.trim() && !tags.some((t) => t.name.toLowerCase() === search.trim().toLowerCase());

  async function handleConfirm() {
    const tagToApply = selectedTag || (isNewTag ? search.trim() : null);
    if (!tagToApply) return;
    setSubmitting(true);
    try {
      await onConfirm(tagToApply);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  const count = selectedIds.length;
  const plural = count === 1 ? entityLabel : `${entityLabel}s`;
  const activeTag = selectedTag || (isNewTag ? search.trim() : null);

  return (
    <ModalShell open={open} onClose={onClose} title="Apply Tag" subtitle={`Select or create a tag for ${count} ${plural}.`} size="md">
      <div className="space-y-4">
        <SearchInput value={search} onChange={(val) => { setSearch(val); setSelectedTag(null); }} placeholder="Search or create a tag..." />

        {/* Tag grid */}
        <div className="max-h-56 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-text-muted">Loading tags…</div>
          ) : filtered.length === 0 && !isNewTag ? (
            <div className="px-4 py-8 text-center text-sm text-text-muted">
              {search ? 'No matching tags. Press Enter or click below to create one.' : 'No tags yet. Type a name to create one.'}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {filtered.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setSelectedTag(tag.name)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all border ${
                    selectedTag === tag.name
                      ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-500 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/20'
                      : 'bg-bg-secondary border-border text-text-secondary hover:border-foreground/20'
                  }`}
                >
                  {tag.color && (
                    <span
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                  )}
                  {tag.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* New tag indicator */}
        {isNewTag && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-blue-300 bg-blue-50/50 dark:bg-blue-950/20">
            <span className="text-sm text-blue-700 dark:text-blue-300">
              Create new tag: <strong>&ldquo;{search.trim()}&rdquo;</strong>
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={!activeTag || submitting}
          >
            {submitting ? 'Applying…' : `Apply to ${count} ${plural}`}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
