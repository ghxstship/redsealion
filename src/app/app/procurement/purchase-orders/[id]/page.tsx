import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';

async function getPurchaseOrder(id: string) {
  const supabase = await createClient();
  const ctx = await resolveCurrentOrg();
  if (!ctx) return null;

  const { data } = await supabase
    .from('purchase_orders')
    .select('*, purchase_order_line_items(*), vendors(id, name, email, phone)')
    .eq('id', id)
    .eq('organization_id', ctx.organizationId)
    .is('deleted_at', null)
    .single();

  return data;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-bg-secondary text-text-secondary',
  sent: 'bg-blue-50 text-blue-700',
  acknowledged: 'bg-purple-50 text-purple-700',
  approved: 'bg-indigo-50 text-indigo-700',
  partially_received: 'bg-yellow-50 text-yellow-700',
  received: 'bg-green-50 text-green-700',
  closed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-50 text-red-700',
};

export default async function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const po = await getPurchaseOrder(id);

  if (!po) {
    return (
      <TierGate feature="procurement">
        <div className="px-8 py-16 text-center">
          <p className="text-sm text-text-secondary">Purchase order not found.</p>
          <Link href="/app/procurement/purchase-orders" className="mt-4 text-sm text-brand-primary hover:underline">← Back to Purchase Orders</Link>
        </div>
      </TierGate>
    );
  }

  const lineItems = (po.purchase_order_line_items ?? []) as Array<{
    id: string; description: string; quantity: number; unit_price: number;
    amount: number; received_quantity: number;
  }>;

  const vendor = po.vendors as { id: string; name: string; email: string | null; phone: string | null } | null;

  return (
    <TierGate feature="procurement">
      <div className="mb-4">
        <Link href="/app/procurement/purchase-orders" className="text-sm text-brand-primary hover:underline">
          ← Back to Purchase Orders
        </Link>
      </div>

      <PageHeader title={`PO ${po.po_number}`} subtitle={po.description || `Vendor: ${po.vendor_name}`} />

      {/* Status + metadata */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 mb-8">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Status</p>
          <StatusBadge status={po.status} colorMap={STATUS_COLORS} />
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Vendor</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{vendor?.name ?? po.vendor_name}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Total Amount</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
            {formatCurrency(po.total_amount ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Issued</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {po.issued_date ? new Date(po.issued_date).toLocaleDateString() : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Due</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {po.due_date ? new Date(po.due_date).toLocaleDateString() : '—'}
          </p>
        </div>
      </div>

      {/* Vendor info card */}
      {vendor && (
        <div className="rounded-xl border border-border bg-background p-4 mb-8">
          <h3 className="text-sm font-semibold text-foreground mb-2">Vendor Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div><span className="text-text-muted">Name:</span> <span className="text-foreground">{vendor.name}</span></div>
            <div><span className="text-text-muted">Email:</span> <span className="text-foreground">{vendor.email ?? '—'}</span></div>
            <div><span className="text-text-muted">Phone:</span> <span className="text-foreground">{vendor.phone ?? '—'}</span></div>
          </div>
        </div>
      )}

      {/* Line Items Table */}
      <div className="rounded-xl border border-border bg-background overflow-hidden mb-8">
        <div className="px-4 py-3 bg-bg-secondary border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Line Items</h3>
        </div>
        {lineItems.length === 0 ? (
          <div className="px-8 py-12 text-center">
            <p className="text-sm text-text-secondary">No line items on this purchase order.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Unit Price</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Received</th>
                  <th className="px-4 py-3">Fulfillment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lineItems.map((li) => {
                  const pct = li.quantity > 0 ? Math.round((li.received_quantity / li.quantity) * 100) : 0;
                  return (
                    <tr key={li.id} className="hover:bg-bg-secondary/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{li.description}</td>
                      <td className="px-4 py-3 tabular-nums">{li.quantity}</td>
                      <td className="px-4 py-3 tabular-nums">{formatCurrency(li.unit_price)}</td>
                      <td className="px-4 py-3 tabular-nums font-medium">{formatCurrency(li.amount)}</td>
                      <td className="px-4 py-3 tabular-nums">{li.received_quantity} / {li.quantity}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-bg-secondary overflow-hidden">
                            <div
                              className={`h-full rounded-full ${pct >= 100 ? 'bg-green-500' : pct > 0 ? 'bg-yellow-500' : 'bg-bg-secondary'}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-text-muted tabular-nums">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Description */}
      {po.description && (
        <div className="rounded-xl border border-border bg-background p-4 mb-8">
          <p className="text-xs text-text-muted mb-1">Description</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{po.description}</p>
        </div>
      )}
    </TierGate>
  );
}
