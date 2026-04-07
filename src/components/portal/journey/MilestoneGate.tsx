'use client';

import type {
  MilestoneGate,
  MilestoneRequirement,
  RequirementAssignee,
} from '@/types/database';
import { CheckCircle } from 'lucide-react';
import { IconCheck } from '@/components/ui/Icons';

interface MilestoneGateProps {
  milestone: MilestoneGate;
  requirements: MilestoneRequirement[];
  onApprove?: (milestoneId: string, requirementId: string) => void;
}

const assigneeBadge: Record<RequirementAssignee, { label: string; className: string }> = {
  client: { label: 'Client', className: 'bg-blue-50 text-blue-700' },
  producer: { label: 'Producer', className: 'bg-purple-50 text-purple-700' },
  both: { label: 'Both', className: 'bg-amber-50 text-amber-700' },
  external_vendor: { label: 'Vendor', className: 'bg-gray-100 text-gray-600' },
};

export default function MilestoneGateComponent({
  milestone,
  requirements,
  onApprove,
}: MilestoneGateProps) {
  const producerItems = requirements.filter(
    (r) => r.assignee === 'producer' || r.assignee === 'external_vendor'
  );
  const producerComplete = producerItems.every((r) => r.status === 'complete');

  return (
    <div className="rounded-xl border-2 border-milestone/30 bg-milestone-bg/50 p-6 lg:p-8">
      {/* Gate header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-8 rounded-full bg-milestone/10 flex items-center justify-center">
          <CheckCircle className="h-4 w-4 text-milestone" strokeWidth={2} />
        </div>
        <div>
          <h4 className="text-base font-semibold text-milestone">
            {milestone.name}
          </h4>
          <p className="text-xs text-text-muted">Milestone Gate</p>
        </div>
      </div>

      {/* Requirements */}
      <div className="space-y-3 mb-6">
        {requirements
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((req) => {
            const isComplete = req.status === 'complete';
            const badge = assigneeBadge[req.assignee];
            const isClientAction =
              req.assignee === 'client' || req.assignee === 'both';
            const canApprove =
              isClientAction && !isComplete && producerComplete;

            return (
              <div
                key={req.id}
                className="flex items-start gap-3 py-2"
              >
                {/* Check / circle */}
                <div className="mt-0.5 shrink-0">
                  {isComplete ? (
                    <div className="h-5 w-5 rounded-full bg-milestone flex items-center justify-center">
                      <IconCheck className="h-3 w-3 text-white" strokeWidth={2} />
                    </div>
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-milestone/30" />
                  )}
                </div>

                {/* Text + badge */}
                <div className="flex-1 min-w-0">
                  <p
                    className={[
                      'text-sm',
                      isComplete
                        ? 'text-text-muted line-through'
                        : 'text-foreground',
                    ].join(' ')}
                  >
                    {req.text}
                  </p>
                </div>

                {/* Assignee badge */}
                <span
                  className={[
                    'shrink-0 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full',
                    badge.className,
                  ].join(' ')}
                >
                  {badge.label}
                </span>

                {/* Approve button */}
                {canApprove && onApprove && (
                  <button
                    type="button"
                    onClick={() => onApprove(milestone.id, req.id)}
                    className="shrink-0 text-xs font-medium text-milestone hover:text-milestone/80 underline underline-offset-2 transition-colors"
                  >
                    Approve
                  </button>
                )}
              </div>
            );
          })}
      </div>

      {/* Unlocks description */}
      {milestone.unlocks_description && (
        <div className="pt-4 border-t border-milestone/20">
          <p className="text-xs text-text-muted">
            <span className="font-semibold text-milestone">Unlocks:</span>{' '}
            {milestone.unlocks_description}
          </p>
        </div>
      )}
    </div>
  );
}
