'use client';

import { Heart } from 'lucide-react';

import { useMemo } from 'react';
import {
  computeClientHealth,
  healthBarColor,
  HEALTH_TIER_STYLES,
  type ClientHealthResult,
} from '@/lib/clients/client-health';

interface ClientHealthCardProps {
  recentInteractions: number;
  lastInteractionDate: string | null;
  activeDeals: number;
  wonDeals: number;
  lostDeals: number;
  totalRevenue: number;
  contactCount: number;
  hasDecisionMaker: boolean;
  proposalCount: number;
  activeProposals: number;
}

export default function ClientHealthCard(props: ClientHealthCardProps) {
  const health: ClientHealthResult = useMemo(() => computeClientHealth(props), [props]);

  const style = HEALTH_TIER_STYLES[health.tier];

  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Heart size={14} />
          Client Health
        </h3>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${style.bg} ${style.text}`}>
          {style.label}
        </span>
      </div>

      {/* Score bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-text-muted mb-1">
          <span>Health Score</span>
          <span className="tabular-nums font-medium">{health.score}/100</span>
        </div>
        <div className="h-2 rounded-full bg-bg-secondary overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${healthBarColor(health.score)}`}
            style={{ width: `${health.score}%` }}
          />
        </div>
      </div>

      {/* Signals */}
      <ul className="space-y-1.5">
        {health.signals.map((signal) => (
          <li key={signal.label} className="flex items-center gap-2 text-xs">
            <span
              className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                signal.impact === 'positive'
                  ? 'bg-green-500'
                  : signal.impact === 'negative'
                    ? 'bg-red-500'
                    : 'bg-gray-400'
              }`}
            />
            <span className="text-text-secondary">{signal.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
