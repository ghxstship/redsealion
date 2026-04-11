import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';

async function getReceipt(id: string) {
  const supabase = await createClient();
  const ctx = await resolveCurrentOrg();
  if (!ctx) return null;

  const { data } = await supabase
    .from('goods_receipts')
    .select('*, purchase_orders(id, po_number, vendor_name, vendor_id, total_amount, status, purchase_order_line_items(*)), users!received_by(full_name)')
    .eq('id', id)
    .eq('organization_id', ctx.organizationId)
    .single();

  return data;
}

const STATUS_COLORS: Record<string, string> = {
  partial: 'bg-yellow-50 text-yellow-700',
  complete: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
};

export default async function ReceiptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const receipt = await getReceipt(id);

  if (!receipt) {
    return (
      <TierGate feature="procurement">
        <div className="px-8 py-16 text-center">
          <p className="text-sm text-text-secondary">Receipt not found.</p>
          <Link href="/app/procurement/receiving" className="mt-4 text-sm text-brand-primary hover:underline">← Back to Receiving</Link>
        </div>
      </TierGate>
    );
  }

  const po = receipt.purchase_orders as {
    id: string; po_number: string; vendor_name: string;
    total_amount: number; status: string;
    purchase_order_line_items: Array<{ id: string; description: string; quantity: number; unit_price: number; amount: number; received_quantity: number }>;
  } | null;

  const receiver = (receipt.users as { full_name: string } | null)?.full_name ?? 'Unknown';
  const poLineItems = po?.purchase_order_line_items ?? [];

  return (
    <TierGate feature="procurement">
      <div className="mb-4">
        <Link href="/app/procurement/receiving" className="text-sm text-brand-primary hover:underline">
          ← Back to Receiving
        </Link>
      </div>

      <PageHeader
        title={`Receipt ${receipt.receipt_number || receipt.id.slice(0, 8)}`}
        subtitle={`${po ? `Against PO ${po.po_number}` : 'Goods Receipt'}`}
      />

      {/* Status + metadata */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Status</p>
          <StatusBadge status={receipt.status} colorMap={STATUS_COLORS} />
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">PO Number</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {po ? <Link href={`/app/procurement/purchase-orders/${po.id}`} className="text-brand-primary hover:underline">{po.po_number}</Link> : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Received Date</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {receipt.received_date ? new Date(receipt.received_date).toLocaleDateString() : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Received By</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{receiver}</p>
        </div>
      </div>

      {/* PO Line Items (what was expected) */}
      {poLineItems.length > 0 && (
        <div className="rounded-xl border border-border bg-background overflow-hidden mb-8">
          <div className="px-4 py-3 bg-bg-secondary border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">PO Line Items</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Ordered</th>
                  <th className="px-4 py-3">Received</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {poLineItems.map((li) => {
                  const fulfilled = li.received_quantity >= li.quantity;
                  return (
                    <tr key={li.id} className="hover:bg-bg-secondary/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{li.description}</td>
                      <td className="px-4 py-3 tabular-nums">{li.quantity}</td>
                      <td className="px-4 py-3 tabular-nums">{li.received_quantity}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={fulfilled ? 'complete' : 'pending'} colorMap={{complete: 'bg-green-50 text-green-700', pending: 'bg-yellow-50 text-yellow-700'}} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notes */}
      {receipt.notes && (
        <div className="rounded-xl border border-border bg-background p-4 mb-8">
          <p className="text-xs text-text-muted mb-1">Notes</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{receipt.notes}</p>
        </div>
      )}
    </TierGate>
  );
}
