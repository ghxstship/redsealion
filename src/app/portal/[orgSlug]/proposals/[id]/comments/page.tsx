import { getInitials } from '@/lib/utils';

interface PageProps {
  params: Promise<{ orgSlug: string; id: string }>;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

interface CommentDisplay {
  id: string;
  authorName: string;
  authorAvatarUrl: string | null;
  timestamp: string;
  body: string;
  phaseReference: string | null;
  deliverableReference: string | null;
}

const mockComments: CommentDisplay[] = [
  {
    id: 'c-1',
    authorName: 'Sarah Mitchell',
    authorAvatarUrl: null,
    timestamp: '2026-02-08T14:30:00Z',
    body: 'The creative brief looks excellent. We especially appreciate the audience persona work — it aligns perfectly with our internal research. One minor note: can we ensure the "heritage" narrative thread carries through to the interactive pods in Phase 5?',
    phaseReference: 'Phase 1: Discovery',
    deliverableReference: 'Creative Brief',
  },
  {
    id: 'c-2',
    authorName: 'Alex Rivera',
    authorAvatarUrl: null,
    timestamp: '2026-02-25T10:15:00Z',
    body: 'Renderings are stunning. The team is really excited about the centerpiece structure. Quick question: for the material spec book, are the tension fabric samples available for us to see in person before we finalize?',
    phaseReference: 'Phase 2: Design',
    deliverableReference: '3D Design Package',
  },
  {
    id: 'c-3',
    authorName: 'Jordan Park',
    authorAvatarUrl: null,
    timestamp: '2026-03-10T16:45:00Z',
    body: 'We have scheduled the production drawing review for next Monday. Our facilities team will also be joining to review the structural load requirements for Pioneer Courthouse Square. Please send calendar invites to the expanded team list.',
    phaseReference: 'Phase 3: Engineering',
    deliverableReference: null,
  },
  {
    id: 'c-4',
    authorName: 'Sarah Mitchell',
    authorAvatarUrl: null,
    timestamp: '2026-03-18T09:00:00Z',
    body: 'Confirming receipt of the PE-stamped structural drawings. Forwarding to our internal safety review team now. Should have feedback within 3 business days.',
    phaseReference: 'Phase 3: Engineering',
    deliverableReference: 'Structural Engineering',
  },
  {
    id: 'c-5',
    authorName: 'Alex Rivera',
    authorAvatarUrl: null,
    timestamp: '2026-03-25T11:30:00Z',
    body: 'Just watched the walkthrough animation — incredible work. The lighting transitions between zones are exactly what we envisioned. Sharing this with our CMO today. One thing to flag: can we discuss the scent diffusion add-on? There is growing interest internally.',
    phaseReference: null,
    deliverableReference: null,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function Avatar({ name }: { name: string }) {
  const initials = getInitials(name);
  // Deterministic color based on name
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

export default async function CommentsPage({ params }: PageProps) {
  const { orgSlug, id } = await params;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Comments</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Discussion thread for this proposal.
        </p>
      </div>

      {/* Comment thread */}
      <div className="space-y-4">
        {mockComments.map((comment) => (
          <div
            key={comment.id}
            className="rounded-lg border border-border bg-background p-5"
          >
            <div className="flex items-start gap-3">
              <Avatar name={comment.authorName} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">
                    {comment.authorName}
                  </span>
                  <span className="text-[11px] text-text-muted">
                    {formatTimestamp(comment.timestamp)}
                  </span>
                </div>

                {/* Reference badges */}
                {(comment.phaseReference || comment.deliverableReference) && (
                  <div className="flex items-center gap-1.5 mt-1">
                    {comment.phaseReference && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-text-muted">
                        {comment.phaseReference}
                      </span>
                    )}
                    {comment.deliverableReference && (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                        {comment.deliverableReference}
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
        ))}
      </div>

      {/* Add comment form */}
      <div className="rounded-lg border border-border bg-background p-5">
        <h3 className="text-sm font-medium text-foreground mb-3">Add a Comment</h3>
        <form>
          <textarea
            name="body"
            rows={4}
            placeholder="Write your comment..."
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-offset-1 resize-y"
            style={{ '--tw-ring-color': 'var(--org-primary)' } as React.CSSProperties}
          />
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: 'var(--org-primary)' }}
            >
              Post Comment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
