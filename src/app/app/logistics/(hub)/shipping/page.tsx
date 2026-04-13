import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import ShipmentsHeader from '@/components/admin/warehouse/ShipmentsHeader';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import LogisticsHubTabs from "../../LogisticsHubTabs";
import StatusBadge, { SHIPMENT_STATUS_COLORS } from '@/components/ui/StatusBadge';
import MetricCard from '@/components/ui/MetricCard';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

async function getOutboundShipments(page: number, limit: number, statusFilter?: string) {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return { data: [], count: 0 };
    
    let query = supabase
      .from('shipments')
      .select('id, shipment_number, status, carrier, tracking_number, destination_address, ship_date, estimated_arrival, num_pieces, shipping_cost_cents, events(name), clients(name)', { count: 'exact' })
      .eq('organization_id', ctx.organizationId)
      .eq('direction', 'outbound')
      .is('deleted_at', null)
      .order('ship_date', { ascending: false });

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
      destination: s.destination_address as string | null,
      ship_date: s.ship_date as string | null, estimated_arrival: s.estimated_arrival as string | null,
      num_pieces: s.num_pieces as number, shipping_cost_cents: s.shipping_cost_cents as number,
      event_name: Array.isArray(s.events) ? (s.events as Record<string, unknown>[])[0]?.name as string : (s.events as Record<string, unknown> | null)?.name as string ?? null,
      client_name: Array.isArray(s.clients) ? (s.clients as Record<string, unknown>[])[0]?.name as string : (s.clients as Record<string, unknown> | null)?.name as string ?? null,
    }));
    return { data: mapped, count: count ?? 0 };
  } catch { return { data: [], count: 0 }; }
}

export default async function ShippingPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const statusFilter = params.status ?? 'all';
  const limit = 25;
  
  const { data: shipments, count } = await getOutboundShipments(page, limit, statusFilter);
  const totalPages = Math.ceil(count / limit);

  // We fetch unpaginated counts purely for the quick KPI dash items
  const supabase = await createClient();
  const ctx = await resolveCurrentOrg();
  const { data: allShipments } = await supabase.from('shipments').select('status, shipping_cost_cents').eq('organization_id', ctx?.organizationId ?? '').eq('direction', 'outbound').is('deleted_at', null);
  
  const inTransit = (allShipments ?? []).filter((s: any) => ['shipped', 'in_transit'].includes(s.status)).length;
  const totalCost = (allShipments ?? []).reduce((s: number, sh: any) => s + sh.shipping_cost_cents, 0);

  return (
    <TierGate feature="warehouse">
      <PageHeader title="Shipping" subtitle="Outbound shipments — equipment and materials sent to events, clients, and sites.">
        <ShipmentsHeader defaultDirection="outbound" />
      </PageHeader>
      <LogisticsHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {[
          { label: 'Total Shipments', value: String(allShipments?.length ?? 0) },
          { label: 'In Transit', value: String(inTransit), color: 'text-purple-600' },
          { label: 'Delivered', value: String((allShipments ?? []).filter((s: any) => s.status === 'delivered').length), color: 'text-green-600' },
          { label: 'Shipping Cost', value: formatCurrency(totalCost / 100) },
        ].map((stat) => (
          <MetricCard key={stat.label} label={stat.label} value={stat.value} className={stat.color ? `[&_.text-foreground]:${stat.color}` : ''} />
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
         <div className="flex gap-2">
            <Link href="?status=all" className={`px-3 py-1.5 text-xs rounded-full border ${statusFilter === 'all' ? 'bg-foreground text-background' : 'border-border text-text-muted'}`}>All</Link>
            <Link href="?status=pending" className={`px-3 py-1.5 text-xs rounded-full border ${statusFilter === 'pending' ? 'bg-foreground text-background' : 'border-border text-text-muted'}`}>Pending</Link>
            <Link href="?status=in_transit" className={`px-3 py-1.5 text-xs rounded-full border ${statusFilter === 'in_transit' ? 'bg-foreground text-background' : 'border-border text-text-muted'}`}>In Transit</Link>
         </div>
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden relative">
        {shipments.length === 0 ? (
          <div className="px-8 py-16 text-center"><p className="text-sm text-text-secondary">No outbound shipments found.</p></div>
        ) : (
          <>
      <Table className="border-b-0 rounded-b-none border-x-0 border-t-0">
          <TableHeader>
            <TableRow>
              <TableHead>
                <input type="checkbox" className="w-4 h-4 rounded border-border text-foreground focus:ring-foreground bg-background" /> {/* Bulk checkbox placeholder */}
              </TableHead>
              <TableHead>Shipment #</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Carrier</TableHead>
              <TableHead>Tracking</TableHead>
              <TableHead>Ship Date</TableHead>
              <TableHead>ETA</TableHead>
              <TableHead>Pcs</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
                  {shipments.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell><input type="checkbox" className="w-4 h-4 rounded border-border text-foreground focus:ring-foreground bg-background" /></TableCell>
                      <TableCell><Link href={`/app/logistics/shipments/${s.id}`} className="font-medium text-foreground hover:underline">{s.shipment_number}</Link></TableCell>
                      <TableCell className="text-text-secondary">{s.event_name ?? s.client_name ?? s.destination ?? '—'}</TableCell>
                      <TableCell className="text-text-secondary">{s.carrier ?? '—'}</TableCell>
                      <TableCell className="font-mono text-xs text-text-muted">{s.tracking_number ?? '—'}</TableCell>
                      <TableCell className="text-text-secondary">{s.ship_date ? new Date(s.ship_date).toLocaleDateString() : '—'}</TableCell>
                      <TableCell className="text-text-secondary">{s.estimated_arrival ? new Date(s.estimated_arrival).toLocaleDateString() : '—'}</TableCell>
                      <TableCell className="tabular-nums">{s.num_pieces}</TableCell>
                      <TableCell><StatusBadge status={s.status} colorMap={SHIPMENT_STATUS_COLORS} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            
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
