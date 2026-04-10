import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import StatusBadge, { EQUIPMENT_STATUS_COLORS } from '@/components/ui/StatusBadge';
import MaintenanceKPIs from '@/components/admin/equipment/MaintenanceKPIs';
import { formatDate, formatLabel, formatCurrency } from '@/lib/utils';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/ui/Card';
import AssetDetailHeaderActions from '@/components/admin/equipment/AssetDetailHeaderActions';

const RESERVATION_COLORS: Record<string, string> = {
  confirmed: 'bg-green-50 text-green-700',
  tentative: 'bg-yellow-50 text-yellow-700',
  cancelled: 'bg-red-50 text-red-700',
  reserved: 'bg-blue-50 text-blue-700',
  checked_out: 'bg-purple-50 text-purple-700',
  returned: 'bg-bg-secondary text-text-muted',
};

export default async function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch asset
  const { data: item } = await supabase
    .from('assets')
    .select('*')
    .eq('id', id)
    .single();

  if (!item) notFound();

  // Fetch reservations and maintenance in parallel
  const [resResult, mntResult, schedResult] = await Promise.all([
    supabase
      .from('equipment_reservations')
      .select('id, proposal_id, reserved_from, reserved_until, status')
      .eq('asset_id', id)
      .order('reserved_from', { ascending: true }),
    supabase
      .from('maintenance_records')
      .select('id, type, description, scheduled_date, completed_date, performed_by, cost, status')
      .eq('asset_id', id)
      .order('scheduled_date', { ascending: false }),
    supabase
      .from('maintenance_schedules')
      .select('*')
      .eq('asset_id', id)
      .eq('is_active', true)
      .order('next_due_at', { ascending: true }),
  ]);

  const reservations = resResult.data ?? [];
  const maintenanceRecords = mntResult.data ?? [];
  const schedules = schedResult.data ?? [];

  // Compute utilization
  const acquisitionDate = new Date(item.created_at);
  const nowMs = Date.now();
  const daysSinceAcquisition = Math.max(1, Math.floor((nowMs - acquisitionDate.getTime()) / (1000 * 60 * 60 * 24)));
  const totalReservedDays = reservations.reduce((sum, r) => {
    const from = new Date(r.reserved_from as string);
    const until = new Date(r.reserved_until as string);
    return sum + Math.max(0, Math.ceil((until.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));
  }, 0);
  const utilizationRate = Math.min(100, Math.round((totalReservedDays / daysSinceAcquisition) * 100));

  // Warranty status
  const raw = item as Record<string, unknown>;
  const warrantyEnd = raw.warranty_end_date as string | null;
  const warrantyProvider = raw.warranty_provider as string | null;
  const warrantyActive = warrantyEnd && new Date(warrantyEnd).getTime() > nowMs;
  const warrantyDaysRemaining = warrantyEnd
    ? Math.ceil((new Date(warrantyEnd).getTime() - nowMs) / (1000 * 60 * 60 * 24))
    : null;

  // Overdue schedules
  const now = new Date().toISOString();
  const overdueSchedules = schedules.filter((s) => s.next_due_at && s.next_due_at < now);

  const acquisitionCost = item.acquisition_cost ?? 0;
  const currentValue = item.current_value ?? 0;
  const currentLocation = item.current_location as { type?: string } | null;

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
<PageHeader title={item.name} />
            <StatusBadge status={item.status} colorMap={EQUIPMENT_STATUS_COLORS} />
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            {item.category ?? 'Uncategorized'} &middot; {currentLocation?.type ?? 'Unknown location'}
            {item.serial_number ? ` · ${item.serial_number}` : ''}
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <AssetDetailHeaderActions assetId={item.id} status={item.status} />
        </div>
      </div>

      {/* Overdue alert */}
      {overdueSchedules.length > 0 && (
        <div className="rounded-lg bg-amber-50 text-amber-700 px-4 py-3 text-sm mb-6">
          {overdueSchedules.length} maintenance schedule{overdueSchedules.length > 1 ? 's' : ''} overdue.
          Earliest due: {formatDate(overdueSchedules[0].next_due_at!)}.
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Utilization</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground tabular-nums">{utilizationRate}%</p>
          <p className="mt-0.5 text-xs text-text-muted">{totalReservedDays}d reserved / {daysSinceAcquisition}d owned</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Book Value</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground tabular-nums">{formatCurrency(currentValue)}</p>
          {acquisitionCost > 0 && (
            <p className="mt-0.5 text-xs text-text-muted">of {formatCurrency(acquisitionCost)}</p>
          )}
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Warranty</p>
          {warrantyActive ? (
            <>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-green-700 tabular-nums">{warrantyDaysRemaining}d</p>
              <p className="mt-0.5 text-xs text-text-muted">{warrantyProvider ?? 'Active'}</p>
            </>
          ) : warrantyEnd ? (
            <>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-red-700">Expired</p>
              <p className="mt-0.5 text-xs text-text-muted">{formatDate(warrantyEnd)}</p>
            </>
          ) : (
            <>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-text-muted">—</p>
              <p className="mt-0.5 text-xs text-text-muted">Not configured</p>
            </>
          )}
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Deployments</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground tabular-nums">{item.deployment_count}</p>
          <p className="mt-0.5 text-xs text-text-muted">{item.max_deployments ? `of ${item.max_deployments} max` : 'Unlimited'}</p>
        </Card>
      </div>

      {/* Maintenance KPIs */}
      {maintenanceRecords.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-foreground mb-4">Maintenance Performance</h2>
          <MaintenanceKPIs records={maintenanceRecords.map((r) => ({
            id: r.id,
            type: r.type,
            status: r.status,
            scheduled_date: r.scheduled_date,
            completed_date: r.completed_date,
            cost: r.cost,
          }))} />
        </div>
      )}

      <div className="space-y-8">
        {/* Scheduled Maintenance */}
        {schedules.length > 0 && (
          <div className="rounded-xl border border-border bg-background overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Preventive Schedules</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Interval</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Next Due</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {schedules.map((s) => {
                    const isOverdue = s.next_due_at && s.next_due_at < now;
                    return (
                      <tr key={s.id} className="transition-colors hover:bg-bg-secondary/50">
                        <td className="px-6 py-3.5 text-sm text-foreground">{formatLabel(s.maintenance_type)}</td>
                        <td className="px-6 py-3.5 text-sm text-text-secondary max-w-xs truncate">{s.description ?? '—'}</td>
                        <td className="px-6 py-3.5 text-sm text-text-secondary tabular-nums">
                          {s.schedule_type === 'time_based' ? `Every ${s.interval_days}d` : `Every ${s.interval_usage} uses`}
                        </td>
                        <td className="px-6 py-3.5 text-sm text-text-secondary">
                          {s.next_due_at ? formatDate(s.next_due_at) : '—'}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            isOverdue ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                          }`}>
                            {isOverdue ? 'Overdue' : 'On Track'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reservations */}
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Reservations</h2>
          </div>
          {reservations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Start</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">End</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reservations.map((res) => (
                    <tr key={res.id} className="transition-colors hover:bg-bg-secondary/50">
                      <td className="px-6 py-3.5 text-sm font-medium text-foreground">{res.proposal_id ?? '—'}</td>
                      <td className="px-6 py-3.5 text-sm text-text-secondary">{formatDate(res.reserved_from as string)}</td>
                      <td className="px-6 py-3.5 text-sm text-text-secondary">{formatDate(res.reserved_until as string)}</td>
                      <td className="px-6 py-3.5">
                        <StatusBadge status={res.status} colorMap={RESERVATION_COLORS} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-sm text-text-muted">No reservations.</div>
          )}
        </div>

        {/* Maintenance History */}
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Maintenance History</h2>
          </div>
          {maintenanceRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Performed By</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {maintenanceRecords.map((record) => (
                    <tr key={record.id} className="transition-colors hover:bg-bg-secondary/50">
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center rounded-full bg-bg-secondary px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                          {record.type}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-text-secondary max-w-xs truncate">{record.description}</td>
                      <td className="px-6 py-3.5 text-sm text-text-secondary">{formatDate(record.scheduled_date)}</td>
                      <td className="px-6 py-3.5 text-sm text-text-secondary">{record.performed_by ?? '—'}</td>
                      <td className="px-6 py-3.5 text-sm text-right font-medium tabular-nums text-foreground">
                        {record.cost ? formatCurrency(record.cost) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-sm text-text-muted">No maintenance records.</div>
          )}
        </div>
      </div>
    </>
  );
}
