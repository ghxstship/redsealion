import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import TransfersHeader from '@/components/admin/warehouse/TransfersHeader';
import WarehouseHubTabs from '../../WarehouseHubTabs';

interface Transfer {
  id: string;
  from_location: string;
  to_location: string;
  items_count: number;
  status: string;
  requested_by: string;
  requested_date: string;
  completed_date: string | null;
  notes: string | null;
}

const fallbackTransfers: Transfer[] = [
  { id: 'xfr_001', from_location: 'Warehouse A', to_location: 'Convention Center Hall A', items_count: 32, status: 'in_transit', requested_by: 'Morgan Chen', requested_date: '2026-04-10', completed_date: null, notes: 'Nike SNKRS Fest load-in equipment' },
  { id: 'xfr_002', from_location: 'Warehouse B', to_location: 'Warehouse A', items_count: 8, status: 'pending', requested_by: 'Alex Rivera', requested_date: '2026-04-12', completed_date: null, notes: 'Consolidating rigging gear before Samsung event' },
  { id: 'xfr_003', from_location: 'Barclays Center', to_location: 'Warehouse A', items_count: 48, status: 'completed', requested_by: 'Sam Patel', requested_date: '2026-03-25', completed_date: '2026-03-27', notes: 'LED wall return from previous event' },
  { id: 'xfr_004', from_location: 'Warehouse A', to_location: 'Remote Storage C', items_count: 15, status: 'completed', requested_by: 'Taylor Brooks', requested_date: '2026-03-18', completed_date: '2026-03-19', notes: 'Seasonal storage of winter event decor' },
  { id: 'xfr_005', from_location: 'Remote Storage C', to_location: 'Warehouse B', items_count: 6, status: 'pending', requested_by: 'Jordan Lee', requested_date: '2026-04-14', completed_date: null, notes: 'Retrieving festival sound gear' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  in_transit: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

async function getTransfers(): Promise<Transfer[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('No auth');
const { data: transfers } = await supabase
      .from('warehouse_transfers')
      .select()
      .eq('organization_id', ctx.organizationId)
      .order('requested_date', { ascending: false });

    if (!transfers || transfers.length === 0) throw new Error('No transfers');

    return transfers.map((t: Record<string, unknown>) => ({
      id: t.id as string,
      from_location: t.from_location as string,
      to_location: t.to_location as string,
      items_count: (t.items_count as number) ?? 0,
      status: (t.status as string) ?? 'pending',
      requested_by: (t.requested_by as string) ?? 'Unknown',
      requested_date: t.requested_date as string,
      completed_date: (t.completed_date as string) ?? null,
      notes: (t.notes as string) ?? null,
    }));
  } catch {
    return fallbackTransfers;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatLabel(s: string): string {
  return s
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default async function TransfersPage() {
  const transfers = await getTransfers();

  const pending = transfers.filter((t) => t.status !== 'completed' && t.status !== 'cancelled').length;
  const completed = transfers.filter((t) => t.status === 'completed').length;

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Transfers
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {pending} pending &middot; {completed} completed
          </p>
        </div>
        <div className="flex gap-3">
          <TransfersHeader />
        </div>
      </div>

      {/* Transfers table */}
      <div className="rounded-xl border border-border bg-white overflow-hidden overflow-x-auto">
        {transfers.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-text-muted">
            No transfers found.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-secondary">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">From</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">To</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Requested By</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Requested</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Completed</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transfers.map((transfer) => (
                <tr key={transfer.id} className="transition-colors hover:bg-bg-secondary/50">
                  <td className="px-6 py-3.5 text-sm font-medium text-foreground">{transfer.from_location}</td>
                  <td className="px-6 py-3.5 text-sm font-medium text-foreground">{transfer.to_location}</td>
                  <td className="px-6 py-3.5 text-sm tabular-nums text-foreground">{transfer.items_count}</td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_COLORS[transfer.status] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {formatLabel(transfer.status)}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-text-secondary">{transfer.requested_by}</td>
                  <td className="px-6 py-3.5 text-sm text-text-secondary">{formatDate(transfer.requested_date)}</td>
                  <td className="px-6 py-3.5 text-sm text-text-secondary">
                    {transfer.completed_date ? formatDate(transfer.completed_date) : '\u2014'}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-text-muted max-w-xs truncate">{transfer.notes ?? '\u2014'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
