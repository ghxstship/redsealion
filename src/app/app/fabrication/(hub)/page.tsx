import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import FabricationHubTabs from '../FabricationHubTabs';
import NewOrderButton from '@/components/fabrication/NewOrderButton';
import StatusBadge, { FABRICATION_STATUS_COLORS, TASK_PRIORITY_COLORS } from '@/components/ui/StatusBadge';
import MetricCard from '@/components/ui/MetricCard';

async function getOrders() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    const { data } = await supabase
      .from('fabrication_orders')
      .select('id, order_number, name, order_type, status, priority, quantity, total_cost_cents, due_date')
      .eq('organization_id', ctx.organizationId)
      .order('created_at', { ascending: false });
    return (data ?? []) as Array<{
      id: string; order_number: string; name: string; order_type: string; status: string;
      priority: string; quantity: number; total_cost_cents: number; due_date: string | null;
    }>;
  } catch { return []; }
}



export default async function FabricationOrdersPage() {
  const orders = await getOrders();
  const inProduction = orders.filter((o) => o.status === 'in_production').length;
  const totalValue = orders.reduce((s, o) => s + o.total_cost_cents, 0);

  return (
    <TierGate feature="equipment">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <PageHeader title="Fabrication" subtitle="Manage fabrication, print, and manufacturing orders from draft to delivery." />
        <NewOrderButton />
      </div>
      <FabricationHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <MetricCard label="Total Orders" value={orders.length} />
        <MetricCard label="In Production" value={inProduction} className="[&_.text-foreground]:text-blue-600" />
        <MetricCard label="Total Value" value={formatCurrency(totalValue / 100)} />
        <MetricCard label="Pending QC" value={orders.filter((o) => o.status === 'quality_check').length} className="[&_.text-foreground]:text-purple-600" />
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {orders.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">No fabrication orders yet. Create an order to start tracking production.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Cost</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-4 py-3"><Link href={`/app/fabrication/${o.id}`} className="font-medium text-foreground hover:underline">{o.order_number}</Link></td>
                    <td className="px-4 py-3 text-text-secondary">{o.name}</td>
                    <td className="px-4 py-3 capitalize">{o.order_type}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.priority} colorMap={TASK_PRIORITY_COLORS} /></td>
                    <td className="px-4 py-3 tabular-nums">{o.quantity}</td>
                    <td className="px-4 py-3 tabular-nums">{formatCurrency(o.total_cost_cents / 100)}</td>
                    <td className="px-4 py-3 text-text-secondary">{o.due_date ? new Date(o.due_date).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} colorMap={FABRICATION_STATUS_COLORS} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </TierGate>
  );
}
