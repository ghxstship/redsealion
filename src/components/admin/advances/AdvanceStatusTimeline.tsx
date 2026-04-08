'use client';

import { formatAdvanceDate } from '@/lib/advances/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import { ADVANCE_STATUS_COLORS } from './AdvanceStatusBadge';
import type { AdvanceStatusHistoryEntry } from '@/types/database';

interface AdvanceStatusTimelineProps {
  history: AdvanceStatusHistoryEntry[];
}

export default function AdvanceStatusTimeline({ history }: AdvanceStatusTimelineProps) {
  if (history.length === 0) return null;

  return (
    <div className="space-y-0">
      {history.map((entry, i) => (
        <div key={entry.id} className="relative flex gap-3 pb-4">
          {/* Vertical connector line */}
          {i < history.length - 1 && (
            <div className="absolute left-[7px] top-4 bottom-0 w-px bg-border" />
          )}
          {/* Dot */}
          <div className="relative z-10 mt-1 w-[15px] h-[15px] rounded-full border-2 border-border bg-background flex-shrink-0" />
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {entry.previous_status && (
                <>
                  <StatusBadge status={entry.previous_status} colorMap={ADVANCE_STATUS_COLORS} />
                  <span className="text-text-muted text-[10px]">→</span>
                </>
              )}
              <StatusBadge status={entry.new_status} colorMap={ADVANCE_STATUS_COLORS} />
            </div>
            <p className="mt-0.5 text-[11px] text-text-muted">
              {formatAdvanceDate(entry.created_at)}
              {entry.reason && <span className="ml-1">— {entry.reason}</span>}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
