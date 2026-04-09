import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { formatCurrency } from '@/lib/utils';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/ui/Card';
import Link from 'next/link';

interface PODetail {
  id: string;
  po_number: string;
  vendor_name: string;
  vendor_id: string | null;
  description: string | null;
  total_amount: number;
  status: string;
  issued_date: string | null;
  due_date: string | null;
  created_at: string;
  proposal_name: string | null;
}

async function getPODetail(id: string): Promise<PODetail | null> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return null;

    const { data: po } = await supabase
      .from('purchase_orders')
      .select('*, proposals(name)')
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .single();

    if (!po) return null;

    return {
      id: po.id as string,
      po_number: po.po_number as string,
      vendor_name: po.vendor_name as string,
      vendor_id: po.vendor_id as string | null,
      description: po.description as string | null,
      total_amount: po.total_amount as number,
      status: po.status as string,
      issued_date: po.issued_date as string | null,
      due_date: po.due_date as string | null,
      created_at: po.created_at as string,
      proposal_name: (po.proposals as Record<string, string>)?.name ?? null,
    };
  } catch {
    return null;
  }
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  acknowledged: 'bg-purple-100 text-purple-800',
  approved: 'bg-green-100 text-green-800',
  received: 'bg-teal-100 text-teal-800',
  closed: 'bg-gray-200 text-gray-600',
  cancelled: 'bg-red-100 text-red-800',
};

export default async function PurchaseOrderDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const po = await getPODetail(id);

  if (!po) {
    return (
      <div className="rounded-xl border border-border bg-background px-8 py-16 text-center">
        <p className="text-sm text-text-secondary">Purchase order not found.</p>
        <Link href="/app/finance/purchase-orders" className="mt-4 text-sm text-brand-primary hover:underline">
          ← Back to Purchase Orders
        </Link>
      </div>
    );
  }

  return (
    <TierGate feature="profitability">
      <PageHeader
        title={po.po_number}
        subtitle={`Purchase order for ${po.vendor_name}`}
      >
        <Link
          href="/app/finance/purchase-orders"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-bg-secondary transition-colors"
        >
          ← Back
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Total Amount</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{formatCurrency(po.total_amount)}</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Status</p>
          <p className="mt-2">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[po.status] ?? 'bg-gray-100 text-gray-800'}`}>
              {po.status}
            </span>
          </p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Vendor</p>
          <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">{po.vendor_name}</p>
        </Card>
      </div>

      <div className="rounded-xl border border-border bg-background divide-y divide-border">
        <div className="px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">Details</h2>
        </div>
        <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Description</p>
            <p className="mt-1 text-sm text-foreground">{po.description ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Project</p>
            <p className="mt-1 text-sm text-foreground">{po.proposal_name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Issued Date</p>
            <p className="mt-1 text-sm text-foreground">{po.issued_date ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Due Date</p>
            <p className="mt-1 text-sm text-foreground">{po.due_date ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Created</p>
            <p className="mt-1 text-sm text-foreground">{new Date(po.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </TierGate>
  );
}
