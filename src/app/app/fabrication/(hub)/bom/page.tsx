import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';
import FabricationHubTabs from '../../FabricationHubTabs';
import StatusBadge, { BOM_STATUS_COLORS } from '@/components/ui/StatusBadge';
import MetricCard from '@/components/ui/MetricCard';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

async function getBOM() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    const { data } = await supabase
      .from('bill_of_materials')
      .select('id, material_name, sku, quantity_required, quantity_on_hand, unit, unit_cost_cents, supplier, status, fabrication_orders!inner(order_number, name, organization_id)')
      .eq('fabrication_orders.organization_id', ctx.organizationId)
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



export default async function BOMPage() {
  const items = await getBOM();
  const totalCost = items.reduce((s, i) => s + i.unit_cost_cents * i.quantity_required, 0);
  const shortages = items.filter((i) => i.quantity_on_hand < i.quantity_required);

  return (
    <TierGate feature="equipment">
      <PageHeader title="Bill of Materials" subtitle="Track raw materials, components, and supplies across all fabrication orders." />
      <FabricationHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <MetricCard label="Total Materials" value={items.length} />
        <MetricCard label="Material Cost" value={formatCurrency(totalCost / 100)} />
        <MetricCard label="Shortages" value={shortages.length} className="[&_.text-foreground]:text-red-600" />
        <MetricCard label="Suppliers" value={new Set(items.map((i) => i.supplier).filter(Boolean)).size} />
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {items.length === 0 ? (
          <div className="px-8 py-16 text-center"><p className="text-sm text-text-secondary">No materials in BOM. Add materials when creating fabrication orders.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <Table >
              <TableHeader >
                <TableRow>
                  <TableHead className="px-4 py-3">Material</TableHead>
                  <TableHead className="px-4 py-3">SKU</TableHead>
                  <TableHead className="px-4 py-3">Order</TableHead>
                  <TableHead className="px-4 py-3">Required</TableHead>
                  <TableHead className="px-4 py-3">On Hand</TableHead>
                  <TableHead className="px-4 py-3">Cost</TableHead>
                  <TableHead className="px-4 py-3">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody >
                {items.map((item) => (
                  <TableRow key={item.id} className={`hover:bg-bg-secondary/50 transition-colors ${item.quantity_on_hand < item.quantity_required ? 'bg-red-500/5' : ''}`}>
                    <TableCell className="px-4 py-3 font-medium text-foreground">{item.material_name}</TableCell>
                    <TableCell className="px-4 py-3 text-text-muted font-mono text-xs">{item.sku ?? '—'}</TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{item.order_number ?? '—'}</TableCell>
                    <TableCell className="px-4 py-3 tabular-nums">{item.quantity_required} {item.unit}</TableCell>
                    <TableCell className="px-4 py-3 tabular-nums">{item.quantity_on_hand} {item.unit}</TableCell>
                    <TableCell className="px-4 py-3 tabular-nums">{formatCurrency((item.unit_cost_cents * item.quantity_required) / 100)}</TableCell>
                    <TableCell className="px-4 py-3"><StatusBadge status={item.status} colorMap={BOM_STATUS_COLORS} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </TierGate>
  );
}
