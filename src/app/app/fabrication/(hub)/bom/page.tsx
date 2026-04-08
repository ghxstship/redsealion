import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';
import FabricationHubTabs from '../../FabricationHubTabs';

async function getBOM() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    const { data } = await supabase
      .from('bill_of_materials')
      .select('id, material_name, sku, quantity_required, quantity_on_hand, unit, unit_cost_cents, supplier, status, fabrication_orders(order_number, name)')
      .order('created_at', { ascending: false })
      .limit(100);
    return (data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string, material_name: r.material_name as string, sku: r.sku as string | null,
      quantity_required: Number(r.quantity_required), quantity_on_hand: Number(r.quantity_on_hand),
      unit: r.unit as string, unit_cost_cents: r.unit_cost_cents as number,
      supplier: r.supplier as string | null, status: r.status as string,
      order_number: Array.isArray(r.fabrication_orders) ? (r.fabrication_orders as Record<string, unknown>[])[0]?.order_number as string : (r.fabrication_orders as Record<string, unknown> | null)?.order_number as string ?? null,
    }));
  } catch { return []; }
}

const STATUS_COLORS: Record<string, string> = { pending: 'bg-yellow-50 text-yellow-700', ordered: 'bg-blue-50 text-blue-700', received: 'bg-green-50 text-green-700', allocated: 'bg-purple-50 text-purple-700' };

export default async function BOMPage() {
  const items = await getBOM();
  const totalCost = items.reduce((s, i) => s + i.unit_cost_cents * i.quantity_required, 0);
  const shortages = items.filter((i) => i.quantity_on_hand < i.quantity_required);

  return (
    <TierGate feature="equipment">
      <PageHeader title="Bill of Materials" subtitle="Track raw materials, components, and supplies across all fabrication orders." />
      <FabricationHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {[
          { label: 'Total Materials', value: String(items.length) },
          { label: 'Material Cost', value: formatCurrency(totalCost / 100) },
          { label: 'Shortages', value: String(shortages.length), color: 'text-red-600' },
          { label: 'Suppliers', value: String(new Set(items.map((i) => i.supplier).filter(Boolean)).size) },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs text-text-muted">{stat.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${stat.color ?? 'text-foreground'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {items.length === 0 ? (
          <div className="px-8 py-16 text-center"><p className="text-sm text-text-secondary">No materials in BOM. Add materials when creating fabrication orders.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Material</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Required</th>
                  <th className="px-4 py-3">On Hand</th>
                  <th className="px-4 py-3">Cost</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => (
                  <tr key={item.id} className={`hover:bg-bg-secondary/50 transition-colors ${item.quantity_on_hand < item.quantity_required ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3 font-medium text-foreground">{item.material_name}</td>
                    <td className="px-4 py-3 text-text-muted font-mono text-xs">{item.sku ?? '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{item.order_number ?? '—'}</td>
                    <td className="px-4 py-3 tabular-nums">{item.quantity_required} {item.unit}</td>
                    <td className="px-4 py-3 tabular-nums">{item.quantity_on_hand} {item.unit}</td>
                    <td className="px-4 py-3 tabular-nums">{formatCurrency((item.unit_cost_cents * item.quantity_required) / 100)}</td>
                    <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[item.status]}`}>{item.status}</span></td>
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
