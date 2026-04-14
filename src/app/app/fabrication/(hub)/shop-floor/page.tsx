import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import FabricationHubTabs from '../../FabricationHubTabs';
import StatusBadge from '@/components/ui/StatusBadge';
import MetricCard from '@/components/ui/MetricCard';

async function getShopFloor() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    const { data } = await supabase
      .from('shop_floor_logs')
      .select('id, action, notes, created_at, fabrication_orders!inner(order_number, name, organization_id), users(full_name)')
      .eq('fabrication_orders.organization_id', ctx.organizationId)
      .order('created_at', { ascending: false })
      .limit(50);
    return (data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string, action: r.action as string, notes: r.notes as string | null,
      created_at: r.created_at as string,
      order_number: Array.isArray(r.fabrication_orders) ? (r.fabrication_orders as Record<string, unknown>[])[0]?.order_number as string : (r.fabrication_orders as Record<string, unknown> | null)?.order_number as string ?? null,
      order_name: Array.isArray(r.fabrication_orders) ? (r.fabrication_orders as Record<string, unknown>[])[0]?.name as string : (r.fabrication_orders as Record<string, unknown> | null)?.name as string ?? null,
      worker_name: Array.isArray(r.users) ? (r.users as Record<string, unknown>[])[0]?.full_name as string : (r.users as Record<string, unknown> | null)?.full_name as string ?? null,
    }));
  } catch { return []; }
}

const ACTION_ICONS: Record<string, string> = { started: '▶', paused: '⏸', resumed: '↻', completed: '✓', quality_pass: '✔', quality_fail: '✘', note: '✉' };
const ACTION_COLORS: Record<string, string> = { started: 'bg-blue-50 text-blue-700', completed: 'bg-green-50 text-green-700', quality_pass: 'bg-green-50 text-green-700', quality_fail: 'bg-red-500/10 text-red-700', paused: 'bg-yellow-50 text-yellow-700', resumed: 'bg-blue-50 text-blue-700', note: 'bg-bg-secondary text-text-secondary' };

export default async function ShopFloorPage() {
  const logs = await getShopFloor();

  return (
    <TierGate feature="equipment">
      <PageHeader title="Shop Floor" subtitle="Real-time production activity and operator logs." />
      <FabricationHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        <MetricCard label="Recent Logs" value={logs.length} />
        <MetricCard label="Completions" value={logs.filter((l) => l.action === 'completed').length} className="[&_.text-foreground]:text-green-600" />
        <MetricCard label="QC Failures" value={logs.filter((l) => l.action === 'quality_fail').length} className="[&_.text-foreground]:text-red-600" />
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {logs.length === 0 ? (
          <div className="px-8 py-16 text-center"><p className="text-sm text-text-secondary">No shop floor activity yet. Logs appear as operators update work on fabrication orders.</p></div>
        ) : (
          <div className="divide-y divide-border">
            {logs.map((log) => (
              <div key={log.id} className="px-5 py-4 flex items-start gap-3">
                <span className="text-lg mt-0.5">{ACTION_ICONS[log.action] ?? '•'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={log.action} colorMap={ACTION_COLORS} />
                    {log.order_number && <span className="text-xs text-text-muted">• {log.order_number}</span>}
                  </div>
                  {log.order_name && <p className="text-sm text-foreground mt-1">{log.order_name}</p>}
                  {log.notes && <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{log.notes}</p>}
                  {log.worker_name && <p className="text-xs text-text-muted mt-1">By: {log.worker_name}</p>}
                </div>
                <p className="text-xs text-text-muted whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </TierGate>
  );
}
