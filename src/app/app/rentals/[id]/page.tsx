import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';
import RentalStatusActions from './RentalStatusActions';
import StatusBadge, { RENTAL_ORDER_STATUS_COLORS } from '@/components/ui/StatusBadge';
import RentalEditForm from './RentalEditForm';

async function getRentalOrder(id: string) {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return null;

    const { data } = await supabase
      .from('rental_orders')
      .select('*, rental_line_items(*), sub_rentals(*), clients(id, company_name), events(id, name)')
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .single();

    return data;
  } catch {
    return null;
  }
}



export default async function RentalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getRentalOrder(id);
  if (!order) notFound();

  const lineItems = (order.rental_line_items ?? []) as Array<Record<string, unknown>>;
  const subRentals = (order.sub_rentals ?? []) as Array<Record<string, unknown>>;
  const client = order.clients as { id: string; company_name: string } | null;
  const event = order.events as { id: string; name: string } | null;

  return (
    <TierGate feature="equipment">
      <PageHeader
        title={order.order_number as string}
        subtitle="Rental order details"
      >
        <Link
          href="/app/rentals"
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary"
        >
          ← Back to Rentals
        </Link>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Order Info */}
        <div className="rounded-xl border border-border bg-background p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Order Details</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-muted">Status</dt>
              <dd>
                <StatusBadge status={order.status as string} colorMap={RENTAL_ORDER_STATUS_COLORS} />
              </dd>
            </div>
            {client && (
              <div className="flex justify-between">
                <dt className="text-text-muted">Client</dt>
                <dd>
                  <Link href={`/app/clients/${client.id}`} className="text-foreground hover:underline">
                    {client.company_name}
                  </Link>
                </dd>
              </div>
            )}
            {event && (
              <div className="flex justify-between">
                <dt className="text-text-muted">Event</dt>
                <dd>
                  <Link href={`/app/events/${event.id}`} className="text-foreground hover:underline">
                    {event.name}
                  </Link>
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-text-muted">Rental Period</dt>
              <dd className="text-foreground">
                {new Date(order.rental_start as string).toLocaleDateString()} – {new Date(order.rental_end as string).toLocaleDateString()}
              </dd>
            </div>
            {(order.total_cents as number) > 0 && (
              <div className="flex justify-between">
                <dt className="text-text-muted">Total</dt>
                <dd className="text-foreground font-medium tabular-nums">{formatCurrency((order.total_cents as number) / 100)}</dd>
              </div>
            )}
            {(order.deposit_cents as number) > 0 && (
              <div className="flex justify-between">
                <dt className="text-text-muted">Deposit</dt>
                <dd className="text-foreground tabular-nums">{formatCurrency((order.deposit_cents as number) / 100)}</dd>
              </div>
            )}
          </dl>
          {order.notes && (
            <p className="mt-4 text-sm text-text-secondary border-t border-border pt-4">{order.notes as string}</p>
          )}
        </div>

        {/* Edit Form */}
        <div className="rounded-xl border border-border bg-background p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Edit Order</h3>
          <RentalEditForm
            orderId={id}
            currentDates={{ start: order.rental_start as string, end: order.rental_end as string }}
            currentDeposit={(order.deposit_cents as number) ?? 0}
            currentNotes={(order.notes as string) ?? ''}
          />
        </div>
      </div>

      {/* Line Items */}
      <div className="rounded-xl border border-border bg-background overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Line Items ({lineItems.length})</h3>
        </div>
        {lineItems.length === 0 ? (
          <div className="px-8 py-12 text-center text-sm text-text-secondary">No line items added to this rental order.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Rate</th>
                <th className="px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lineItems.map((item) => (
                <tr key={item.id as string} className="hover:bg-bg-secondary/50 transition-colors">
                  <td className="px-4 py-3 text-foreground">{(item.description as string) ?? (item.equipment_item_id as string) ?? '—'}</td>
                  <td className="px-4 py-3 text-text-secondary tabular-nums">{(item.quantity as number) ?? 1}</td>
                  <td className="px-4 py-3 text-text-secondary tabular-nums">{item.daily_rate_cents ? formatCurrency((item.daily_rate_cents as number) / 100) : '—'}</td>
                  <td className="px-4 py-3 text-foreground tabular-nums">{item.total_cents ? formatCurrency((item.total_cents as number) / 100) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Sub-Rentals */}
      {subRentals.length > 0 && (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Sub-Rentals ({subRentals.length})</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {subRentals.map((sr) => (
                <tr key={sr.id as string} className="hover:bg-bg-secondary/50 transition-colors">
                  <td className="px-4 py-3 text-foreground">{(sr.vendor_name as string) ?? '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={sr.status as string} colorMap={RENTAL_ORDER_STATUS_COLORS} />
                  </td>
                  <td className="px-4 py-3 text-foreground tabular-nums">{sr.total_cost_cents ? formatCurrency((sr.total_cost_cents as number) / 100) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </TierGate>
  );
}
