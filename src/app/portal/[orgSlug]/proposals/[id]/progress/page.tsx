import type { PhaseStatus } from '@/types/database';
import { statusColor } from '@/lib/utils';

interface PageProps {
  params: Promise<{ orgSlug: string; id: string }>;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

interface PhaseProgress {
  id: string;
  number: string;
  name: string;
  subtitle: string;
  status: PhaseStatus;
  completionPercent: number;
  keyMilestones: string[];
}

const phases: PhaseProgress[] = [
  {
    id: 'phase-1',
    number: '1',
    name: 'Discovery',
    subtitle: 'Understanding the vision',
    status: 'complete',
    completionPercent: 100,
    keyMilestones: ['Stakeholder sessions completed', 'Site analysis delivered', 'Creative brief approved'],
  },
  {
    id: 'phase-2',
    number: '2',
    name: 'Design',
    subtitle: 'Shaping the experience',
    status: 'complete',
    completionPercent: 100,
    keyMilestones: ['3 concept directions presented', '3D design package approved', 'Graphic design package delivered'],
  },
  {
    id: 'phase-3',
    number: '3',
    name: 'Engineering',
    subtitle: 'Precision meets ambition',
    status: 'in_progress',
    completionPercent: 65,
    keyMilestones: ['Structural drawings PE-stamped', 'Production drawings in review', 'Electrical engineering pending'],
  },
  {
    id: 'phase-4',
    number: '4',
    name: 'Fabrication',
    subtitle: 'Bringing it to life',
    status: 'not_started',
    completionPercent: 0,
    keyMilestones: ['Primary structure fabrication', 'Interactive pods build', 'Environmental graphics production'],
  },
  {
    id: 'phase-5',
    number: '5',
    name: 'Technology',
    subtitle: 'Digital meets physical',
    status: 'not_started',
    completionPercent: 0,
    keyMilestones: ['Interactive experience dev', 'RFID integration', 'CMS build'],
  },
  {
    id: 'phase-6',
    number: '6',
    name: 'Logistics',
    subtitle: 'Orchestrating the move',
    status: 'not_started',
    completionPercent: 0,
    keyMilestones: ['Freight coordination', 'Staging and QC', 'Permitting complete'],
  },
  {
    id: 'phase-7',
    number: '7',
    name: 'Installation & Activation',
    subtitle: 'The moment arrives',
    status: 'not_started',
    completionPercent: 0,
    keyMilestones: ['Load-in and installation', 'Technology commissioning', 'Activation go-live'],
  },
  {
    id: 'phase-8',
    number: '8',
    name: 'Strike & Close',
    subtitle: 'Clean departure, lasting impact',
    status: 'not_started',
    completionPercent: 0,
    keyMilestones: ['Strike and de-install', 'Post-event report delivered'],
  },
];

// ---------------------------------------------------------------------------
// Component
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

export default async function ProgressPage({ params }: PageProps) {
  const { orgSlug, id } = await params;

  const currentPhaseIndex = phases.findIndex((p) => p.status === 'in_progress');

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Project Progress</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Visual timeline of project phases and completion status.
        </p>
      </div>

      {/* Overall progress */}
      <div className="rounded-lg border border-border bg-background p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Overall Completion</span>
          <span className="text-sm font-semibold text-foreground">
            {Math.round(phases.reduce((sum, p) => sum + p.completionPercent, 0) / phases.length)}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-[width,opacity]"
            style={{
              width: `${Math.round(phases.reduce((sum, p) => sum + p.completionPercent, 0) / phases.length)}%`,
              backgroundColor: 'var(--org-primary)',
            }}
          />
        </div>
      </div>

      {/* Vertical phase timeline */}
      <div className="relative">
        {phases.map((phase, index) => {
          const isLast = index === phases.length - 1;
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
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
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
                        <span className="text-xs font-medium text-text-muted">Phase {phase.number}</span>
                        {isCurrent && (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                            CURRENT
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-foreground mt-0.5">{phase.name}</h3>
                      <p className="text-xs text-text-muted">{phase.subtitle}</p>
                    </div>
                    <PhaseStatusLabel status={phase.status} />
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-text-muted">Completion</span>
                      <span className="text-[11px] font-medium text-text-secondary">{phase.completionPercent}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-[width,opacity] ${
                          phase.status === 'complete' ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${phase.completionPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Key milestones */}
                  <ul className="space-y-1">
                    {phase.keyMilestones.map((milestone, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-text-muted">
                        {phase.status === 'complete' ? (
                          <svg className="h-3 w-3 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-300 shrink-0" />
                        )}
                        {milestone}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
