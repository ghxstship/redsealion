'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { resolveClientOrg } from '@/lib/auth/resolve-org-client';
interface UtilizationHeatMapProps {
  teamMembers: Array<{ id: string; name: string; role: string }>;
}

interface Allocation {
  id: string;
  user_id: string;
  proposal_id: string | null;
  start_date: string;
  end_date: string;
  hours_per_day: number;
  role: string | null;
  proposal_name?: string;
}

interface WeekRange {
  label: string;
  start: Date;
  end: Date;
}

function getWeekRanges(): WeekRange[] {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
  startOfWeek.setHours(0, 0, 0, 0);

  const weeks: WeekRange[] = [];
  for (let i = 0; i < 4; i++) {
    const start = new Date(startOfWeek);
    start.setDate(start.getDate() + i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 4); // Friday
    weeks.push({
      label: `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      start,
      end,
    });
  }
  return weeks;
}

function getUtilPercent(
  userId: string,
  week: WeekRange,
  allocations: Allocation[],
): number {
  const userAllocs = allocations.filter((a) => a.user_id === userId);
  let totalHours = 0;

  for (const alloc of userAllocs) {
    const allocStart = new Date(alloc.start_date + 'T00:00:00');
    const allocEnd = new Date(alloc.end_date + 'T00:00:00');

    // Count overlapping weekdays
    const overlapStart = new Date(Math.max(allocStart.getTime(), week.start.getTime()));
    const overlapEnd = new Date(Math.min(allocEnd.getTime(), week.end.getTime()));

    if (overlapStart > overlapEnd) continue;

    let dayCount = 0;
    const d = new Date(overlapStart);
    while (d <= overlapEnd) {
      const dow = d.getDay();
      if (dow >= 1 && dow <= 5) dayCount++;
      d.setDate(d.getDate() + 1);
    }

    totalHours += dayCount * alloc.hours_per_day;
  }

  const maxWeeklyHours = 40; // 8h × 5 days
  return Math.round((totalHours / maxWeeklyHours) * 100);
}

function getUtilColor(percent: number): string {
  if (percent === 0) return 'bg-gray-100';
  if (percent <= 25) return 'bg-green-100';
  if (percent <= 50) return 'bg-green-200';
  if (percent <= 75) return 'bg-green-400';
  if (percent <= 100) return 'bg-green-600';
  return 'bg-red-500';
}

import AllocationForm from './AllocationForm';


export default function UtilizationHeatMap({ teamMembers }: UtilizationHeatMapProps) {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const weeks = getWeekRanges();

  const loadAllocations = useCallback(async () => {
    try {
      const supabase = createClient();
      const ctx = await resolveClientOrg();
      if (!ctx) return;

      // Fetch allocations for the next 4 weeks
      const startStr = weeks[0].start.toISOString().split('T')[0];
      const endStr = weeks[3].end.toISOString().split('T')[0];

      const { data: rows } = await supabase
        .from('resource_allocations')
        .select('*, proposals(name)')
        .eq('organization_id', ctx.organizationId)
        .gte('end_date', startStr)
        .lte('start_date', endStr);

      setAllocations(
        (rows ?? []).map((r: Record<string, unknown>) => ({
          id: r.id as string,
          user_id: r.user_id as string,
          proposal_id: r.proposal_id as string | null,
          start_date: r.start_date as string,
          end_date: r.end_date as string,
          hours_per_day: Number(r.hours_per_day),
          role: r.role as string | null,
          proposal_name: (r.proposals as Record<string, string> | null)?.name,
        })),
      );
    } catch {
      // Leave empty
    } finally {
      setLoading(false);
    }
  }, [weeks]);

  useEffect(() => {
    loadAllocations();
  }, [loadAllocations]);

  // Build data from real allocations (or show empty state)
  const data = teamMembers.map((m) => ({
    name: m.name,
    role: m.role,
    weeks: weeks.map((w) => getUtilPercent(m.id, w, allocations)),
  }));

  return (
    <div className="space-y-4">
      <AllocationForm
        teamMembers={teamMembers}
        onCreated={() => loadAllocations()}
      />

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Utilization Heat Map</h2>
          <p className="text-xs text-text-secondary mt-1">
            Weekly utilization percentage based on resource allocations
          </p>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-text-muted">
            Loading allocations…
          </div>
        ) : data.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-text-muted">No team members found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-secondary">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                    Team Member
                  </th>
                  {weeks.map((w) => (
                    <th
                      key={w.label}
                      className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-text-muted w-32"
                    >
                      {w.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((member) => (
                  <tr key={member.name} className="transition-colors hover:bg-bg-secondary/50">
                    <td className="px-6 py-3">
                      <p className="text-sm font-medium text-foreground">{member.name}</p>
                      <p className="text-xs text-text-muted">{member.role}</p>
                    </td>
                    {member.weeks.map((util, idx) => (
                      <td key={idx} className="px-4 py-3 text-center">
                        <div
                          className={`mx-auto flex h-10 w-16 items-center justify-center rounded-lg ${getUtilColor(util)}`}
                        >
                          <span className={`text-xs font-medium ${util > 75 ? 'text-white' : 'text-foreground'}`}>
                            {util}%
                          </span>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        <div className="border-t border-border px-6 py-3 flex items-center gap-4">
          <span className="text-xs text-text-muted">Utilization:</span>
          {[
            { label: '0%', color: 'bg-gray-100' },
            { label: '25%', color: 'bg-green-100' },
            { label: '50%', color: 'bg-green-200' },
            { label: '75%', color: 'bg-green-400' },
            { label: '100%', color: 'bg-green-600' },
            { label: '>100%', color: 'bg-red-500' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`h-3 w-3 rounded ${item.color}`} />
              <span className="text-xs text-text-secondary">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
