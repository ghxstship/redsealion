import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import EmptyState from '@/components/ui/EmptyState';
import { getInitials } from '@/lib/utils';
import CommentForm from '@/components/portal/CommentForm';

interface PageProps {
  params: Promise<{ orgSlug: string; id: string }>;
}

export default async function CommentsPage({ params }: PageProps) {
  const { orgSlug, id } = await params;

  const supabase = await createClient();

  // Verify proposal exists and belongs to this org
  const { data: proposal } = await supabase
    .from('proposals')
    .select('id, organization_id')
    .eq('id', id)
    .single();

  if (!proposal) {
    notFound();
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .single();

  if (!org || proposal.organization_id !== org.id) {
    notFound();
  }

  // Fetch comments for this proposal (only non-internal ones visible to clients)
  const { data: comments } = await supabase
    .from('proposal_comments')
    .select('*, author:users!author_id(full_name, avatar_url)')
    .eq('proposal_id', id)
    .eq('is_internal', false)
    .order('created_at', { ascending: true });

  const commentList = comments ?? [];

  // Fetch phase and deliverable names for reference badges
  const { data: phases } = await supabase
    .from('phases')
    .select('id, phase_number, name')
    .eq('proposal_id', id);

  const { data: deliverables } = await supabase
    .from('phase_deliverables')
    .select('id, name')
    .in('phase_id', (phases ?? []).map((p) => p.id));

  const phaseMap = new Map((phases ?? []).map((p) => [p.id, `Phase ${p.phase_number}: ${p.name}`]));
  const deliverableMap = new Map((deliverables ?? []).map((d) => [d.id, d.name]));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Comments</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Discussion thread for this proposal.
        </p>
      </div>

      {/* Comment thread */}
      {commentList.length === 0 ? (
        <EmptyState
          message="No comments yet"
          description="Use the field below to start the conversation."
        />
      ) : (
        <div className="space-y-4">
          {commentList.map((comment) => {
            const authorName =
              (comment.author as { full_name: string } | null)?.full_name ?? 'Unknown';
            const phaseRef = comment.phase_id ? phaseMap.get(comment.phase_id) ?? null : null;
            const delivRef = comment.deliverable_id
              ? deliverableMap.get(comment.deliverable_id) ?? null
              : null;

            return (
              <div
                key={comment.id}
                className="rounded-lg border border-border bg-background p-5"
              >
                <div className="flex items-start gap-3">
                  <Avatar name={authorName} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">
                        {authorName}
                      </span>
                      <span className="text-[11px] text-text-muted">
                        {formatTimestamp(comment.created_at)}
                      </span>
                    </div>

                    {/* Reference badges */}
                    {(phaseRef || delivRef) && (
                      <div className="flex items-center gap-1.5 mt-1">
                        {phaseRef && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-text-muted">
                            {phaseRef}
                          </span>
                        )}
                        {delivRef && (
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                            {delivRef}
                          </span>
                        )}
                      </div>
                    )}

                    <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                      {comment.body}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add comment form */}
      <CommentForm proposalId={id} orgSlug={orgSlug} />
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = getInitials(name);
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-pink-100 text-pink-700',
  ];
  const colorIndex = name.length % colors.length;
  return (
    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${colors[colorIndex]}`}>
      {initials}
    </div>
  );
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
