import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import EquipmentHubTabs from '../../EquipmentHubTabs';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

interface InventoryCount {
  id: string;
  count_type: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  location: string | null;
}

export default async function InventoryPage() {
  const supabase = await createClient();
  const ctx = await resolveCurrentOrg();
  
  let counts: InventoryCount[] = [];
  if (ctx) {
    const { data } = await supabase
      .from('inventory_counts')
      .select('*')
      .eq('organization_id', ctx.organizationId)
      .order('created_at', { ascending: false });
    
    if (data) {
      counts = data.map((c: any) => ({
        id: c.id,
        count_type: c.count_type,
        status: c.status,
        started_at: c.started_at,
        completed_at: c.completed_at,
        location: c.location,
      }));
    }
  }

  const activeCounts = counts.filter(c => c.status === 'in_progress' || c.status === 'planned');

  return (
    <TierGate feature="equipment">
      <PageHeader title="Physical Inventory" subtitle="Manage cycle counts and physical inventory reconciliations.">
        <Button>Initiate Count</Button>
      </PageHeader>
      
      <EquipmentHubTabs />

      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-4">Active & Planned Counts</h2>
          {activeCounts.length > 0 ? (
            <div className="rounded-xl border border-border bg-background overflow-hidden">
              <Table >
                <TableHeader>
                  <TableRow className="border-b border-border bg-bg-secondary text-left text-xs uppercase text-text-muted">
                    <TableHead className="px-6 py-3">Type</TableHead>
                    <TableHead className="px-6 py-3">Location</TableHead>
                    <TableHead className="px-6 py-3">Status</TableHead>
                    <TableHead className="px-6 py-3">Started</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody >
                  {activeCounts.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="px-6 py-4 text-sm capitalize">{c.count_type}</TableCell>
                      <TableCell className="px-6 py-4 text-sm text-text-secondary">{c.location || 'All Locations'}</TableCell>
                      <TableCell className="px-6 py-4 text-sm">
                        <StatusBadge status={c.status} />
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-text-secondary">
                        {c.started_at ? new Date(c.started_at).toLocaleDateString() : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-background p-8 text-center text-sm text-text-secondary">
              No active inventory counts. Initiate a count to begin reconciliation.
            </div>
          )}
        </div>
      </div>
    </TierGate>
  );
}
