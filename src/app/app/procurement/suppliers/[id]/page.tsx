import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';

async function getVendor(id: string) {
  const supabase = await createClient();
  const ctx = await resolveCurrentOrg();
  if (!ctx) return null;

  const { data } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', id)
    .eq('organization_id', ctx.organizationId)
    .is('deleted_at', null)
    .single();

  return data;
}

async function getVendorPOs(vendorId: string, orgId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('purchase_orders')
    .select('id, po_number, total_amount, status, issued_date')
    .eq('vendor_id', vendorId)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(20);

  return data ?? [];
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-50 text-green-700',
  inactive: 'bg-bg-secondary text-text-secondary',
  blacklisted: 'bg-red-500/10 text-red-700',
};

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vendor = await getVendor(id);

  if (!vendor) {
    return (
      <TierGate feature="procurement">
        <div className="px-8 py-16 text-center">
          <p className="text-sm text-text-secondary">Supplier not found.</p>
          <Link href="/app/procurement/suppliers" className="mt-4 text-sm text-brand-primary hover:underline">← Back to Suppliers</Link>
        </div>
      </TierGate>
    );
  }

  const pos = await getVendorPOs(id, vendor.organization_id);
  const totalSpend = pos.reduce((s: number, p: { total_amount: number }) => s + (p.total_amount ?? 0), 0);

  return (
    <TierGate feature="procurement">
      <div className="mb-4">
        <Link href="/app/procurement/suppliers" className="text-sm text-brand-primary hover:underline">
          ← Back to Suppliers
        </Link>
      </div>

      <PageHeader title={vendor.name} subtitle={vendor.display_name || vendor.category || 'Vendor'} />

      {/* Status + metadata */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 mb-8">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Status</p>
          <StatusBadge status={vendor.status} colorMap={STATUS_COLORS} />
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Category</p>
          <p className="mt-1 text-sm font-semibold capitalize text-foreground">{vendor.category ?? '—'}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Total POs</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">{pos.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Total Spend</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">{formatCurrency(totalSpend)}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Rating</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{vendor.rating ? `${vendor.rating}/5` : '—'}</p>
        </div>
      </div>

      {/* Contact details */}
      <div className="rounded-xl border border-border bg-background p-6 mb-8">
        <h3 className="text-sm font-semibold text-foreground mb-3">Contact Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-text-muted">Email:</span>
            <p className="text-foreground mt-0.5">{vendor.email ?? '—'}</p>
          </div>
          <div>
            <span className="text-text-muted">Phone:</span>
            <p className="text-foreground mt-0.5">{vendor.phone ?? '—'}</p>
          </div>
          <div>
            <span className="text-text-muted">Website:</span>
            <p className="text-foreground mt-0.5">{vendor.website ? <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">{vendor.website}</a> : '—'}</p>
          </div>
        </div>
      </div>

      {/* Financial details */}
      <div className="rounded-xl border border-border bg-background p-6 mb-8">
        <h3 className="text-sm font-semibold text-foreground mb-3">Financial Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-text-muted">Payment Terms:</span>
            <p className="text-foreground mt-0.5 capitalize">{vendor.payment_terms?.replace('_', ' ') ?? '—'}</p>
          </div>
          <div>
            <span className="text-text-muted">Currency:</span>
            <p className="text-foreground mt-0.5">{vendor.currency ?? 'USD'}</p>
          </div>
          <div>
            <span className="text-text-muted">Tax ID:</span>
            <p className="text-foreground mt-0.5">{vendor.tax_id ?? '—'}</p>
          </div>
          <div>
            <span className="text-text-muted">W-9 on File:</span>
            <p className="text-foreground mt-0.5">{vendor.w9_on_file ? `Yes (${vendor.w9_received_date ? new Date(vendor.w9_received_date).toLocaleDateString() : 'date unknown'})` : 'No'}</p>
          </div>
        </div>
      </div>

      {/* PO History */}
      <div className="rounded-xl border border-border bg-background overflow-hidden mb-8">
        <div className="px-4 py-3 bg-bg-secondary border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Purchase Order History</h3>
        </div>
        {pos.length === 0 ? (
          <div className="px-8 py-12 text-center">
            <p className="text-sm text-text-secondary">No purchase orders with this vendor.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">PO #</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Issued</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pos.map((p: { id: string; po_number: string; total_amount: number; status: string; issued_date: string | null }) => (
                  <tr key={p.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/app/procurement/purchase-orders/${p.id}`} className="font-medium text-foreground hover:underline">{p.po_number}</Link>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{formatCurrency(p.total_amount ?? 0)}</td>
                    <td className="px-4 py-3 text-text-secondary">{p.issued_date ? new Date(p.issued_date).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status ?? 'unknown'} colorMap={{}} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notes */}
      {vendor.notes && (
        <div className="rounded-xl border border-border bg-background p-4 mb-8">
          <p className="text-xs text-text-muted mb-1">Notes</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{vendor.notes}</p>
        </div>
      )}
    </TierGate>
  );
}
