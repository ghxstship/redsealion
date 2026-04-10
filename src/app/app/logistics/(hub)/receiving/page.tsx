import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import ShipmentsHeader from '@/components/admin/warehouse/ShipmentsHeader';
import Link from 'next/link';
import LogisticsHubTabs from "../../LogisticsHubTabs";

async function getInboundShipments(page: number, limit: number, statusFilter?: string) {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return { data: [], count: 0 };

    let query = supabase
      .from('shipments')
      .select('id, shipment_number, status, carrier, tracking_number, origin_address, estimated_arrival, actual_arrival, num_pieces, vendors(name), purchase_orders(po_number)', { count: 'exact' })
      .eq('organization_id', ctx.organizationId)
      .eq('direction', 'inbound')
      .is('deleted_at', null)
      .order('estimated_arrival', { ascending: true });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, count } = await query;
    const mapped = (data ?? []).map((s: Record<string, unknown>) => ({
      id: s.id as string, shipment_number: s.shipment_number as string, status: s.status as string,
      carrier: s.carrier as string | null, tracking_number: s.tracking_number as string | null,
      origin: s.origin_address as string | null,
      estimated_arrival: s.estimated_arrival as string | null, actual_arrival: s.actual_arrival as string | null,
      num_pieces: s.num_pieces as number,
      vendor_name: Array.isArray(s.vendors) ? (s.vendors as Record<string, unknown>[])[0]?.name as string : (s.vendors as Record<string, unknown> | null)?.name as string ?? null,
      po_number: Array.isArray(s.purchase_orders) ? (s.purchase_orders as Record<string, unknown>[])[0]?.po_number as string : (s.purchase_orders as Record<string, unknown> | null)?.po_number as string ?? null,
    }));
    return { data: mapped, count: count ?? 0 };
  } catch { return { data: [], count: 0 }; }
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-bg-secondary text-text-secondary', shipped: 'bg-purple-50 text-purple-700',
  in_transit: 'bg-indigo-50 text-indigo-700', received: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

export default async function ReceivingPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const statusFilter = params.status ?? 'all';
  const limit = 25;

  const { data: shipments, count } = await getInboundShipments(page, limit, statusFilter);
  const totalPages = Math.ceil(count / limit);

  const supabase = await createClient();
  const ctx = await resolveCurrentOrg();
  const { data: allShipments } = await supabase.from('shipments').select('status').eq('organization_id', ctx?.organizationId ?? '').eq('direction', 'inbound').is('deleted_at', null);

  const expected = (allShipments ?? []).filter((s: any) => ['pending', 'shipped', 'in_transit'].includes(s.status));
  const received = (allShipments ?? []).filter((s: any) => s.status === 'received');

  return (
    <TierGate feature="warehouse">
      <PageHeader title="Receiving" subtitle="Inbound shipments — materials and equipment arriving from vendors and sub-rentals.">
        <ShipmentsHeader defaultDirection="inbound" />
      </PageHeader>
      <LogisticsHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        {[
          { label: 'Total Inbound', value: allShipments?.length ?? 0 },
          { label: 'Expected', value: expected.length, color: 'text-blue-600' },
          { label: 'Received', value: received.length, color: 'text-green-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs text-text-muted">{stat.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${stat.color ?? 'text-foreground'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
         <div className="flex gap-2">
            <Link href="?status=all" className={`px-3 py-1.5 text-xs rounded-full border ${statusFilter === 'all' ? 'bg-foreground text-background' : 'border-border text-text-muted'}`}>All</Link>
            <Link href="?status=pending" className={`px-3 py-1.5 text-xs rounded-full border ${statusFilter === 'pending' ? 'bg-foreground text-background' : 'border-border text-text-muted'}`}>Pending</Link>
            <Link href="?status=shipped" className={`px-3 py-1.5 text-xs rounded-full border ${statusFilter === 'shipped' ? 'bg-foreground text-background' : 'border-border text-text-muted'}`}>Shipped</Link>
            <Link href="?status=received" className={`px-3 py-1.5 text-xs rounded-full border ${statusFilter === 'received' ? 'bg-foreground text-background' : 'border-border text-text-muted'}`}>Received</Link>
         </div>
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden relative">
        {shipments.length === 0 ? (
          <div className="px-8 py-16 text-center"><p className="text-sm text-text-secondary">No inbound shipments found.</p></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">
                      <input type="checkbox" className="rounded" /> {/* Bulk checkbox placeholder L-6 */}
                    </th>
                    <th className="px-4 py-3">Shipment #</th>
                    <th className="px-4 py-3">Vendor</th>
                    <th className="px-4 py-3">PO</th>
                    <th className="px-4 py-3">Carrier</th>
                    <th className="px-4 py-3">Tracking</th>
                    <th className="px-4 py-3">ETA</th>
                    <th className="px-4 py-3">Received</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {shipments.map((s) => (
                    <tr key={s.id} className={`hover:bg-bg-secondary/50 transition-colors ${s.status === 'in_transit' ? 'bg-blue-50/20' : ''}`}>
                      <td className="px-4 py-3"><input type="checkbox" className="rounded" /></td>
                      <td className="px-4 py-3"><Link href={`/app/logistics/shipments/${s.id}`} className="font-medium text-foreground hover:underline">{s.shipment_number}</Link></td>
                      <td className="px-4 py-3 text-text-secondary">{s.vendor_name ?? '—'}</td>
                      <td className="px-4 py-3 text-text-secondary">{s.po_number ?? '—'}</td>
                      <td className="px-4 py-3 text-text-secondary">{s.carrier ?? '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-text-muted">{s.tracking_number ?? '—'}</td>
                      <td className="px-4 py-3 text-text-secondary">{s.estimated_arrival ? new Date(s.estimated_arrival).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3 text-text-secondary">{s.actual_arrival ? new Date(s.actual_arrival).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s.status]}`}>{s.status.replace('_', ' ')}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination block */}
            <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-bg-secondary">
              <span className="text-xs text-text-muted">Showing {(page - 1) * limit + 1} to {Math.min(page * limit, count)} of {count}</span>
              <div className="flex items-center gap-2">
                <Link href={`?page=${Math.max(page - 1, 1)}&status=${statusFilter}`} className={`px-2 py-1 border border-border rounded text-xs ${page <= 1 ? 'opacity-50 pointer-events-none' : ''}`}>Prev</Link>
                <Link href={`?page=${Math.min(page + 1, totalPages)}&status=${statusFilter}`} className={`px-2 py-1 border border-border rounded text-xs ${page >= totalPages ? 'opacity-50 pointer-events-none' : ''}`}>Next</Link>
              </div>
            </div>
          </>
        )}
      </div>
    </TierGate>
  );
}
