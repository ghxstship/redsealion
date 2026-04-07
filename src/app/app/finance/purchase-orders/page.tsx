import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import { formatCurrency } from '@/lib/utils';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import Button from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import PurchaseOrdersTableClient from '@/components/admin/finance/PurchaseOrdersTableClient';

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
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');

    const { data } = await supabase
      .from('purchase_orders')
      .select('id, po_number, vendor_name, description, total_amount, status, issued_date, due_date, proposal_id')
      .eq('organization_id', ctx.organizationId)
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
        <Button href="/app/finance/purchase-orders/new">
          <Plus className="h-4 w-4" />
          New Purchase Order
        </Button>
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

      <PurchaseOrdersTableClient orders={orders} />
    </TierGate>
  );
}


