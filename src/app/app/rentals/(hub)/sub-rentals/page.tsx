import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';
import RentalsHubTabs from '../../RentalsHubTabs';

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

const STATUS_COLORS: Record<string, string> = { requested: 'bg-yellow-50 text-yellow-700', confirmed: 'bg-blue-50 text-blue-700', received: 'bg-green-50 text-green-700', returned: 'bg-gray-50 text-gray-700', invoiced: 'bg-green-50 text-green-700' };

export default async function SubRentalsPage() {
  const subRentals = await getSubRentals();
  const totalCost = subRentals.reduce((s, r) => s + r.total_cost_cents, 0);

  return (
    <TierGate feature="equipment">
      <PageHeader title="Sub-Rentals" subtitle="Equipment rented from external suppliers to fill shortages." />
      <RentalsHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        {[
          { label: 'Total Sub-Rentals', value: subRentals.length },
          { label: 'Active', value: subRentals.filter((r) => ['requested', 'confirmed', 'received'].includes(r.status)).length, color: 'text-blue-600' },
          { label: 'Total Cost', value: formatCurrency(totalCost / 100) },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs text-text-muted">{stat.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${stat.color ?? 'text-foreground'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        {subRentals.length === 0 ? (
          <div className="px-8 py-16 text-center"><p className="text-sm text-text-secondary">No sub-rentals. Sub-rentals are created when your inventory cannot meet a rental order.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr><th className="px-4 py-3">PO #</th><th className="px-4 py-3">Supplier</th><th className="px-4 py-3">Period</th><th className="px-4 py-3">Cost</th><th className="px-4 py-3">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subRentals.map((r) => (
                  <tr key={r.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{r.po_number ?? '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{r.vendor_name ?? '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{new Date(r.rental_start).toLocaleDateString()} – {new Date(r.rental_end).toLocaleDateString()}</td>
                    <td className="px-4 py-3 tabular-nums">{formatCurrency(r.total_cost_cents / 100)}</td>
                    <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[r.status]}`}>{r.status}</span></td>
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
