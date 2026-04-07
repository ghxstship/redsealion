import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import LogisticsHubTabs from "../../LogisticsHubTabs";

async function getOutboundShipments() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    const { data } = await supabase
      .from('shipments')
      .select('id, shipment_number, status, carrier, tracking_number, destination_address, ship_date, estimated_arrival, num_pieces, shipping_cost_cents, events(name), clients(name)')
      .eq('organization_id', ctx.organizationId)
      .eq('direction', 'outbound')
      .order('ship_date', { ascending: false });
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return (data ?? []).map((s: any) => ({
      id: s.id as string, shipment_number: s.shipment_number as string, status: s.status as string,
      carrier: s.carrier as string | null, tracking_number: s.tracking_number as string | null,
      destination: s.destination_address as string | null,
      ship_date: s.ship_date as string | null, estimated_arrival: s.estimated_arrival as string | null,
      num_pieces: s.num_pieces as number, shipping_cost_cents: s.shipping_cost_cents as number,
      event_name: Array.isArray(s.events) ? s.events[0]?.name : s.events?.name ?? null,
      client_name: Array.isArray(s.clients) ? s.clients[0]?.name : s.clients?.name ?? null,
    }));
  } catch { return []; }
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-50 text-gray-700', picked: 'bg-yellow-50 text-yellow-700', packed: 'bg-blue-50 text-blue-700',
  shipped: 'bg-purple-50 text-purple-700', in_transit: 'bg-indigo-50 text-indigo-700',
  delivered: 'bg-green-50 text-green-700', cancelled: 'bg-red-50 text-red-700',
};

export default async function ShippingPage() {
  const shipments = await getOutboundShipments();
  const inTransit = shipments.filter((s) => ['shipped', 'in_transit'].includes(s.status)).length;
  const totalCost = shipments.reduce((s, sh) => s + sh.shipping_cost_cents, 0);

  return (
    <TierGate feature="warehouse">
      <PageHeader title="Shipping" subtitle="Outbound shipments — equipment and materials sent to events, clients, and sites." />
      <LogisticsHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {[
          { label: 'Total Shipments', value: String(shipments.length) },
          { label: 'In Transit', value: String(inTransit), color: 'text-purple-600' },
          { label: 'Delivered', value: String(shipments.filter((s) => s.status === 'delivered').length), color: 'text-green-600' },
          { label: 'Shipping Cost', value: formatCurrency(totalCost / 100) },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs text-text-muted">{stat.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${stat.color ?? 'text-foreground'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        {shipments.length === 0 ? (
          <div className="px-8 py-16 text-center"><p className="text-sm text-text-secondary">No outbound shipments. Create a shipment to track equipment and materials leaving the warehouse.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Shipment #</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Carrier</th>
                  <th className="px-4 py-3">Tracking</th>
                  <th className="px-4 py-3">Ship Date</th>
                  <th className="px-4 py-3">ETA</th>
                  <th className="px-4 py-3">Pcs</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {shipments.map((s) => (
                  <tr key={s.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-4 py-3"><Link href={`/app/logistics/shipping/${s.id}`} className="font-medium text-foreground hover:underline">{s.shipment_number}</Link></td>
                    <td className="px-4 py-3 text-text-secondary">{s.event_name ?? s.client_name ?? s.destination ?? '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{s.carrier ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text-muted">{s.tracking_number ?? '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{s.ship_date ? new Date(s.ship_date).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{s.estimated_arrival ? new Date(s.estimated_arrival).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 tabular-nums">{s.num_pieces}</td>
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
