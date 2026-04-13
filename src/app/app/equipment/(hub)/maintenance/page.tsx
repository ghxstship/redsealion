import { formatLabel } from '@/lib/utils';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PageHeader from '@/components/shared/PageHeader';
import EquipmentHubTabs from '../../EquipmentHubTabs';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';

interface MaintenanceEntry {
  id: string;
  equipment_name: string;
  type: string;
  status: string;
  description: string;
  scheduled_date: string;
  completed_date: string | null;
  performed_by: string | null;
}



const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-yellow-50 text-yellow-700',
  completed: 'bg-green-50 text-green-700',
  overdue: 'bg-red-500/10 text-red-700',
};

const TYPE_COLORS: Record<string, string> = {
  Preventive: 'bg-blue-50 text-blue-700',
  Repair: 'bg-orange-50 text-orange-700',
  Inspection: 'bg-purple-50 text-purple-700',
};

async function getMaintenance(): Promise<MaintenanceEntry[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('No auth');
const { data: records } = await supabase
      .from('maintenance_records')
      .select('*, assets:asset_id(name)')
      .eq('organization_id', ctx.organizationId)
      .order('scheduled_date', { ascending: false });

    if (!records) throw new Error('No records');

    return records.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      equipment_name: (r.equipment as Record<string, string>)?.name ?? 'Unknown',
      type: r.type as string,
      status: r.status as string,
      description: r.description as string,
      scheduled_date: r.scheduled_date as string,
      completed_date: (r.completed_date as string) ?? null,
      performed_by: (r.performed_by as string) ?? null,
    }));
  } catch {
    return [];
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}


export default async function MaintenancePage() {
  const maintenance = await getMaintenance();

  const upcoming = maintenance.filter((m) => m.status !== 'completed');
  const completed = maintenance.filter((m) => m.status === 'completed');

  return (
    <>
      {/* Header */}
      <PageHeader
        title="Maintenance"
        subtitle={`${upcoming.length} upcoming · ${completed.length} completed`}
      />

      <EquipmentHubTabs />

      <div className="space-y-8">
        {/* Upcoming / In Progress */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-4">Upcoming &amp; In Progress</h2>
          {upcoming.length > 0 ? (
            <div className="rounded-xl border border-border bg-background overflow-hidden overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Equipment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Scheduled</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {upcoming.map((entry) => (
                    <tr key={entry.id} className="transition-colors hover:bg-bg-secondary/50">
                      <td className="px-6 py-3.5 text-sm font-medium text-foreground">{entry.equipment_name}</td>
                      <td className="px-6 py-3.5">
                        <StatusBadge status={entry.type} colorMap={TYPE_COLORS} />
                      </td>
                      <td className="px-6 py-3.5 text-sm text-text-secondary max-w-xs truncate">{entry.description}</td>
                      <td className="px-6 py-3.5 text-sm text-text-secondary">{formatDate(entry.scheduled_date)}</td>
                      <td className="px-6 py-3.5">
                        <StatusBadge status={entry.status} colorMap={STATUS_COLORS} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-background px-6 py-12 text-center text-sm text-text-muted">
              No upcoming maintenance scheduled.
            </div>
          )}
        </div>

        {/* Completed */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-4">Recently Completed</h2>
          {completed.length > 0 ? (
            <div className="rounded-xl border border-border bg-background overflow-hidden overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Equipment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Completed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {completed.map((entry) => (
                    <tr key={entry.id} className="transition-colors hover:bg-bg-secondary/50">
                      <td className="px-6 py-3.5 text-sm font-medium text-foreground">{entry.equipment_name}</td>
                      <td className="px-6 py-3.5">
                        <StatusBadge status={entry.type} colorMap={TYPE_COLORS} />
                      </td>
                      <td className="px-6 py-3.5 text-sm text-text-secondary max-w-xs truncate">{entry.description}</td>
                      <td className="px-6 py-3.5 text-sm text-text-secondary">
                        {entry.completed_date ? formatDate(entry.completed_date) : '\u2014'}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-text-secondary">{entry.performed_by ?? '\u2014'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-background px-6 py-12 text-center text-sm text-text-muted">
              No completed maintenance records.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
