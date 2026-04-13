import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/shared/PageHeader';
import { TierGate } from '@/components/shared/TierGate';
import { formatCurrency } from '@/lib/utils';
import StatusBadge, { FABRICATION_STATUS_COLORS } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import BOMEditor from '@/components/fabrication/BOMEditor';
import StatusActions from '@/components/fabrication/StatusActions';
import Link from 'next/link';

export default async function FabricationOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const ctx = await resolveCurrentOrg();
  if (!ctx) return notFound();

  const { data: order } = await supabase
    .from('fabrication_orders')
    .select('*, bill_of_materials(*), shop_floor_logs(*, users(full_name)), events(id, name), proposals(id, name), fabrication_files(*)')
    .eq('id', id)
    .eq('organization_id', ctx.organizationId)
    .single();

  if (!order) return notFound();

  return (
    <TierGate feature="equipment">
      <div className="mb-4">
        <Link href="/app/fabrication" className="text-sm text-text-muted hover:text-foreground mb-2 inline-block">
          &larr; Back to Fabrication Hub
        </Link>
        <PageHeader 
          title={`Order: ${order.order_number}`} 
          subtitle={order.name} 
        >
          <StatusActions orderId={order.id} currentStatus={order.status} />
        </PageHeader>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-background p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Overview</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-text-muted">Status</p>
                <StatusBadge status={order.status} colorMap={FABRICATION_STATUS_COLORS} />
              </div>
              <div>
                <p className="text-text-muted">Priority</p>
                <p className={`font-medium capitalize ${order.priority === 'urgent' ? 'text-red-600' : 'text-foreground'}`}>{order.priority}</p>
              </div>
              <div>
                <p className="text-text-muted">Order Type</p>
                <p className="font-medium capitalize text-foreground">{order.order_type}</p>
              </div>
              <div>
                <p className="text-text-muted">Quantity</p>
                <p className="font-medium text-foreground tabular-nums">{order.quantity}</p>
              </div>
              <div>
                <p className="text-text-muted">Event</p>
                <p className="font-medium text-foreground">{order.events?.name || '—'}</p>
              </div>
              <div>
                <p className="text-text-muted">Due Date</p>
                <p className="font-medium text-foreground">{order.due_date ? new Date(order.due_date).toLocaleDateString() : '—'}</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <h4 className="text-sm font-medium text-foreground mb-2">Cost Breakdown</h4>
              <div className="grid grid-cols-3 gap-4 text-sm tabular-nums">
                <div>
                  <p className="text-text-muted">Material Cost</p>
                  <p className="font-medium">{formatCurrency((order.material_cost_cents || 0) / 100)}</p>
                </div>
                <div>
                  <p className="text-text-muted">Est. Labor Cost</p>
                  <p className="font-medium">{formatCurrency((order.estimated_labor_cents || 0) / 100)}</p>
                </div>
                <div>
                  <p className="text-text-muted">Total Gross Cost</p>
                  <p className="font-bold">{formatCurrency((order.total_cost_cents || 0) / 100)}</p>
                </div>
              </div>
            </div>
            
            {order.notes && (
              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="text-sm font-medium text-foreground mb-2">Notes</h4>
                <p className="text-sm text-text-secondary whitespace-pre-wrap">{order.notes}</p>
              </div>
            )}
          </div>

          <BOMEditor orderId={order.id} initialItems={order.bill_of_materials || []} />
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-background p-6">
            <h3 className="text-md font-semibold text-foreground mb-4">Activity Logs</h3>
            <div className="space-y-4">
              {(order.shop_floor_logs || []).slice(0, 5).map((log: any) => (
                <div key={log.id} className="text-sm border-l-2 border-border pl-3 py-1">
                  <p className="font-medium text-foreground capitalize">{log.action.replace('_', ' ')}</p>
                  <p className="text-xs text-text-muted">{new Date(log.created_at).toLocaleString()}</p>
                  {log.notes && <p className="text-xs text-text-secondary mt-1">{log.notes}</p>}
                </div>
              ))}
              {(!order.shop_floor_logs || order.shop_floor_logs.length === 0) && (
                <p className="text-sm text-text-secondary">No activity logged.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background p-6">
            <h3 className="text-md font-semibold text-foreground mb-4">Files & Proofs</h3>
            <ul className="space-y-2">
              {(order.fabrication_files || []).map((f: any) => (
                <li key={f.id} className="text-sm flex justify-between items-center p-2 rounded bg-bg-secondary">
                  <a href={f.file_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate mr-2">
                    {f.file_type.toUpperCase()} v{f.version}
                  </a>
                  {f.is_approved && <Badge variant="success">Approved</Badge>}
                </li>
              ))}
              {(!order.fabrication_files || order.fabrication_files.length === 0) && (
                <p className="text-sm text-text-secondary">No files attached.</p>
              )}
            </ul>
          </div>
        </div>
      </div>
    </TierGate>
  );
}
