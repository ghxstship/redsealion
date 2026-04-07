'use client';

/**
 * Favorites / starred items — quick-access bookmarks for any entity.
 *
 * @module components/shared/FavoriteButton
 */

import { useState, useEffect, useCallback } from 'react';
import { Star } from 'lucide-react';

interface FavoriteButtonProps {
  entityType: string;
  entityId: string;
  size?: number;
}

export default function FavoriteButton({
  entityType,
  entityId,
  size = 16,
}: FavoriteButtonProps) {
  const [starred, setStarred] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/favorites?entity_type=${entityType}&entity_id=${entityId}`,
      );
      if (res.ok) {
        const data = await res.json();
        setStarred(data.favorited ?? false);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  async function toggle() {
    const newState = !starred;
    setStarred(newState);

    try {
      await fetch('/api/favorites', {
        method: newState ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_type: entityType, entity_id: entityId }),
      });
    } catch {
      setStarred(!newState);
    }
  }

  if (loading) return null;

  return (
    <button
      onClick={toggle}
      className={`transition-colors ${
        starred
          ? 'text-amber-500 hover:text-amber-600'
          : 'text-text-muted/40 hover:text-amber-400'
      }`}
      title={starred ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Star
        size={size}
        fill={starred ? 'currentColor' : 'none'}
        strokeWidth={starred ? 0 : 1.5}
      />
    </button>
  );
}
