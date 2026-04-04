'use client';

import { useState, useTransition } from 'react';

interface CommentFormProps {
  proposalId: string;
  orgSlug: string;
}

export default function CommentForm({ proposalId, orgSlug }: CommentFormProps) {
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!body.trim()) {
      setError('Please enter a comment.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/proposals/${proposalId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: body.trim(), is_internal: false }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? 'Failed to post comment');
          return;
        }

        setBody('');
        setSuccess(true);
        // Trigger page refresh to show new comment
        window.location.reload();
      } catch {
        setError('Network error. Please try again.');
      }
    });
  }

  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <h3 className="text-sm font-medium text-foreground mb-3">Add a Comment</h3>

      {error && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
          Comment posted!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="Write your comment..."
          className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-offset-1 resize-y"
          style={{ '--tw-ring-color': 'var(--org-primary)' } as React.CSSProperties}
        />
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={isPending || !body.trim()}
            className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--org-primary)' }}
          >
            {isPending ? 'Posting…' : 'Post Comment'}
          </button>
        </div>
      </form>
    </div>
  );
}
