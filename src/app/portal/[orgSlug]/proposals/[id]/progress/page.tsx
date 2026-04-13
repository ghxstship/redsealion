import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { PhaseStatus } from '@/types/database';
import { statusColor } from '@/lib/utils';
import { IconCheck } from '@/components/ui/Icons';
import EmptyState from '@/components/ui/EmptyState';

interface PageProps {
  params: Promise<{ orgSlug: string; id: string }>;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PhaseStatusLabel({ status }: { status: PhaseStatus }) {
  const labels: Record<PhaseStatus, string> = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    pending_approval: 'Pending Approval',
    approved: 'Approved',
    complete: 'Complete',
    skipped: 'Skipped',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusColor(status)}`}>
      {labels[status]}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ProgressPage({ params }: PageProps) {
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
  const { data: phasesRaw } = await supabase
    .from('phases')
    .select('id, phase_number, name, subtitle, status')
    .eq('proposal_id', id)
    .order('sort_order', { ascending: true });

  const phases = (phasesRaw ?? []) as Array<{
    id: string;
    phase_number: string;
    name: string;
    subtitle: string | null;
    status: PhaseStatus;
  }>;

  // Fetch milestone gates to determine completion percentage per phase
  const phaseIds = phases.map((p) => p.id);
  const { data: milestones } = phaseIds.length > 0
    ? await supabase
        .from('milestone_gates')
        .select('phase_id, status')
        .in('phase_id', phaseIds)
    : { data: [] };

  const { data: requirements } = phaseIds.length > 0
    ? await supabase
        .from('milestone_requirements')
        .select('milestone_id, status')
    : { data: [] };

  // Calculate completion per phase from milestone requirements
  const milestoneByPhase = new Map<string, string>();
  for (const m of milestones ?? []) {
    milestoneByPhase.set(m.phase_id, m.status);
  }

  // Group requirements by phase (via milestone)
  const milestoneToPhase = new Map<string, string>();
  for (const m of milestones ?? []) {
    milestoneToPhase.set(m.phase_id, m.phase_id); // milestone.phase_id
  }

  // Build milestone_id → phase_id mapping
  const msIdToPhaseId = new Map<string, string>();
  if (phaseIds.length > 0) {
    const { data: msData } = await supabase
      .from('milestone_gates')
      .select('id, phase_id')
      .in('phase_id', phaseIds);
    for (const ms of msData ?? []) {
      msIdToPhaseId.set(ms.id, ms.phase_id);
    }
  }

  const reqsByPhase = new Map<string, { total: number; complete: number }>();
  for (const r of requirements ?? []) {
    const phaseId = msIdToPhaseId.get(r.milestone_id);
    if (!phaseId) continue;
    const entry = reqsByPhase.get(phaseId) ?? { total: 0, complete: 0 };
    entry.total++;
    if (r.status === 'complete' || r.status === 'waived') entry.complete++;
    reqsByPhase.set(phaseId, entry);
  }

  // Build enriched phase data
  const phaseData = phases.map((phase) => {
    const reqs = reqsByPhase.get(phase.id);
    let completionPercent = 0;
    if (phase.status === 'complete') {
      completionPercent = 100;
    } else if (reqs && reqs.total > 0) {
      completionPercent = Math.round((reqs.complete / reqs.total) * 100);
    }
    return { ...phase, completionPercent };
  });

  const currentPhaseIndex = phaseData.findIndex((p) => p.status === 'in_progress');
  const overallCompletion = phaseData.length > 0
    ? Math.round(phaseData.reduce((sum, p) => sum + p.completionPercent, 0) / phaseData.length)
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Project Progress</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Visual timeline of project phases and completion status.
        </p>
      </div>

      {phaseData.length === 0 && (
        <EmptyState
          message="No phases defined yet"
          description="Project progress will appear here once phases are configured."
        />
      )}

      {phaseData.length > 0 && (
        <>
          {/* Overall progress */}
          <div className="rounded-lg border border-border bg-background p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Overall Completion</span>
              <span className="text-sm font-semibold text-foreground">
                {overallCompletion}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full transition-[width,opacity]"
                style={{
                  width: `${overallCompletion}%`,
                  backgroundColor: 'var(--org-primary)',
                }}
              />
            </div>
          </div>

          {/* Vertical phase timeline */}
          <div className="relative">
            {phaseData.map((phase, index) => {
              const isLast = index === phaseData.length - 1;
              const isCurrent = index === currentPhaseIndex;

              return (
                <div key={phase.id} className="relative flex gap-6">
                  {/* Timeline connector */}
                  <div className="flex flex-col items-center">
                    {/* Dot */}
                    <div
                      className={`h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                        phase.status === 'complete'
                          ? 'bg-green-500 border-green-500'
                          : isCurrent
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300 bg-white'
                      }`}
                    >
                      {phase.status === 'complete' && (
                        <IconCheck className="h-3 w-3 text-white" strokeWidth={3} />
                      )}
                      {isCurrent && (
                        <span className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </div>
                    {/* Line */}
                    {!isLast && (
                      <div
                        className={`w-0.5 flex-1 min-h-4 ${
                          phase.status === 'complete' ? 'bg-green-300' : 'bg-border'
                        }`}
                      />
                    )}
                  </div>

                  {/* Phase content */}
                  <div className={`pb-6 flex-1 ${isLast ? 'pb-0' : ''}`}>
                    <div
                      className={`rounded-lg border p-5 transition-[color,background-color,border-color,opacity,box-shadow] ${
                        isCurrent
                          ? 'border-blue-200 bg-blue-50/30 ring-1 ring-blue-100'
                          : 'border-border bg-background'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-text-muted">Phase {phase.phase_number}</span>
                            {isCurrent && (
                              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                                CURRENT
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-semibold text-foreground mt-0.5">{phase.name}</h3>
                          {phase.subtitle && (
                            <p className="text-xs text-text-muted">{phase.subtitle}</p>
                          )}
                        </div>
                        <PhaseStatusLabel status={phase.status} />
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] text-text-muted">Completion</span>
                          <span className="text-[11px] font-medium text-text-secondary">{phase.completionPercent}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-bg-secondary overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-[width,opacity] ${
                              phase.status === 'complete' ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${phase.completionPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
