'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@/components/ui/Alert';
import FormTextarea from '@/components/ui/FormTextarea';

interface CommentFormProps {
  proposalId: string;
  orgSlug: string;
}

export default function CommentForm({ proposalId, orgSlug }: CommentFormProps) {
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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
        // Trigger server re-render to show new comment without full page reload
        router.refresh();
      } catch {
        setError('Network error. Please try again.');
      }
    });
  }

  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <h3 className="text-sm font-medium text-foreground mb-3">Add a Comment</h3>

      {error && (
        <Alert className="mb-4">{error}</Alert>
      )}

      {success && (
        <div className="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
          Comment posted!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <FormTextarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="Write your comment..."
          style={{ '--tw-ring-color': 'var(--org-primary)' } as React.CSSProperties} />
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={isPending || !body.trim()}
            className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--org-primary)' }}
          >
            {isPending ? 'Posting…' : 'Post Comment'}
          </button>
        </div>
      </form>
    </div>
  );
}
