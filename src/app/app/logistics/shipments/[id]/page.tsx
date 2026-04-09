import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';

interface ShipmentDetail {
  id: string;
  shipment_number: string;
  direction: string;
  status: string;
  carrier: string | null;
  tracking_number: string | null;
  origin_address: string | null;
  destination_address: string | null;
  ship_date: string | null;
  estimated_arrival: string | null;
  actual_arrival: string | null;
  weight_lbs: number | null;
  num_pieces: number;
  shipping_cost_cents: number;
  notes: string | null;
  created_at: string;
  shipment_line_items: Array<{
    id: string;
    description: string | null;
    quantity: number;
    weight_lbs: number | null;
  }>;
  events: { id: string; name: string } | null;
  clients: { id: string; name: string } | null;
  vendors: { id: string; name: string } | null;
}

async function getShipment(id: string): Promise<ShipmentDetail | null> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return null;
    const { data } = await supabase
      .from('shipments')
      .select('*, shipment_line_items(*), events(id, name), clients(id, name), vendors(id, name)')
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .single();
    return data as ShipmentDetail | null;
  } catch { return null; }
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  in_transit: 'bg-blue-50 text-blue-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

export default async function ShipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shipment = await getShipment(id);
  if (!shipment) notFound();

  const isOutbound = shipment.direction === 'outbound';

  return (
    <TierGate feature="logistics">
      <PageHeader
        title={shipment.shipment_number}
        subtitle={`${isOutbound ? 'Outbound' : 'Inbound'} Shipment — ${shipment.status}`}
      >
        <Link href={isOutbound ? '/app/logistics/shipping' : '/app/logistics/receiving'} className="btn-secondary text-sm">
          ← Back to {isOutbound ? 'Shipping' : 'Receiving'}
        </Link>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Shipment Info */}
        <div className="rounded-xl border border-border bg-background p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Shipment Details</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-text-muted">Status</dt><dd><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[shipment.status] ?? ''}`}>{shipment.status}</span></dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Direction</dt><dd className="text-foreground capitalize">{shipment.direction}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Carrier</dt><dd className="text-foreground">{shipment.carrier ?? '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Tracking #</dt><dd className="text-foreground">{shipment.tracking_number ?? '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Weight</dt><dd className="text-foreground">{shipment.weight_lbs ? `${shipment.weight_lbs} lbs` : '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Pieces</dt><dd className="text-foreground">{shipment.num_pieces}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Cost</dt><dd className="text-foreground">{shipment.shipping_cost_cents ? `$${(shipment.shipping_cost_cents / 100).toFixed(2)}` : '—'}</dd></div>
          </dl>
        </div>

        {/* Dates & Addresses */}
        <div className="rounded-xl border border-border bg-background p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Routing</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-text-muted">Origin</dt><dd className="text-foreground text-right max-w-[200px]">{shipment.origin_address ?? '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Destination</dt><dd className="text-foreground text-right max-w-[200px]">{shipment.destination_address ?? '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Ship Date</dt><dd className="text-foreground">{shipment.ship_date ? new Date(shipment.ship_date).toLocaleDateString() : '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Est. Arrival</dt><dd className="text-foreground">{shipment.estimated_arrival ? new Date(shipment.estimated_arrival).toLocaleDateString() : '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Actual Arrival</dt><dd className="text-foreground">{shipment.actual_arrival ? new Date(shipment.actual_arrival).toLocaleDateString() : '—'}</dd></div>
          </dl>
          {(shipment.events || shipment.clients || shipment.vendors) && (
            <div className="mt-4 pt-4 border-t border-border">
              <h4 className="text-xs font-medium text-text-muted mb-2">Linked To</h4>
              {shipment.events && <p className="text-sm text-foreground">Event: {shipment.events.name}</p>}
              {shipment.clients && <p className="text-sm text-foreground">Client: {shipment.clients.name}</p>}
              {shipment.vendors && <p className="text-sm text-foreground">Vendor: {shipment.vendors.name}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Line Items */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Line Items ({shipment.shipment_line_items?.length ?? 0})</h3>
        </div>
        {(shipment.shipment_line_items?.length ?? 0) === 0 ? (
          <div className="px-8 py-12 text-center text-sm text-text-secondary">No line items added to this shipment.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              <tr><th className="px-4 py-3">Description</th><th className="px-4 py-3">Qty</th><th className="px-4 py-3">Weight</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shipment.shipment_line_items.map((item) => (
                <tr key={item.id} className="hover:bg-bg-secondary/50"><td className="px-4 py-3 text-foreground">{item.description ?? '—'}</td><td className="px-4 py-3 tabular-nums">{item.quantity}</td><td className="px-4 py-3 tabular-nums text-text-secondary">{item.weight_lbs ? `${item.weight_lbs} lbs` : '—'}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {shipment.notes && (
        <div className="mt-6 rounded-xl border border-border bg-background p-6">
          <h3 className="text-sm font-semibold text-foreground mb-2">Notes</h3>
          <p className="text-sm text-text-secondary whitespace-pre-wrap">{shipment.notes}</p>
        </div>
      )}
    </TierGate>
  );
}
