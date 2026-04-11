import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge, { TRANSFER_STATUS_COLORS } from '@/components/ui/StatusBadge';

interface TransferDetail {
  id: string;
  status: string;
  scheduled_date: string | null;
  shipped_date: string | null;
  received_date: string | null;
  notes: string | null;
  from_facility: { name: string } | null;
  to_facility: { name: string } | null;
  items: Array<{
    id: string;
    quantity: number;
    assets: { name: string; category: string } | null;
  }>;
}

async function getTransfer(id: string): Promise<TransferDetail | null> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return null;

    const { data } = await supabase
      .from('warehouse_transfers')
      .select(`
        *,
        from_facility:facilities!from_facility_id(name),
        to_facility:facilities!to_facility_id(name),
        items:warehouse_transfer_items(id, quantity, assets(name, category))
      `)
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .single();

    return data as any;
  } catch {
    return null;
  }
}



function formatLabel(s: string): string {
  return s.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default async function TransferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const transfer = await getTransfer(id);
  if (!transfer) notFound();

  return (
    <>
      <PageHeader
        title="Warehouse Transfer"
        subtitle={`Status: ${formatLabel(transfer.status)}`}
      >
        <Link href="/app/logistics/transfers" className="btn-secondary text-sm">
          ← Back to Transfers
        </Link>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="rounded-xl border border-border bg-background p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Location details</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-muted">Origin Facility</dt>
              <dd className="text-foreground">{transfer.from_facility?.name ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Destination Facility</dt>
              <dd className="text-foreground">{transfer.to_facility?.name ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Status</dt>
              <dd>
                <StatusBadge status={transfer.status} colorMap={TRANSFER_STATUS_COLORS} />
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-border bg-background p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Timeline</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-muted">Scheduled Date</dt>
              <dd className="text-foreground">
                {transfer.scheduled_date ? new Date(transfer.scheduled_date).toLocaleDateString() : '—'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Shipped Date</dt>
              <dd className="text-foreground">
                {transfer.shipped_date ? new Date(transfer.shipped_date).toLocaleDateString() : '—'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Received Date</dt>
              <dd className="text-foreground">
                {transfer.received_date ? new Date(transfer.received_date).toLocaleDateString() : '—'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Items ({transfer.items?.length ?? 0})</h3>
        </div>
        {(!transfer.items || transfer.items.length === 0) ? (
          <div className="px-8 py-12 text-center text-sm text-text-secondary">
            No items in this transfer.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Asset</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transfer.items.map((item) => (
                <tr key={item.id} className="hover:bg-bg-secondary/50">
                  <td className="px-6 py-3.5 text-foreground font-medium">{item.assets?.name ?? 'Unknown'}</td>
                  <td className="px-6 py-3.5 text-text-secondary">{item.assets?.category ?? '—'}</td>
                  <td className="px-6 py-3.5 tabular-nums text-foreground">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {transfer.notes && (
        <div className="mt-6 rounded-xl border border-border bg-background p-6">
          <h3 className="text-sm font-semibold text-foreground mb-2">Notes</h3>
          <p className="text-sm text-text-secondary whitespace-pre-wrap">{transfer.notes}</p>
        </div>
      )}
    </>
  );
}
