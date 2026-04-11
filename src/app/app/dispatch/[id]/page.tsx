'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import FormTextarea from '@/components/ui/FormTextarea';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import BiddingPanel from '@/components/admin/work-orders/BiddingPanel';
import StatusBadge, { WORK_ORDER_STATUS_COLORS, PRIORITY_COLORS } from '@/components/ui/StatusBadge';
import { formatLabel } from '@/lib/utils';

interface WorkOrder {
  id: string;
  wo_number: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  is_public_board?: boolean;
  location_name: string | null;
  location_address: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  dispatched_at: string | null;
  dispatched_by: string | null;
  completed_at: string | null;
  completed_by: string | null;
  completion_notes: string | null;
  checklist: Array<{ text: string; done: boolean }> | null;
  work_order_assignments: Array<{
    id: string;
    role: string | null;
    status: string;
    assigned_at: string;
    crew_profiles: { id: string; full_name: string; phone: string | null } | null;
  }>;
  job_site_photos: Array<{
    id: string;
    file_url: string;
    thumbnail_url: string | null;
    caption: string | null;
    photo_type: string;
    taken_at: string;
  }>;
}


const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

const STATUS_TRANSITIONS: Record<string, Array<{ to: string; label: string; variant: 'primary' | 'secondary' | 'danger' }>> = {
  draft: [
    { to: 'dispatched', label: 'Dispatch', variant: 'primary' },
    { to: 'cancelled', label: 'Cancel', variant: 'danger' },
  ],
  dispatched: [
    { to: 'in_progress', label: 'Mark In Progress', variant: 'primary' },
    { to: 'cancelled', label: 'Cancel', variant: 'danger' },
  ],
  accepted: [
    { to: 'in_progress', label: 'Start Work', variant: 'primary' },
    { to: 'cancelled', label: 'Cancel', variant: 'danger' },
  ],
  in_progress: [
    { to: 'completed', label: 'Mark Completed', variant: 'primary' },
    { to: 'cancelled', label: 'Cancel', variant: 'danger' },
  ],
  completed: [],
  cancelled: [],
};

function formatDateTime(s: string | null): string {
  if (!s) return '—';
  return new Date(s).toLocaleString();
}

