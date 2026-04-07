import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Minus } from 'lucide-react';
import { IconCheck } from '@/components/ui/Icons';
import EmptyState from '@/components/ui/EmptyState';
import type {
  MilestoneStatus,
  RequirementStatus,
  RequirementAssignee,
} from '@/types/database';
import { statusColor } from '@/lib/utils';

interface PageProps {
  params: Promise<{ orgSlug: string; id: string }>;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RequirementStatusIcon({ status }: { status: RequirementStatus }) {
  if (status === 'complete') {
      <IconCheck className="h-4 w-4 text-green-600 shrink-0" strokeWidth={2.5} />
  }
  if (status === 'in_progress') {
    return <span className="h-4 w-4 shrink-0 rounded-full border-2 border-blue-500 bg-blue-100" />;
  }
  if (status === 'waived') {
      <Minus className="h-4 w-4 text-gray-400 shrink-0" strokeWidth={2} />
  }
  return <span className="h-4 w-4 shrink-0 rounded-full border-2 border-gray-300" />;
}

function AssigneeBadge({ assignee }: { assignee: RequirementAssignee }) {
  const styles: Record<string, string> = {
    client: 'bg-purple-50 text-purple-700',
    producer: 'bg-blue-50 text-blue-700',
    both: 'bg-indigo-50 text-indigo-700',
    external_vendor: 'bg-orange-50 text-orange-700',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[assignee] ?? 'bg-gray-100 text-gray-600'}`}>
      {assignee === 'external_vendor' ? 'vendor' : assignee}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface MilestoneRow {
  id: string;
  name: string;
  status: MilestoneStatus;
  completed_at: string | null;
  unlocks_description: string | null;
  phase_id: string;
}

interface RequirementRow {
  id: string;
  milestone_id: string;
  text: string;
  status: RequirementStatus;
  assignee: RequirementAssignee;
  due_date: string | null;
  completed_at: string | null;
  completed_by: string | null;
  finance_trigger: unknown;
  evidence_required: boolean;
  sort_order: number;
}

export default async function MilestonesPage({ params }: PageProps) {
  const { orgSlug, id } = await params;

  const supabase = await createClient();

  // Verify proposal belongs to this org
  const { data: proposal } = await supabase
    .from('proposals')
    .select('id, organization_id')
    .eq('id', id)
    .single();

  if (!proposal) notFound();

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .single();

  if (!org || proposal.organization_id !== org.id) notFound();

  // Fetch phases
  const { data: phases } = await supabase
    .from('phases')
    .select('id, phase_number, name')
    .eq('proposal_id', id)
    .order('sort_order', { ascending: true });

  const phaseList = phases ?? [];
  const phaseIds = phaseList.map((p) => p.id);

  // Fetch milestones and requirements
  const [milestonesRes, requirementsRes] = await Promise.all([
    phaseIds.length > 0
      ? supabase.from('milestone_gates').select('*').in('phase_id', phaseIds)
      : { data: [] },
    phaseIds.length > 0
      ? supabase.from('milestone_requirements').select('*').order('sort_order', { ascending: true })
      : { data: [] },
  ]);

  const milestones = (milestonesRes.data ?? []) as MilestoneRow[];
  const allRequirements = (requirementsRes.data ?? []) as RequirementRow[];

  // Filter requirements to those belonging to our milestones
  const milestoneIds = new Set(milestones.map((m) => m.id));
  const requirements = allRequirements.filter((r) => milestoneIds.has(r.milestone_id));

  // Build grouped data: phase → milestone → requirements
  const milestoneByPhase = new Map<string, MilestoneRow>();
  for (const m of milestones) {
    milestoneByPhase.set(m.phase_id, m);
  }

  const reqsByMilestone = new Map<string, RequirementRow[]>();
  for (const r of requirements) {
    const arr = reqsByMilestone.get(r.milestone_id) ?? [];
    arr.push(r);
    reqsByMilestone.set(r.milestone_id, arr);
  }

  const phaseMilestones = phaseList
    .filter((p) => milestoneByPhase.has(p.id))
    .map((p) => {
      const milestone = milestoneByPhase.get(p.id)!;
      return {
        phaseNumber: p.phase_number,
        phaseName: p.name,
        milestone,
        requirements: reqsByMilestone.get(milestone.id) ?? [],
      };
    });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Milestone Tracker</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Track approval gates across every phase of the project.
        </p>
      </div>

      {phaseMilestones.length === 0 && (
        <EmptyState
          message="No milestones defined yet"
          description="Milestone gates will appear here once your project phases are configured."
        />
      )}

      {/* Timeline */}
      <div className="relative space-y-0">
        {phaseMilestones.map((pm, index) => {
          const isLast = index === phaseMilestones.length - 1;
          const isCurrent = pm.milestone.status === 'in_progress';

          return (
            <div key={pm.milestone.id} className="relative flex gap-6">
              {/* Timeline line + dot */}
              <div className="flex flex-col items-center">
                <div
                  className={`h-4 w-4 rounded-full border-2 shrink-0 mt-1 ${
                    pm.milestone.status === 'complete'
                      ? 'bg-green-500 border-green-500'
                      : isCurrent
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-white border-gray-300'
                  }`}
                />
                {!isLast && (
                  <div className="w-0.5 flex-1 bg-border min-h-8" />
                )}
              </div>

              {/* Content */}
              <div className={`pb-8 flex-1 ${isLast ? 'pb-0' : ''}`}>
                <div className={`rounded-lg border p-5 ${isCurrent ? 'border-blue-200 bg-blue-50/30' : 'border-border bg-background'}`}>
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                        Phase {pm.phaseNumber} &middot; {pm.phaseName}
                      </span>
                      <h3 className="text-sm font-semibold text-foreground mt-0.5">
                        {pm.milestone.name}
                      </h3>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusColor(pm.milestone.status)}`}>
                      {pm.milestone.status.replace('_', ' ')}
                    </span>
                  </div>

                  {pm.milestone.unlocks_description && (
                    <p className="text-xs text-text-muted mb-4">
                      Unlocks: {pm.milestone.unlocks_description}
                    </p>
                  )}

                  {/* Requirements */}
                  <div className="space-y-2.5">
                    {pm.requirements.map((req) => (
                      <div key={req.id} className="flex items-start gap-3">
                        <RequirementStatusIcon status={req.status} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${req.status === 'complete' ? 'text-text-muted line-through' : req.status === 'waived' ? 'text-text-muted italic' : 'text-foreground'}`}>
                              {req.text}
                            </span>
                            <AssigneeBadge assignee={req.assignee} />
                          </div>
                          {req.due_date && req.status !== 'complete' && (
                            <p className="text-[11px] text-text-muted mt-0.5">
                              Due: {new Date(req.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                        {req.assignee === 'client' && req.status === 'pending' && (
                          <button
                            type="button"
                            className="shrink-0 rounded-md px-3 py-1 text-xs font-medium text-white transition-colors"
                            style={{ backgroundColor: 'var(--org-primary)' }}
                          >
                            Approve
                          </button>
                        )}
                        {req.assignee === 'client' && req.status === 'in_progress' && (
                          <button
                            type="button"
                            className="shrink-0 rounded-md px-3 py-1 text-xs font-medium text-white transition-colors"
                            style={{ backgroundColor: 'var(--org-primary)' }}
                          >
                            Mark Complete
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
