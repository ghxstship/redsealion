'use client';

/**
 * Task comments panel — shows threaded comments with @mention support.
 *
 * @module components/admin/tasks/TaskComments
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import type { TaskCommentWithAuthor } from '@/types/database';
import { renderMentions } from '@/lib/mentions';
import FormTextarea from '@/components/ui/FormTextarea';
import { createClient } from '@/lib/supabase/client';

import { getInitials } from '@/lib/utils';
import EmptyState from '@/components/ui/EmptyState';

interface TaskCommentsProps {
  taskId: string;
}

export default function TaskComments({ taskId }: TaskCommentsProps) {
  const [comments, setComments] = useState<TaskCommentWithAuthor[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`);
      if (!res.ok) return;
      const data = await res.json();
      setComments(data.comments ?? []);
    } catch {
      // Silently fail — user sees empty state
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async () => {
    if (!body.trim() || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.comment]);
        setBody('');
        inputRef.current?.focus();
      }
    } catch {
      // Show error state if needed
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  function formatTimestamp(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">
        Comments {comments.length > 0 && <span className="text-text-muted font-normal">({comments.length})</span>}
      </h3>

      {/* Comment list */}
      {loading ? (
        <div className="px-5 py-6 text-center text-xs text-text-muted">Loading…</div>
      ) : comments.length === 0 ? (
        <EmptyState message="No comments yet" description="Be the first to comment." className="border-0 shadow-none px-2 py-8" />
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              {/* Avatar */}
              {comment.users?.avatar_url ? (
                <img
                  src={comment.users.avatar_url}
                  alt={comment.users.full_name}
                  className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-bg-secondary text-xs font-medium text-text-muted">
                  {getInitials(comment.users?.full_name ?? '??')}
                </div>
              )}

              {/* Body */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-foreground truncate">
                    {comment.users?.full_name ?? 'Unknown'}
                  </span>
                  <span className="text-xs text-text-muted flex-shrink-0">
                    {formatTimestamp(comment.created_at)}
                  </span>
                </div>
                <div
                  className="mt-0.5 text-sm text-text-secondary leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderMentions(comment.body) }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment input */}
      <div className="rounded-lg border border-border bg-background focus-within:border-foreground/30 transition-colors">
        <FormTextarea
          ref={inputRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Leave a comment… Use @[Name](id) to mention someone"
          rows={2} />
        <div className="flex items-center justify-between border-t border-border px-3 py-2">
          <span className="text-xs text-text-muted">⌘+Enter to submit</span>
          <Button size="sm" onClick={handleSubmit}
            disabled={!body.trim() || submitting}>
            {submitting ? 'Posting…' : 'Comment'}
          </Button>
        </div>
      </div>
    </div>
  );
}
