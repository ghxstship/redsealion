import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';
import RentalsHubTabs from '../../RentalsHubTabs';
import CreateSubRentalButton from './CreateSubRentalButton';
import StatusBadge, { SUB_RENTAL_STATUS_COLORS } from '@/components/ui/StatusBadge';
import MetricCard from '@/components/ui/MetricCard';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

async function getSubRentals() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    const { data } = await supabase
      .from('sub_rentals')
      .select('id, po_number, status, rental_start, rental_end, total_cost_cents, vendors(name)')
      .eq('organization_id', ctx.organizationId)
      .order('rental_start', { ascending: false });
    return (data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string, po_number: r.po_number as string | null, status: r.status as string,
      rental_start: r.rental_start as string, rental_end: r.rental_end as string, total_cost_cents: r.total_cost_cents as number,
      vendor_name: Array.isArray(r.vendors) ? (r.vendors as Record<string, unknown>[])[0]?.name as string : (r.vendors as Record<string, unknown> | null)?.name as string ?? null,
    }));
  } catch { return []; }
}



export default async function SubRentalsPage() {
  const subRentals = await getSubRentals();
  const totalCost = subRentals.reduce((s, r) => s + r.total_cost_cents, 0);

  return (
    <TierGate feature="equipment">
      <PageHeader title="Sub-Rentals" subtitle="Equipment rented from external suppliers to fill shortages.">
        <CreateSubRentalButton />
      </PageHeader>
      <RentalsHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        {[
          { label: 'Total Sub-Rentals', value: subRentals.length },
          { label: 'Active', value: subRentals.filter((r) => ['requested', 'confirmed', 'received'].includes(r.status)).length, color: 'text-blue-600' },
          { label: 'Total Cost', value: formatCurrency(totalCost / 100) },
        ].map((stat) => (
          <MetricCard key={stat.label} label={stat.label} value={stat.value} className={stat.color ? `[&_.text-foreground]:${stat.color}` : ''} />
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {subRentals.length === 0 ? (
          <div className="px-8 py-16 text-center"><p className="text-sm text-text-secondary">No sub-rentals. Sub-rentals are created when your inventory cannot meet a rental order.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <Table >
              <TableHeader >
                <TableRow><TableHead className="px-4 py-3">PO #</TableHead><TableHead className="px-4 py-3">Supplier</TableHead><TableHead className="px-4 py-3">Period</TableHead><TableHead className="px-4 py-3">Cost</TableHead><TableHead className="px-4 py-3">Status</TableHead></TableRow>
              </TableHeader>
              <TableBody >
                {subRentals.map((r) => (
                  <TableRow key={r.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <TableCell className="px-4 py-3 font-medium text-foreground">{r.po_number ?? '—'}</TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{r.vendor_name ?? '—'}</TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{new Date(r.rental_start).toLocaleDateString()} – {new Date(r.rental_end).toLocaleDateString()}</TableCell>
                    <TableCell className="px-4 py-3 tabular-nums">{formatCurrency(r.total_cost_cents / 100)}</TableCell>
                    <TableCell className="px-4 py-3"><StatusBadge status={r.status} colorMap={SUB_RENTAL_STATUS_COLORS} /></TableCell>
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
