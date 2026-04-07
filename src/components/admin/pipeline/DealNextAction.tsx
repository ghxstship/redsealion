'use client';

import { useMemo } from 'react';

interface DealNextActionProps {
  stage: string;
  daysSinceUpdate: number;
  daysInPipeline: number;
  probability: number;
  activityCount: number;
  hasContacts: boolean;
  wonDate: string | null;
}

interface NextAction {
  icon: string;
  label: string;
  priority: 'high' | 'medium' | 'low';
}

function computeNextActions(props: DealNextActionProps): NextAction[] {
  if (props.wonDate) return [];

  const actions: NextAction[] = [];

  // Stage-specific prompts
  switch (props.stage) {
    case 'lead':
      actions.push({
        icon: '📞',
        label: 'Qualify this lead — schedule a discovery call',
        priority: 'high',
      });
      if (!props.hasContacts) {
        actions.push({
          icon: '👤',
          label: 'Identify the decision-maker',
          priority: 'medium',
        });
      }
      break;
    case 'qualified':
      actions.push({
        icon: '📄',
        label: 'Prepare and send a proposal',
        priority: 'high',
      });
      break;
    case 'proposal_sent':
      if (props.daysSinceUpdate > 3) {
        actions.push({
          icon: '📧',
          label: 'Follow up on the proposal',
          priority: 'high',
        });
      } else {
        actions.push({
          icon: '⏳',
          label: 'Wait for client response, prepare for negotiation',
          priority: 'low',
        });
      }
      break;
    case 'negotiation':
      actions.push({
        icon: '🤝',
        label: 'Address objections and finalize terms',
        priority: 'high',
      });
      if (props.probability < 50) {
        actions.push({
          icon: '💡',
          label: 'Consider offering a concession or revised scope',
          priority: 'medium',
        });
      }
      break;
    case 'verbal_yes':
      actions.push({
        icon: '✍️',
        label: 'Send the contract for signature',
        priority: 'high',
      });
      break;
  }

  // Activity-based suggestions
  if (props.daysSinceUpdate > 14 && props.stage !== 'verbal_yes') {
    actions.unshift({
      icon: '🔥',
      label: 'Re-engage — this deal is going cold',
      priority: 'high',
    });
  }

  if (props.activityCount < 2 && props.daysInPipeline > 7) {
    actions.push({
      icon: '📝',
      label: 'Log activities to build an engagement trail',
      priority: 'medium',
    });
  }

  return actions.slice(0, 3); // Max 3 recommendations
}

const PRIORITY_STYLES: Record<string, string> = {
  high: 'border-l-amber-500 bg-amber-50/50',
  medium: 'border-l-blue-400 bg-blue-50/30',
  low: 'border-l-gray-300 bg-gray-50/30',
};

export default function DealNextAction(props: DealNextActionProps) {
  const actions = useMemo(() => computeNextActions(props), [props]);

  if (actions.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M2 12l4-4 3 3 5-5" />
          <path d="M10 6h4v4" />
        </svg>
        Next Best Actions
      </h3>
      <ul className="space-y-2">
        {actions.map((action, idx) => (
          <li
            key={idx}
            className={`rounded-lg border-l-2 px-3 py-2.5 text-xs text-text-secondary ${PRIORITY_STYLES[action.priority]}`}
          >
            <span className="mr-1.5">{action.icon}</span>
            {action.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