function toLocalDateTimeInput(s: string | null): string {
  if (!s) return '';
  const d = new Date(s);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function DispatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [wo, setWo] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [woId, setWoId] = useState<string | null>(null);

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState({
    title: '', description: '', priority: 'medium',
    location_name: '', location_address: '',
    scheduled_start: '', scheduled_end: '',
    budget_range: '', bidding_deadline: '',
  });

  // Crew rating
  const [ratingCrewId, setRatingCrewId] = useState<string | null>(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingLoading, setRatingLoading] = useState(false);

  useEffect(() => {
    params.then((p) => setWoId(p.id));
  }, [params]);

  const fetchWorkOrder = useCallback(async () => {
    if (!woId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/work-orders/${woId}`);
      if (!res.ok) {
        setError('Work order not found.');
        return;
      }
      const body = await res.json();
      setWo(body.work_order);
    } catch {
      setError('Failed to load work order.');
    } finally {
      setLoading(false);
    }
  }, [woId]);

  useEffect(() => {
    if (woId) fetchWorkOrder();
  }, [woId, fetchWorkOrder]);

  function enterEditMode() {
    if (!wo) return;
    setEditFields({
      title: wo.title,
      description: wo.description ?? '',
      priority: wo.priority,
      location_name: wo.location_name ?? '',
      location_address: wo.location_address ?? '',
      scheduled_start: toLocalDateTimeInput(wo.scheduled_start),
      scheduled_end: toLocalDateTimeInput(wo.scheduled_end),
      budget_range: (wo as any).budget_range ?? '',
      bidding_deadline: toLocalDateTimeInput((wo as any).bidding_deadline),
    });
    setEditMode(true);
  }

  async function saveEdit() {
    if (!woId) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/work-orders/${woId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editFields.title.trim(),
          description: editFields.description.trim() || null,
          priority: editFields.priority,
          location_name: editFields.location_name.trim() || null,
          location_address: editFields.location_address.trim() || null,
          scheduled_start: editFields.scheduled_start || null,
          scheduled_end: editFields.scheduled_end || null,
          budget_range: editFields.budget_range || null,
          bidding_deadline: editFields.bidding_deadline || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'Failed to save changes.');
        return;
      }
      setEditMode(false);
      await fetchWorkOrder();
    } catch {
      setError('Network error.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!woId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/work-orders/${woId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'Failed to update status.');
        return;
      }
      await fetchWorkOrder();
    } catch {
      setError('Network error.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!woId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/work-orders/${woId}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'Failed to delete work order.');
        return;
      }
      router.push('/app/dispatch');
    } catch {
      setError('Network error.');
    } finally {
      setActionLoading(false);
    }
  }

  async function toggleMarketplace() {
    if (!woId || !wo) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/work-orders/${woId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public_board: !wo.is_public_board }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'Failed to update marketplace status.');
        return;
      }
      await fetchWorkOrder();
    } catch {
      setError('Network error.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleChecklistToggle(index: number) {
    if (!wo || !woId) return;
    const checklist = [...(wo.checklist ?? [])];
    checklist[index] = { ...checklist[index], done: !checklist[index].done };
    try {
      const res = await fetch(`/api/work-orders/${woId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklist }),
      });
      if (res.ok) {
        setWo({ ...wo, checklist });
      }
    } catch {
      // silent
    }
  }

  async function handleRemoveAssignment(assignmentId: string) {
    if (!woId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/work-orders/${woId}/assignments?assignment_id=${assignmentId}`, { method: 'DELETE' });
      if (res.ok) await fetchWorkOrder();
    } catch {
      // silent
    } finally {
      setActionLoading(false);
    }
  }

  async function submitCrewRating() {
    if (!ratingCrewId || !woId) return;
    setRatingLoading(true);
    try {
      await fetch(`/api/crew/${ratingCrewId}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          work_order_id: woId,
          score: ratingScore,
          comment: ratingComment.trim() || undefined,
        }),
      });
      setRatingCrewId(null);
      setRatingScore(5);
      setRatingComment('');
    } catch {
      // silent
    } finally {
      setRatingLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-7 w-40 rounded bg-zinc-200" />
        <div className="h-4 w-64 rounded bg-zinc-100" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-48 rounded-xl bg-zinc-100" />
          <div className="h-48 rounded-xl bg-zinc-100" />
        </div>
      </div>
    );
  }

  if (error && !wo) {
    return (
      <TierGate feature="work_orders">
        <Alert variant="error" className="text-center">
          <p>{error}</p>
          <Link href="/app/dispatch" className="mt-4 inline-block text-sm font-medium text-foreground hover:underline">
            ← Back to Dispatch
          </Link>
        </Alert>
      </TierGate>
    );
  }

  if (!wo) return null;

  const transitions = STATUS_TRANSITIONS[wo.status] ?? [];
  const assignments = wo.work_order_assignments ?? [];
  const photos = wo.job_site_photos ?? [];
  const checklist = wo.checklist ?? [];
  const isEditable = wo.status !== 'completed' && wo.status !== 'cancelled';
  const showRatingPrompt = wo.status === 'completed' && assignments.length > 0;

  const inputClass = 'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20';

  return (
    <TierGate feature="work_orders">
      <PageHeader title={wo.wo_number} subtitle={wo.title}>
        <div className="flex items-center gap-2">
          {isEditable && !editMode && (
            <Button variant="secondary" onClick={enterEditMode}>Edit</Button>
          )}
          <Button variant="secondary" href="/app/dispatch">← Back</Button>
        </div>
      </PageHeader>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-medium hover:underline">Dismiss</button>
        </Alert>
      )}

      {/* Status Actions Bar */}
      {!editMode && (transitions.length > 0 || (isEditable)) && (
        <div className="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-xl border border-border bg-bg-secondary/50">
          <StatusBadge status={wo.status} colorMap={WORK_ORDER_STATUS_COLORS} className="px-3 py-1" />
          <div className="flex-1" />
          {transitions.map((t) => (
            <Button
              key={t.to}
              variant={t.variant === 'danger' ? 'secondary' : undefined}
              disabled={actionLoading}
              onClick={() => handleStatusChange(t.to)}
              className={t.variant === 'danger' ? 'text-red-600 border-red-200 hover:bg-red-50' : ''}
            >
              {actionLoading ? '...' : t.label}
            </Button>
          ))}
          {isEditable && (
            <Button
              variant={wo.is_public_board ? "secondary" : "primary"}
              disabled={actionLoading}
              onClick={toggleMarketplace}
            >
              {wo.is_public_board ? 'Remove from Marketplace' : 'Post to Marketplace'}
            </Button>
          )}
          {isEditable && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={actionLoading}
              className="text-xs text-text-muted hover:text-red-600 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Work Order"
        message="Are you sure you want to delete this work order? This action cannot be undone."
        confirmLabel={actionLoading ? 'Deleting...' : 'Delete Work Order'}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Edit Form */}
      {editMode && (
        <Card className="mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Edit Work Order</h3>
          <div className="space-y-4">
            <div>
            <FormLabel>Title</FormLabel>
            <FormInput type="text" value={editFields.title} onChange={(e) => setEditFields({ ...editFields, title: e.target.value })} />
            </div>
            <div>
            <FormLabel>Description</FormLabel>
            <FormTextarea rows={3} value={editFields.description} onChange={(e) => setEditFields({ ...editFields, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormLabel>Priority</FormLabel>
                <select value={editFields.priority} onChange={(e) => setEditFields({ ...editFields, priority: e.target.value })} className={inputClass}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <FormLabel>Location Name</FormLabel>
                <FormInput type="text" value={editFields.location_name} onChange={(e) => setEditFields({ ...editFields, location_name: e.target.value })} />
              </div>
            </div>
            <div>
              <FormLabel>Location Address</FormLabel>
              <FormInput type="text" value={editFields.location_address} onChange={(e) => setEditFields({ ...editFields, location_address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormLabel>Scheduled Start</FormLabel>
                <FormInput type="datetime-local" value={editFields.scheduled_start} onChange={(e) => setEditFields({ ...editFields, scheduled_start: e.target.value })} />
              </div>
              <div>
                <FormLabel>Scheduled End</FormLabel>
                <FormInput type="datetime-local" value={editFields.scheduled_end} onChange={(e) => setEditFields({ ...editFields, scheduled_end: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 mt-2">
              <div>
                <FormLabel>Budget Range</FormLabel>
                <FormInput type="text" placeholder="e.g. $500 - $800" value={editFields.budget_range} onChange={(e) => setEditFields({ ...editFields, budget_range: e.target.value })} />
              </div>
              <div>
                <FormLabel>Bidding Deadline</FormLabel>
                <FormInput type="datetime-local" value={editFields.bidding_deadline} onChange={(e) => setEditFields({ ...editFields, bidding_deadline: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="secondary" onClick={() => setEditMode(false)} disabled={actionLoading}>Cancel</Button>
            <Button onClick={saveEdit} disabled={actionLoading || !editFields.title.trim()}>
              {actionLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </Card>
      )}

      {!editMode && (
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          {/* Details Card */}
          <Card>
            <h3 className="text-sm font-semibold text-foreground mb-4">Details</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-muted">Status</dt>
                <dd><StatusBadge status={wo.status} colorMap={STATUS_COLORS} /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Priority</dt>
                <dd><StatusBadge status={wo.priority} colorMap={PRIORITY_COLORS} /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Location</dt>
                <dd className="text-foreground">{wo.location_name ?? '—'}</dd>
              </div>
              {wo.location_address && (
                <div className="flex justify-between">
                  <dt className="text-text-muted">Address</dt>
                  <dd className="text-foreground text-right max-w-[200px]">{wo.location_address}</dd>
                </div>
              )}
            </dl>
            {wo.description && (
              <p className="mt-4 text-sm text-text-secondary border-t border-border pt-4">{wo.description}</p>
            )}
          </Card>

          {/* Schedule Card */}
          <Card>
            <h3 className="text-sm font-semibold text-foreground mb-4">Schedule</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-text-muted">Scheduled Start</dt><dd className="text-foreground">{formatDateTime(wo.scheduled_start)}</dd></div>
              <div className="flex justify-between"><dt className="text-text-muted">Scheduled End</dt><dd className="text-foreground">{formatDateTime(wo.scheduled_end)}</dd></div>
              <div className="flex justify-between"><dt className="text-text-muted">Actual Start</dt><dd className="text-foreground">{formatDateTime(wo.actual_start)}</dd></div>
              <div className="flex justify-between"><dt className="text-text-muted">Actual End</dt><dd className="text-foreground">{formatDateTime(wo.actual_end)}</dd></div>
              <div className="flex justify-between"><dt className="text-text-muted">Dispatched At</dt><dd className="text-foreground">{formatDateTime(wo.dispatched_at)}</dd></div>
              <div className="flex justify-between"><dt className="text-text-muted">Completed At</dt><dd className="text-foreground">{formatDateTime(wo.completed_at)}</dd></div>
            </dl>
            {wo.completion_notes && (
              <p className="mt-4 text-sm text-text-secondary border-t border-border pt-4">
                <strong>Completion Notes:</strong> {wo.completion_notes}
              </p>
            )}
          </Card>
        </div>
      )}

      {/* Bidding Panel (Marketplace) */}
      {wo.is_public_board && (
        <Card className="mb-6 border-blue-200">
          <BiddingPanel workOrderId={wo.id} />
        </Card>
      )}

      {/* Crew Assignments */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Crew Assignments ({assignments.length})</h3>
        </div>
        {assignments.length === 0 ? (
          <div className="py-8 text-center text-sm text-text-secondary">No crew assigned to this work order.</div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Assigned</th>
                  {isEditable && <th className="px-6 py-3" />}
                  {showRatingPrompt && <th className="px-6 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-bg-secondary/50">
                    <td className="px-6 py-3 text-foreground">{a.crew_profiles?.full_name ?? '—'}</td>
                    <td className="px-6 py-3 text-text-secondary">{a.crew_profiles?.phone ?? '—'}</td>
                    <td className="px-6 py-3 text-text-secondary">{a.role ?? '—'}</td>
                    <td className="px-6 py-3">
                      <StatusBadge status={a.status} colorMap={STATUS_COLORS} />
                    </td>
                    <td className="px-6 py-3 text-text-muted text-xs">{new Date(a.assigned_at).toLocaleDateString()}</td>
                    {isEditable && (
                      <td className="px-6 py-3">
                        <button onClick={() => handleRemoveAssignment(a.id)} className="text-xs text-text-muted hover:text-red-600 transition-colors">
                          Remove
                        </button>
                      </td>
                    )}
                    {showRatingPrompt && (
                      <td className="px-6 py-3">
                        <button
                          onClick={() => { setRatingCrewId(a.crew_profiles?.id ?? null); setRatingScore(5); setRatingComment(''); }}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Rate
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Crew Rating Modal */}
      {ratingCrewId && (
        <Card className="mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Rate Crew Member</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Score</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setRatingScore(s)}
                    className={`h-8 w-8 rounded-lg text-sm font-semibold transition-colors ${
                      s <= ratingScore ? 'bg-yellow-400 text-white' : 'bg-bg-secondary text-text-muted'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Comment (optional)</label>
              <textarea
                rows={2}
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                className={inputClass + ' resize-none'}
                placeholder="How did they do?"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setRatingCrewId(null)}>Cancel</Button>
              <Button onClick={submitCrewRating} disabled={ratingLoading}>{ratingLoading ? 'Submitting...' : 'Submit Rating'}</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Checklist */}
      {checklist.length > 0 && (
        <Card className="mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Checklist ({checklist.filter((c) => c.done).length}/{checklist.length} complete)
          </h3>
          <ul className="space-y-2">
            {checklist.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <button
                  onClick={() => handleChecklistToggle(i)}
                  className={`h-5 w-5 rounded border flex items-center justify-center text-xs transition-colors ${
                    item.done
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-border hover:border-foreground/30'
                  }`}
                >
                  {item.done ? '✓' : ''}
                </button>
                <span className={item.done ? 'line-through text-text-muted' : 'text-foreground'}>{item.text}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Job Site Photos */}
      {photos.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-foreground mb-4">Job Site Photos ({photos.length})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((photo) => (
              <a key={photo.id} href={photo.file_url} target="_blank" rel="noopener noreferrer" className="group relative rounded-lg overflow-hidden border border-border">
                <img
                  src={photo.thumbnail_url ?? photo.file_url}
                  alt={photo.caption ?? 'Job site photo'}
                  className="w-full h-28 object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1">
                  <span className="text-[10px] font-medium text-white/90 uppercase">{photo.photo_type}</span>
                </div>
              </a>
            ))}
          </div>
        </Card>
      )}
    </TierGate>
  );
}
