import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency , formatDate } from '@/lib/utils';
import Link from 'next/link';
import RequisitionActions from './RequisitionActions';
import StatusBadge from '@/components/ui/StatusBadge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

async function getRequisition(id: string) {
  const supabase = await createClient();
  const ctx = await resolveCurrentOrg();
  if (!ctx) return null;

  const { data } = await supabase
    .from('purchase_requisitions')
    .select('*, requisition_line_items(*, vendors(id, name)), users!requested_by(full_name)')
    .eq('id', id)
    .eq('organization_id', ctx.organizationId)
    .single();

  return data;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-bg-secondary text-text-secondary',
  submitted: 'bg-yellow-50 text-yellow-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-500/10 text-red-700',
  ordered: 'bg-blue-50 text-blue-700',
};

export default async function RequisitionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const req = await getRequisition(id);

  if (!req) {
    return (
      <TierGate feature="procurement">
        <div className="px-8 py-16 text-center">
          <p className="text-sm text-text-secondary">Requisition not found.</p>
          <Link href="/app/procurement/requisitions" className="mt-4 text-sm text-brand-primary hover:underline">← Back to Requisitions</Link>
        </div>
      </TierGate>
    );
  }

  const lineItems = (req.requisition_line_items ?? []) as Array<{
    id: string; description: string; quantity: number; unit_cost_cents: number;
    status: string; vendor_id: string | null; vendors: { id: string; name: string } | null;
  }>;

  const requester = (req.users as { full_name: string } | null)?.full_name ?? 'Unknown';

  return (
    <TierGate feature="procurement">
      <div className="mb-4">
        <Link href="/app/procurement/requisitions" className="text-sm text-brand-primary hover:underline">
          ← Back to Requisitions
        </Link>
      </div>

      <PageHeader
        title={`Requisition ${req.requisition_number}`}
        subtitle={`Submitted by ${requester}`}
      />

      {/* Status + metadata */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 mb-8">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Status</p>
          <StatusBadge status={req.status} colorMap={STATUS_COLORS} />
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Priority</p>
          <p className="mt-1 text-sm font-semibold capitalize text-foreground">{req.priority}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Needed By</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {req.needed_by ? formatDate(req.needed_by) : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Total Value</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
            {formatCurrency((req.total_cents ?? 0) / 100)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Line Items</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{lineItems.length}</p>
        </div>
      </div>

      {/* Notes */}
      {req.notes && (
        <div className="rounded-xl border border-border bg-background p-4 mb-8">
          <p className="text-xs text-text-muted mb-1">Notes</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{req.notes}</p>
        </div>
      )}

      {/* Line Items Table */}
      <div className="rounded-xl border border-border bg-background overflow-hidden mb-8">
        <div className="px-4 py-3 bg-bg-secondary border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Line Items</h3>
        </div>
        {lineItems.length === 0 ? (
          <div className="px-8 py-12 text-center">
            <p className="text-sm text-text-secondary">No line items added to this requisition.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table >
              <TableHeader >
                <TableRow>
                  <TableHead className="px-4 py-3">Description</TableHead>
                  <TableHead className="px-4 py-3">Vendor</TableHead>
                  <TableHead className="px-4 py-3">Qty</TableHead>
                  <TableHead className="px-4 py-3">Unit Cost</TableHead>
                  <TableHead className="px-4 py-3">Total</TableHead>
                  <TableHead className="px-4 py-3">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody >
                {lineItems.map((li) => (
                  <TableRow key={li.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <TableCell className="px-4 py-3 font-medium text-foreground">{li.description}</TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{li.vendors?.name ?? '—'}</TableCell>
                    <TableCell className="px-4 py-3 tabular-nums">{li.quantity}</TableCell>
                    <TableCell className="px-4 py-3 tabular-nums">{formatCurrency(li.unit_cost_cents / 100)}</TableCell>
                    <TableCell className="px-4 py-3 tabular-nums font-medium">{formatCurrency((li.quantity * li.unit_cost_cents) / 100)}</TableCell>
                    <TableCell className="px-4 py-3">
                      <StatusBadge status={li.status} colorMap={{}} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Actions */}
      <RequisitionActions id={req.id} status={req.status} />
    </TierGate>
  );
}
