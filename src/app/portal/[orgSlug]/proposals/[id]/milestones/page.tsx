import type {
  MilestoneGate,
  MilestoneRequirement,
  MilestoneStatus,
  RequirementStatus,
  RequirementAssignee,
} from '@/types/database';
import { statusColor } from '@/lib/utils';

interface PageProps {
  params: Promise<{ orgSlug: string; id: string }>;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const ts = '2026-01-15T00:00:00Z';

interface PhaseMilestone {
  phaseNumber: string;
  phaseName: string;
  milestone: MilestoneGate & { requirements: MilestoneRequirement[] };
}

const phaseMilestones: PhaseMilestone[] = [
  {
    phaseNumber: '1',
    phaseName: 'Discovery',
    milestone: {
      id: 'ms-1',
      phase_id: 'phase-1',
      name: 'Discovery Approval',
      unlocks_description: 'Proceeds to Design phase; triggers 25% deposit invoice.',
      status: 'complete' as MilestoneStatus,
      completed_at: '2026-02-10T00:00:00Z',
      created_at: ts,
      updated_at: ts,
      requirements: [
        { id: 'r-1-1', milestone_id: 'ms-1', text: 'Creative brief delivered and presented', status: 'complete' as RequirementStatus, assignee: 'producer' as RequirementAssignee, due_offset: null, due_date: null, completed_at: '2026-02-08T00:00:00Z', completed_by: 'user-1', finance_trigger: null, evidence_required: false, sort_order: 0, created_at: ts, updated_at: ts },
        { id: 'r-1-2', milestone_id: 'ms-1', text: 'Site analysis report reviewed', status: 'complete' as RequirementStatus, assignee: 'client' as RequirementAssignee, due_offset: null, due_date: null, completed_at: '2026-02-09T00:00:00Z', completed_by: 'user-2', finance_trigger: null, evidence_required: false, sort_order: 1, created_at: ts, updated_at: ts },
        { id: 'r-1-3', milestone_id: 'ms-1', text: 'Creative brief approved', status: 'complete' as RequirementStatus, assignee: 'client' as RequirementAssignee, due_offset: null, due_date: null, completed_at: '2026-02-10T00:00:00Z', completed_by: 'user-2', finance_trigger: { triggersInvoice: true, invoiceType: 'deposit', percent: 25 }, evidence_required: true, sort_order: 2, created_at: ts, updated_at: ts },
      ],
    },
  },
  {
    phaseNumber: '2',
    phaseName: 'Design',
    milestone: {
      id: 'ms-2',
      phase_id: 'phase-2',
      name: 'Design Approval',
      unlocks_description: 'Proceeds to Engineering; locks design scope for production.',
      status: 'complete' as MilestoneStatus,
      completed_at: '2026-03-05T00:00:00Z',
      created_at: ts,
      updated_at: ts,
      requirements: [
        { id: 'r-2-1', milestone_id: 'ms-2', text: '3D design package delivered', status: 'complete' as RequirementStatus, assignee: 'producer' as RequirementAssignee, due_offset: null, due_date: null, completed_at: '2026-02-28T00:00:00Z', completed_by: 'user-1', finance_trigger: null, evidence_required: false, sort_order: 0, created_at: ts, updated_at: ts },
        { id: 'r-2-2', milestone_id: 'ms-2', text: 'Client review period (5 business days)', status: 'complete' as RequirementStatus, assignee: 'client' as RequirementAssignee, due_offset: null, due_date: '2026-03-05T00:00:00Z', completed_at: '2026-03-04T00:00:00Z', completed_by: 'user-2', finance_trigger: null, evidence_required: false, sort_order: 1, created_at: ts, updated_at: ts },
        { id: 'r-2-3', milestone_id: 'ms-2', text: 'Design direction approved with sign-off', status: 'complete' as RequirementStatus, assignee: 'client' as RequirementAssignee, due_offset: null, due_date: null, completed_at: '2026-03-05T00:00:00Z', completed_by: 'user-2', finance_trigger: null, evidence_required: true, sort_order: 2, created_at: ts, updated_at: ts },
        { id: 'r-2-4', milestone_id: 'ms-2', text: 'Revision round completed (if applicable)', status: 'waived' as RequirementStatus, assignee: 'both' as RequirementAssignee, due_offset: null, due_date: null, completed_at: null, completed_by: null, finance_trigger: null, evidence_required: false, sort_order: 3, created_at: ts, updated_at: ts },
      ],
    },
  },
  {
    phaseNumber: '3',
    phaseName: 'Engineering',
    milestone: {
      id: 'ms-3',
      phase_id: 'phase-3',
      name: 'Engineering Sign-Off',
      unlocks_description: 'Proceeds to Fabrication; triggers material procurement.',
      status: 'in_progress' as MilestoneStatus,
      completed_at: null,
      created_at: ts,
      updated_at: ts,
      requirements: [
        { id: 'r-3-1', milestone_id: 'ms-3', text: 'PE-stamped structural drawings delivered', status: 'complete' as RequirementStatus, assignee: 'producer' as RequirementAssignee, due_offset: null, due_date: null, completed_at: '2026-03-20T00:00:00Z', completed_by: 'user-1', finance_trigger: null, evidence_required: true, sort_order: 0, created_at: ts, updated_at: ts },
        { id: 'r-3-2', milestone_id: 'ms-3', text: 'Production drawings reviewed by client', status: 'in_progress' as RequirementStatus, assignee: 'client' as RequirementAssignee, due_offset: null, due_date: '2026-04-04T00:00:00Z', completed_at: null, completed_by: null, finance_trigger: null, evidence_required: false, sort_order: 1, created_at: ts, updated_at: ts },
        { id: 'r-3-3', milestone_id: 'ms-3', text: 'Engineering package approved', status: 'pending' as RequirementStatus, assignee: 'client' as RequirementAssignee, due_offset: null, due_date: null, completed_at: null, completed_by: null, finance_trigger: { triggersInvoice: true, invoiceType: 'deposit', percent: 25 }, evidence_required: true, sort_order: 2, created_at: ts, updated_at: ts },
      ],
    },
  },
  {
    phaseNumber: '4',
    phaseName: 'Fabrication',
    milestone: {
      id: 'ms-4',
      phase_id: 'phase-4',
      name: 'Fabrication Complete',
      unlocks_description: 'Proceeds to Logistics; all elements ready for transport.',
      status: 'pending' as MilestoneStatus,
      completed_at: null,
      created_at: ts,
      updated_at: ts,
      requirements: [
        { id: 'r-4-1', milestone_id: 'ms-4', text: 'All elements fabricated and QC passed', status: 'pending' as RequirementStatus, assignee: 'producer' as RequirementAssignee, due_offset: null, due_date: null, completed_at: null, completed_by: null, finance_trigger: null, evidence_required: true, sort_order: 0, created_at: ts, updated_at: ts },
        { id: 'r-4-2', milestone_id: 'ms-4', text: 'Client factory visit or video walkthrough', status: 'pending' as RequirementStatus, assignee: 'both' as RequirementAssignee, due_offset: null, due_date: null, completed_at: null, completed_by: null, finance_trigger: null, evidence_required: false, sort_order: 1, created_at: ts, updated_at: ts },
        { id: 'r-4-3', milestone_id: 'ms-4', text: 'Fabrication quality approved', status: 'pending' as RequirementStatus, assignee: 'client' as RequirementAssignee, due_offset: null, due_date: null, completed_at: null, completed_by: null, finance_trigger: null, evidence_required: false, sort_order: 2, created_at: ts, updated_at: ts },
      ],
    },
  },
  {
    phaseNumber: '7',
    phaseName: 'Installation & Activation',
    milestone: {
      id: 'ms-7',
      phase_id: 'phase-7',
      name: 'Activation Go-Live',
      unlocks_description: 'Experience opens to public; triggers balance invoice.',
      status: 'pending' as MilestoneStatus,
      completed_at: null,
      created_at: ts,
      updated_at: ts,
      requirements: [
        { id: 'r-7-1', milestone_id: 'ms-7', text: 'Installation complete and inspected', status: 'pending' as RequirementStatus, assignee: 'producer' as RequirementAssignee, due_offset: null, due_date: null, completed_at: null, completed_by: null, finance_trigger: null, evidence_required: true, sort_order: 0, created_at: ts, updated_at: ts },
        { id: 'r-7-2', milestone_id: 'ms-7', text: 'Technology systems tested and calibrated', status: 'pending' as RequirementStatus, assignee: 'producer' as RequirementAssignee, due_offset: null, due_date: null, completed_at: null, completed_by: null, finance_trigger: null, evidence_required: false, sort_order: 1, created_at: ts, updated_at: ts },
        { id: 'r-7-3', milestone_id: 'ms-7', text: 'Client walkthrough completed', status: 'pending' as RequirementStatus, assignee: 'both' as RequirementAssignee, due_offset: null, due_date: null, completed_at: null, completed_by: null, finance_trigger: null, evidence_required: false, sort_order: 2, created_at: ts, updated_at: ts },
        { id: 'r-7-4', milestone_id: 'ms-7', text: 'Go-live approved', status: 'pending' as RequirementStatus, assignee: 'client' as RequirementAssignee, due_offset: null, due_date: null, completed_at: null, completed_by: null, finance_trigger: { triggersInvoice: true, invoiceType: 'balance', percent: 50 }, evidence_required: true, sort_order: 3, created_at: ts, updated_at: ts },
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function RequirementStatusIcon({ status }: { status: RequirementStatus }) {
  if (status === 'complete') {
    return (
      <svg className="h-4 w-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (status === 'in_progress') {
    return <span className="h-4 w-4 shrink-0 rounded-full border-2 border-blue-500 bg-blue-100" />;
  }
  if (status === 'waived') {
    return (
      <svg className="h-4 w-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
      </svg>
    );
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

export default async function MilestonesPage({ params }: PageProps) {
  const { orgSlug, id } = await params;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Milestone Tracker</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Track approval gates across every phase of the project.
        </p>
      </div>

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
                    {pm.milestone.requirements.map((req) => (
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
