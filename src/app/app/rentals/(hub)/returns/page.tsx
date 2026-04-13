import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import RentalsHubTabs from '../../RentalsHubTabs';
import StatusBadge, { RETURN_CONDITION_COLORS } from '@/components/ui/StatusBadge';
import MetricCard from '@/components/ui/MetricCard';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

async function getReturns() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    const { data } = await supabase
      .from('rental_line_items')
      .select('id, name, quantity, status, rental_orders!inner(order_number, rental_end, organization_id)')
      .eq('rental_orders.organization_id', ctx.organizationId)
      .in('status', ['returned', 'damaged', 'lost'])
      .order('created_at', { ascending: false })
      .limit(100);
    return (data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string, name: r.name as string, quantity: r.quantity as number, status: r.status as string,
      order_number: Array.isArray(r.rental_orders) ? (r.rental_orders as Record<string, unknown>[])[0]?.order_number as string : (r.rental_orders as Record<string, unknown> | null)?.order_number as string ?? null,
      rental_end: Array.isArray(r.rental_orders) ? (r.rental_orders as Record<string, unknown>[])[0]?.rental_end as string : (r.rental_orders as Record<string, unknown> | null)?.rental_end as string ?? null,
    }));
  } catch { return []; }
}

export default async function ReturnsPage() {
  const returns = await getReturns();
  const damaged = returns.filter((r) => r.status === 'damaged').length;
  const lost = returns.filter((r) => r.status === 'lost').length;

  return (
    <TierGate feature="equipment">
      <PageHeader title="Returns" subtitle="Process equipment returns, damage reports, and loss claims." />
      <RentalsHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {[
          { label: 'Total Returns', value: returns.length },
          { label: 'Returned OK', value: returns.filter((r) => r.status === 'returned').length, color: 'text-green-600' },
          { label: 'Damaged', value: damaged, color: 'text-orange-600' },
          { label: 'Lost', value: lost, color: 'text-red-600' },
        ].map((stat) => (
          <MetricCard key={stat.label} label={stat.label} value={stat.value} className={stat.color ? `[&_.text-foreground]:${stat.color}` : ''} />
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {returns.length === 0 ? (
          <div className="px-8 py-16 text-center"><p className="text-sm text-text-secondary">No returns processed. Returned rental items will appear here for inspection.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <Table >
              <TableHeader >
                <TableRow><TableHead className="px-4 py-3">Item</TableHead><TableHead className="px-4 py-3">Order</TableHead><TableHead className="px-4 py-3">Qty</TableHead><TableHead className="px-4 py-3">Return Date</TableHead><TableHead className="px-4 py-3">Condition</TableHead></TableRow>
              </TableHeader>
              <TableBody >
                {returns.map((r) => (
                  <TableRow key={r.id} className={`hover:bg-bg-secondary/50 transition-colors ${r.status === 'damaged' || r.status === 'lost' ? 'bg-red-500/5' : ''}`}>
                    <TableCell className="px-4 py-3 font-medium text-foreground">{r.name}</TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{r.order_number ?? '—'}</TableCell>
                    <TableCell className="px-4 py-3 tabular-nums">{r.quantity}</TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{r.rental_end ? new Date(r.rental_end).toLocaleDateString() : '—'}</TableCell>
                    <TableCell className="px-4 py-3"><StatusBadge status={r.status} colorMap={RETURN_CONDITION_COLORS} /></TableCell>
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
