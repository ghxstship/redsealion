'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star } from 'lucide-react';
import Button from '@/components/ui/Button';
import FormTextarea from '@/components/ui/FormTextarea';
import FormLabel from '@/components/ui/FormLabel';
import EmptyState from '@/components/ui/EmptyState';

interface Rating {
  id: string;
  rating: number;
  categories: Record<string, number>;
  comment: string | null;
  created_at: string;
  users?: { full_name: string } | null;
}

const CATEGORIES = ['punctuality', 'quality', 'communication', 'professionalism', 'safety'];

interface CrewRatingsPanelProps {
  crewId: string;
}

function StarRating({ value, onChange, size = 'md' }: { value: number; onChange?: (v: number) => void; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          disabled={!onChange}
          className={`${onChange ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <Star
            size={size === 'sm' ? 14 : 20}
            className={star <= value ? 'text-amber-400 fill-amber-400' : 'text-border fill-border'}
          />
        </button>
      ))}
    </div>
  );
}

export default function CrewRatingsPanel({ crewId }: CrewRatingsPanelProps) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newRating, setNewRating] = useState({
    rating: 0,
    categories: {} as Record<string, number>,
    comment: '',
  });

  const fetchRatings = useCallback(async () => {
    try {
      const res = await fetch(`/api/crew/${crewId}/ratings`);
      if (res.ok) {
        const data = await res.json();
        setRatings(data.ratings || []);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [crewId]);

  useEffect(() => { fetchRatings(); }, [fetchRatings]);

  async function handleSubmit() {
    if (newRating.rating === 0) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/crew/${crewId}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRating),
      });
      if (res.ok) {
        setNewRating({ rating: 0, categories: {}, comment: '' });
        setShowForm(false);
        await fetchRatings();
      }
    } catch { /* silent */ } finally {
      setSaving(false);
    }
  }

  const avgRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : 0;

  return (
    <div className="rounded-xl border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-foreground">Performance Ratings</h3>
          {ratings.length > 0 && (
            <div className="flex items-center gap-1.5">
              <StarRating value={Math.round(avgRating)} size="sm" />
              <span className="text-xs text-text-muted">({avgRating.toFixed(1)} avg, {ratings.length} reviews)</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-bg-secondary transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Rating'}
        </button>
      </div>

      {showForm && (
        <div className="border-b border-border bg-bg-secondary/30 px-5 py-4 space-y-4">
          <div>
            <FormLabel>Overall Rating</FormLabel>
            <StarRating value={newRating.rating} onChange={(v) => setNewRating((p) => ({ ...p, rating: v }))} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {CATEGORIES.map((cat) => (
              <div key={cat}>
                <FormLabel>{cat}</FormLabel>
                <StarRating
                  value={newRating.categories[cat] ?? 0}
                  onChange={(v) => setNewRating((p) => ({ ...p, categories: { ...p.categories, [cat]: v } }))}
                  size="sm"
                />
              </div>
            ))}
          </div>
          <div>
            <FormLabel>Comment</FormLabel>
            <FormTextarea
              value={newRating.comment}
              onChange={(e) => setNewRating((p) => ({ ...p, comment: e.target.value }))}
              rows={2}
              placeholder="Optional feedback…"
            />
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSubmit}
              disabled={saving || newRating.rating === 0}>
              {saving ? 'Submitting…' : 'Submit Rating'}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="px-5 py-8 text-center text-sm text-text-muted">Loading…</div>
      ) : ratings.length === 0 ? (
        <EmptyState message="No ratings yet" className="border-0 shadow-none px-2 py-8" />
      ) : (
        <div className="divide-y divide-border">
          {ratings.map((r) => (
            <div key={r.id} className="px-5 py-3.5">
              <div className="flex items-center gap-2 mb-1">
                <StarRating value={r.rating} size="sm" />
                <span className="text-xs text-text-muted">
                  {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                {r.users && (
                  <span className="text-xs text-text-muted">by {(r.users as { full_name: string }).full_name}</span>
                )}
              </div>
              {r.comment && <p className="text-sm text-text-secondary">{r.comment}</p>}
              {Object.keys(r.categories).length > 0 && (
                <div className="mt-1 flex flex-wrap gap-2">
                  {Object.entries(r.categories).map(([cat, val]) => (
                    <span key={cat} className="text-[11px] text-text-muted">
                      <span className="capitalize">{cat}</span>: {val}/5
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
