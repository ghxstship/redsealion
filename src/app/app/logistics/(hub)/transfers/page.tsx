import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge, { TRANSFER_STATUS_COLORS } from '@/components/ui/StatusBadge';
import TransfersHeader from '@/components/admin/warehouse/TransfersHeader';
import LogisticsHubTabs from "../../LogisticsHubTabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

import { RoleGate } from '@/components/shared/RoleGate';
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

async function getTransfers(): Promise<Transfer[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    
    // Also fetch facilities and users to resolve names
    const [{ data: transfers }, { data: facilities }, { data: users }] = await Promise.all([
      supabase
        .from('warehouse_transfers')
        .select(`*, warehouse_transfer_items(count)`)
        .eq('organization_id', ctx.organizationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
      supabase.from('facilities').select('id, name').eq('organization_id', ctx.organizationId),
      supabase.from('users').select('id, full_name')
    ]);

    if (!transfers) throw new Error('No transfers');

    const facilityMap = new Map((facilities ?? []).map((f) => [f.id, f.name]));
    const userMap = new Map((users ?? []).map((u) => [u.id, u.full_name]));

    return transfers.map((t: Record<string, unknown>) => {
      const itemsCount = Array.isArray(t.warehouse_transfer_items) 
         ? t.warehouse_transfer_items.reduce((sum, i) => sum + (i.count ?? 0), 0)
         : (t.warehouse_transfer_items as any)?.count ?? 0;
         
      return {
        id: t.id as string,
        from_location: facilityMap.get(t.from_facility_id as string) || (t.from_facility_id as string) || 'Unknown',
        to_location: facilityMap.get(t.to_facility_id as string) || (t.to_facility_id as string) || 'Unknown',
        items_count: itemsCount,
        status: (t.status as string) ?? 'pending',
        requested_by: userMap.get(t.initiated_by as string) || (t.initiated_by as string) || 'Unknown',
        requested_date: (t.created_at as string) || new Date().toISOString(),
        completed_date: (t.received_at as string) ?? null,
        notes: (t.notes as string) ?? null,
      };
    });
  } catch {
    return [];
  }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatLabel(s: string): string {
  return s
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default async function TransfersPage() {
  const transfers = await getTransfers();

  const pending = transfers.filter((t) => t.status !== 'received' && t.status !== 'cancelled').length;
  const completed = transfers.filter((t) => t.status === 'received').length;

  return (
    <RoleGate>
    <>
      {/* Header */}
      <PageHeader
        title="Transfers"
        subtitle={`${pending} pending · ${completed} received`}
      >
        <TransfersHeader />
      </PageHeader>
      
      <LogisticsHubTabs />

      {/* Transfers table */}
      <div className="rounded-xl border border-border bg-background overflow-hidden overflow-x-auto mt-6">
        {transfers.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-text-muted">
            No transfers found.
          </div>
        ) : (
          <Table >
            <TableHeader>
              <TableRow className="border-b border-border bg-bg-secondary">
                <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">From</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">To</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Items</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Initiated By</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Created</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Received</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody >
              {transfers.map((transfer) => (
                <TableRow key={transfer.id} className="transition-colors hover:bg-bg-secondary/50 relative group">
                  <TableCell className="px-6 py-3.5 text-sm font-medium text-foreground">
                    <Link href={`/app/logistics/transfers/${transfer.id}`} className="absolute inset-0 z-0" aria-label={`View transfer ${transfer.id}`}></Link>
                    <span className="relative z-10">{transfer.from_location}</span>
                  </TableCell>
                  <TableCell className="px-6 py-3.5 text-sm font-medium text-foreground relative z-10">{transfer.to_location}</TableCell>
                  <TableCell className="px-6 py-3.5 text-sm tabular-nums text-foreground relative z-10">{transfer.items_count}</TableCell>
                  <TableCell className="px-6 py-3.5 relative z-10">
                    <StatusBadge status={transfer.status} colorMap={TRANSFER_STATUS_COLORS} />
                  </TableCell>
                  <TableCell className="px-6 py-3.5 text-sm text-text-secondary relative z-10">{transfer.requested_by}</TableCell>
                  <TableCell className="px-6 py-3.5 text-sm text-text-secondary relative z-10">{formatDate(transfer.requested_date)}</TableCell>
                  <TableCell className="px-6 py-3.5 text-sm text-text-secondary relative z-10">
                    {transfer.completed_date ? formatDate(transfer.completed_date) : '\u2014'}
                  </TableCell>
                  <TableCell className="px-6 py-3.5 text-sm text-text-muted max-w-xs truncate relative z-10">{transfer.notes ?? '\u2014'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  </RoleGate>
  );
}
