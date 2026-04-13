'use client';
import Checkbox from '@/components/ui/Checkbox';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import FormTextarea from '@/components/ui/FormTextarea';
import EmptyState from '@/components/ui/EmptyState';
import type { AdvanceComment } from '@/types/database';

interface CommentWithUser extends AdvanceComment {
  users?: { full_name: string; avatar_url: string | null } | null;
}

interface AdvanceCommentThreadProps {
  advanceId: string;
  comments: CommentWithUser[];
  onRefresh: () => void;
  isOrgMember?: boolean;
}

export default function AdvanceCommentThread({ advanceId, comments, onRefresh, isOrgMember }: AdvanceCommentThreadProps) {
  const [text, setText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/advances/${advanceId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_text: text, is_internal: isInternal }),
      });
      if (res.ok) {
        setText('');
        onRefresh();
      }
    } finally {
      setLoading(false);
    }
  }

  function formatTime(str: string) {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(str));
  }

  return (
    <div className="rounded-xl border border-border bg-background">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Comments</h3>
      </div>

      {/* Thread */}
      {comments.length === 0 ? (
        <div className="p-4">
          <EmptyState message="No comments yet" description="Start the conversation." />
        </div>
      ) : (
        <ul className="divide-y divide-border max-h-80 overflow-y-auto">
          {comments.map((c) => (
            <li key={c.id} className="px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-foreground">{c.users?.full_name ?? 'Unknown'}</span>
                <span className="text-[11px] text-text-muted">{c.created_at ? formatTime(c.created_at) : ''}</span>
                {c.is_internal && (
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700">Internal</span>
                )}
              </div>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{c.comment_text}</p>
            </li>
          ))}
        </ul>
      )}

      {/* New comment */}
      <form onSubmit={handlePost} className="border-t border-border px-4 py-3 space-y-2">
        <FormTextarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
        />
        <div className="flex items-center justify-between">
          {isOrgMember && (
            <label className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer">
              <Checkbox checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} className="rounded border-border" />
              Internal only
            </label>
          )}
          <Button type="submit" size="sm" loading={loading} disabled={!text.trim()}>Post</Button>
        </div>
      </form>
    </div>
  );
}
