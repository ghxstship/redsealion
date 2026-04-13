'use client';

import Button from '@/components/ui/Button';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ROADMAP_BAR_COLORS } from '@/components/ui/StatusBadge';
import FormSelect from '@/components/ui/FormSelect';

interface RoadmapItem {
  id: string;
  name: string;
  clientName: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  progress: number;
}

interface RoadmapClientProps {
  items: RoadmapItem[];
  months: string[];
  timeRangeStart: number;
  timeRangeEnd: number;
}

function statusColor(status: string): string {
  return ROADMAP_BAR_COLORS[status] ?? 'bg-purple-500';
}

const STATUSES = ['all', 'sent', 'approved', 'active', 'completed', 'cancelled'];

export default function RoadmapClient({ items, months, timeRangeStart, timeRangeEnd }: RoadmapClientProps) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');

  const clients = useMemo(() => {
    const names = [...new Set(items.map((i) => i.clientName).filter(Boolean) as string[])];
    return names.sort();
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (clientFilter !== 'all' && item.clientName !== clientFilter) return false;
      return true;
    });
  }, [items, statusFilter, clientFilter]);

  const totalMs = timeRangeEnd - timeRangeStart;

  function getBarStyle(item: RoadmapItem): React.CSSProperties {
    if (!item.startDate) return { width: '15%', minWidth: '60px', left: '0%' };

    const start = new Date(item.startDate).getTime();
    const end = item.endDate ? new Date(item.endDate).getTime() : start + 30 * 86400000;

    const leftPct = Math.max(0, ((start - timeRangeStart) / totalMs) * 100);
    const widthPct = Math.max(5, Math.min(100 - leftPct, ((end - start) / totalMs) * 100));

    return {
      position: 'absolute' as const,
      left: `${leftPct}%`,
      width: `${widthPct}%`,
      minWidth: '40px',
    };
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Status:</span>
          <div className="flex gap-1">
            {STATUSES.map((s) => (
              <Button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-foreground text-background'
                    : 'bg-bg-secondary text-text-secondary hover:bg-border'
                }`}
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {clients.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Client:</span>
            <FormSelect
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
            >
              <option value="all">All Clients</option>
              {clients.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </FormSelect>
          </div>
        )}

        <span className="text-xs text-text-muted self-center ml-auto">
          {filtered.length} of {items.length} projects
        </span>
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="grid grid-cols-[200px_1fr] border-b border-border">
          <div className="px-4 py-3 border-r border-border">
            <span className="text-xs font-medium uppercase tracking-wider text-text-muted">Project</span>
          </div>
          <div className="grid grid-cols-6">
            {months.map((m, idx) => (
              <div key={idx} className="px-2 py-3 text-center border-r border-border last:border-r-0">
                <span className="text-xs font-medium text-text-muted">{m}</span>
              </div>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-text-muted">
            No projects match the current filters.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[200px_1fr] border-b border-border last:border-b-0 hover:bg-bg-secondary/30 transition-colors"
            >
              <div className="px-4 py-3 border-r border-border">
                <Link
                  href={`/app/proposals/${item.id}`}
                  className="text-sm font-medium text-foreground hover:underline truncate block"
                >
                  {item.name}
                </Link>
                {item.clientName && (
                  <p className="text-[11px] text-text-muted truncate">{item.clientName}</p>
                )}
              </div>
              <div className="relative px-2 py-3">
                <div className="relative h-6 flex items-center">
                  <div
                    className={`h-5 rounded-full ${statusColor(item.status)} opacity-80 flex items-center px-2`}
                    style={getBarStyle(item)}
                  >
                    <span className="text-[10px] font-medium text-white truncate">
                      {item.progress}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
