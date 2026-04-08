import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import Link from 'next/link';
import LogisticsHubTabs from "../../LogisticsHubTabs";

async function getInboundShipments() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    const { data } = await supabase
      .from('shipments')
      .select('id, shipment_number, status, carrier, tracking_number, origin_address, estimated_arrival, actual_arrival, num_pieces, vendors(name), purchase_orders(po_number)')
      .eq('organization_id', ctx.organizationId)
      .eq('direction', 'inbound')
      .order('estimated_arrival', { ascending: true });
    return (data ?? []).map((s: Record<string, unknown>) => ({
      id: s.id as string, shipment_number: s.shipment_number as string, status: s.status as string,
      carrier: s.carrier as string | null, tracking_number: s.tracking_number as string | null,
      origin: s.origin_address as string | null,
      estimated_arrival: s.estimated_arrival as string | null, actual_arrival: s.actual_arrival as string | null,
      num_pieces: s.num_pieces as number,
      vendor_name: Array.isArray(s.vendors) ? (s.vendors as Record<string, unknown>[])[0]?.name as string : (s.vendors as Record<string, unknown> | null)?.name as string ?? null,
      po_number: Array.isArray(s.purchase_orders) ? (s.purchase_orders as Record<string, unknown>[])[0]?.po_number as string : (s.purchase_orders as Record<string, unknown> | null)?.po_number as string ?? null,
    }));
  } catch { return []; }
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-50 text-gray-700', shipped: 'bg-purple-50 text-purple-700',
  in_transit: 'bg-indigo-50 text-indigo-700', received: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

export default async function ReceivingPage() {
  const shipments = await getInboundShipments();
  const expected = shipments.filter((s) => ['pending', 'shipped', 'in_transit'].includes(s.status));
  const received = shipments.filter((s) => s.status === 'received');

  return (
    <TierGate feature="warehouse">
      <PageHeader title="Receiving" subtitle="Inbound shipments — materials and equipment arriving from vendors and sub-rentals." />
      <LogisticsHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        {[
          { label: 'Total Inbound', value: shipments.length },
          { label: 'Expected', value: expected.length, color: 'text-blue-600' },
          { label: 'Received', value: received.length, color: 'text-green-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs text-text-muted">{stat.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${stat.color ?? 'text-foreground'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {shipments.length === 0 ? (
          <div className="px-8 py-16 text-center"><p className="text-sm text-text-secondary">No inbound shipments. Receiving records are created from purchase orders and sub-rental confirmations.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr>
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
                    <td className="px-4 py-3"><Link href={`/app/logistics/receiving/${s.id}`} className="font-medium text-foreground hover:underline">{s.shipment_number}</Link></td>
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
        )}
      </div>
    </TierGate>
  );
}
