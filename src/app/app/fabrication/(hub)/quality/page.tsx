import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import FabricationHubTabs from '../../FabricationHubTabs';

async function getQualityData() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return { orders: [], logs: [] };
    const { data: orders } = await supabase
      .from('fabrication_orders')
      .select('id, order_number, name, status')
      .eq('organization_id', ctx.organizationId)
      .eq('status', 'quality_check')
      .order('created_at', { ascending: false });
    const { data: logs } = await supabase
      .from('shop_floor_logs')
      .select('id, action, notes, created_at, fabrication_orders(order_number)')
      .in('action', ['quality_pass', 'quality_fail'])
      .order('created_at', { ascending: false })
      .limit(30);
    return {
      orders: (orders ?? []) as Array<{ id: string; order_number: string; name: string; status: string }>,
      logs: (logs ?? []).map((l: Record<string, unknown>) => ({
        id: l.id as string, action: l.action as string, notes: l.notes as string | null,
        created_at: l.created_at as string,
        order_number: Array.isArray(l.fabrication_orders) ? (l.fabrication_orders as Record<string, unknown>[])[0]?.order_number as string : (l.fabrication_orders as Record<string, unknown> | null)?.order_number as string ?? null,
      })),
    };
  } catch { return { orders: [], logs: [] }; }
}

export default async function QualityPage() {
  const { orders, logs } = await getQualityData();
  const passes = logs.filter((l) => l.action === 'quality_pass').length;
  const fails = logs.filter((l) => l.action === 'quality_fail').length;

  return (
    <TierGate feature="equipment">
      <PageHeader title="Quality Control" subtitle="Inspection results and pending QC items." />
      <FabricationHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {[
          { label: 'Pending QC', value: orders.length, color: 'text-yellow-600' },
          { label: 'Recent Passes', value: passes, color: 'text-green-600' },
          { label: 'Recent Fails', value: fails, color: 'text-red-600' },
          { label: 'Pass Rate', value: passes + fails > 0 ? `${Math.round((passes / (passes + fails)) * 100)}%` : '—' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs text-text-muted">{stat.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${stat.color ?? 'text-foreground'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {orders.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-foreground mb-3">Awaiting Inspection</h3>
          <div className="rounded-xl border border-border bg-background mb-6 divide-y divide-border">
            {orders.map((o) => (
              <div key={o.id} className="px-5 py-3 flex items-center justify-between">
                <div><p className="text-sm font-medium text-foreground">{o.order_number}</p><p className="text-xs text-text-secondary">{o.name}</p></div>
                <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-purple-50 text-purple-700">quality check</span>
              </div>
            ))}
          </div>
        </>
      )}

      <h3 className="text-sm font-semibold text-foreground mb-3">Recent Inspections</h3>
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {logs.length === 0 ? (
          <div className="px-8 py-16 text-center"><p className="text-sm text-text-secondary">No inspection history. QC logs appear as operators pass or fail checks.</p></div>
        ) : (
          <div className="divide-y divide-border">
            {logs.map((log) => (
              <div key={log.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{log.action === 'quality_pass' ? '🟢' : '🔴'}</span>
                  <div><p className="text-sm font-medium text-foreground">{log.order_number ?? 'Unknown'}</p>{log.notes && <p className="text-xs text-text-secondary">{log.notes}</p>}</div>
                </div>
                <p className="text-xs text-text-muted">{new Date(log.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </TierGate>
  );
}
