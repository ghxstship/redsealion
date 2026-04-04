import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import { formatCurrency, statusColor } from '@/lib/utils';
import Link from 'next/link';

interface PoRow {
  id: string;
  poNumber: string;
  vendorName: string;
  description: string | null;
  totalAmount: number;
  status: string;
  issuedDate: string | null;
  dueDate: string | null;
  projectName: string | null;
}

async function getPurchaseOrders(): Promise<PoRow[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();
    if (!userData) return [];

    const { data } = await supabase
      .from('purchase_orders')
      .select('id, po_number, vendor_name, description, total_amount, status, issued_date, due_date, proposal_id')
      .eq('organization_id', userData.organization_id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!data || data.length === 0) return [];

    const proposalIds = [...new Set(data.map((p) => p.proposal_id).filter(Boolean))];
    const { data: proposals } = proposalIds.length > 0
      ? await supabase.from('proposals').select('id, name').in('id', proposalIds)
      : { data: [] };
    const nameMap = new Map((proposals ?? []).map((p) => [p.id, p.name]));

    return data.map((p) => ({
      id: p.id,
      poNumber: p.po_number,
      vendorName: p.vendor_name,
      description: p.description,
      totalAmount: p.total_amount,
      status: p.status,
      issuedDate: p.issued_date,
      dueDate: p.due_date,
      projectName: p.proposal_id ? (nameMap.get(p.proposal_id) ?? null) : null,
    }));
  } catch {
    return [];
  }
}

export default async function PurchaseOrdersPage() {
  const orders = await getPurchaseOrders();
  const totalValue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const openCount = orders.filter((o) => ['draft', 'sent', 'acknowledged'].includes(o.status)).length;

  return (
    <TierGate feature="profitability">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Purchase Orders</h1>
          <p className="mt-1 text-sm text-text-secondary">Manage vendor purchase orders for project procurement.</p>
        </div>
        <Link
          href="/app/finance/purchase-orders/new"
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          New Purchase Order
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-xl border border-border bg-white px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Total POs</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{orders.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-white px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Open</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{openCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-white px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Total Value</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{formatCurrency(totalValue)}</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-border bg-white px-8 py-16 text-center">
          <p className="text-sm text-text-secondary">No purchase orders yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-secondary">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">PO #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((po) => (
                  <tr key={po.id} className="transition-colors hover:bg-bg-secondary/50">
                    <td className="px-6 py-3.5 text-sm font-medium text-foreground">{po.poNumber}</td>
                    <td className="px-6 py-3.5 text-sm text-foreground">{po.vendorName}</td>
                    <td className="px-6 py-3.5 text-sm text-text-secondary">{po.projectName ?? '—'}</td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(po.status)}`}>
                        {po.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right text-sm font-medium tabular-nums text-foreground">
                      {formatCurrency(po.totalAmount)}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-text-secondary">
                      {po.dueDate ? new Date(po.dueDate).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </TierGate>
  );
}
