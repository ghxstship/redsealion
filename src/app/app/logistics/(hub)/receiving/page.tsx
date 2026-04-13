import Checkbox from '@/components/ui/Checkbox';
import { formatDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import ShipmentsHeader from '@/components/admin/warehouse/ShipmentsHeader';
import Link from 'next/link';
import LogisticsHubTabs from "../../LogisticsHubTabs";
import StatusBadge, { RECEIPT_STATUS_COLORS } from '@/components/ui/StatusBadge';
import MetricCard from '@/components/ui/MetricCard';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

type ShipmentStatusRow = { status: string };

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
  const shipmentStatuses = (allShipments as ShipmentStatusRow[] | null) ?? [];

  const expected = shipmentStatuses.filter((shipment) => ['pending', 'shipped', 'in_transit'].includes(shipment.status));
  const received = shipmentStatuses.filter((shipment) => shipment.status === 'received');

  return (
    <TierGate feature="warehouse">
      <PageHeader title="Receiving" subtitle="Inbound shipments — materials and equipment arriving from vendors and sub-rentals.">
        <ShipmentsHeader defaultDirection="inbound" />
      </PageHeader>
      <LogisticsHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        {[
          { label: 'Total Inbound', value: shipmentStatuses.length },
          { label: 'Expected', value: expected.length, color: 'text-blue-600' },
          { label: 'Received', value: received.length, color: 'text-green-600' },
        ].map((stat) => (
          <MetricCard key={stat.label} label={stat.label} value={stat.value} className={stat.color ? `[&_.text-foreground]:${stat.color}` : ''} />
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
      <Table className="border-b-0 rounded-b-none border-x-0 border-t-0">
          <TableHeader>
            <TableRow>
              <TableHead>
                <Checkbox className="w-4 h-4 rounded border-border text-foreground focus:ring-foreground bg-background" /> {/* Bulk checkbox placeholder L-6 */}
              </TableHead>
              <TableHead>Shipment #</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>PO</TableHead>
              <TableHead>Carrier</TableHead>
              <TableHead>Tracking</TableHead>
              <TableHead>ETA</TableHead>
              <TableHead>Received</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
                  {shipments.map((s) => (
                    <TableRow key={s.id} className={s.status === 'in_transit' ? 'bg-blue-50/20' : ''}>
                      <TableCell><Checkbox className="w-4 h-4 rounded border-border text-foreground focus:ring-foreground bg-background" /></TableCell>
                      <TableCell><Link href={`/app/logistics/shipments/${s.id}`} className="font-medium text-foreground hover:underline">{s.shipment_number}</Link></TableCell>
                      <TableCell className="text-text-secondary">{s.vendor_name ?? '—'}</TableCell>
                      <TableCell className="text-text-secondary">{s.po_number ?? '—'}</TableCell>
                      <TableCell className="text-text-secondary">{s.carrier ?? '—'}</TableCell>
                      <TableCell className="font-mono text-xs text-text-muted">{s.tracking_number ?? '—'}</TableCell>
                      <TableCell className="text-text-secondary">{s.estimated_arrival ? formatDate(s.estimated_arrival) : '—'}</TableCell>
                      <TableCell className="text-text-secondary">{s.actual_arrival ? formatDate(s.actual_arrival) : '—'}</TableCell>
                      <TableCell><StatusBadge status={s.status} colorMap={RECEIPT_STATUS_COLORS} /></TableCell>
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
