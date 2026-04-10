'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import AllocationModal from '../AllocationModal';

interface ResourceStats {
  totalAllocations: number;
  teamMembers: number;
  avgUtilization: number;
}

interface AllocationRow {
  id: string;
  userName: string | null;
  proposalName: string | null;
  startDate: string;
  endDate: string;
  hoursPerDay: number;
  role: string | null;
}

interface Props {
  stats: ResourceStats;
  allocations: AllocationRow[];
}

export default function WorkloadsClient({ stats, allocations }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  const cards = [
    { label: 'Active Allocations', value: String(stats.totalAllocations), detail: 'Current assignments' },
    { label: 'Team Members', value: String(stats.teamMembers), detail: 'Available resources' },
    { label: 'Avg Utilization', value: `${stats.avgUtilization}%`, detail: 'This month' },
  ];

  return (
    <>
      {/* Stats + New Allocation button */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 flex-1">
          {cards.map((card) => (
            <div key={card.label} className="rounded-xl border border-border bg-background px-5 py-5">
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{card.value}</p>
              <p className="mt-1 text-xs text-text-secondary">{card.detail}</p>
            </div>
          ))}
        </div>
        <Button onClick={() => setModalOpen(true)} className="shrink-0 mt-1">
          New Allocation
        </Button>
      </div>

      {/* Allocations table */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {allocations.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">
              No resource allocations yet. Click &ldquo;New Allocation&rdquo; to assign team members to projects.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Team Member</th>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Hours/Day</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allocations.map((alloc) => (
                  <tr key={alloc.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 text-foreground font-medium">{alloc.userName ?? '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{alloc.proposalName ?? '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{alloc.role ?? '—'}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs">
                      {new Date(alloc.startDate).toLocaleDateString()} – {new Date(alloc.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-text-secondary">{alloc.hoursPerDay}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AllocationModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
