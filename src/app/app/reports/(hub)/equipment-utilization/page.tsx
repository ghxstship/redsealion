import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import ReportsHubTabs from '../../ReportsHubTabs';
import MetricGrid from '@/components/admin/reports/MetricGrid';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Download } from 'lucide-react';

interface EquipRow {
  name: string;
  category: string;
  status: string;
  location: string | null;
  condition: string | null;
  utilizationPct: number;
}

async function getEquipUtilData(): Promise<{
  items: EquipRow[];
  totalAssets: number;
  deployed: number;
  inStorage: number;
  avgUtilization: number;
}> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');

    const { data: assets } = await supabase
      .from('assets')
      .select('name, category, status, current_location, condition')
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .order('category')
      .order('name');

    if (!assets || assets.length === 0) {
      return { items: [], totalAssets: 0, deployed: 0, inStorage: 0, avgUtilization: 0 };
    }

    const items: EquipRow[] = (assets as Array<Record<string, unknown>>).map((a) => {
      const status = (a.status as string) ?? 'in_storage';
      return {
        name: (a.name as string) ?? '',
        category: (a.category as string) ?? 'Uncategorized',
        status,
        location: (a.current_location as string) ?? null,
        condition: (a.condition as string) ?? null,
        utilizationPct: ['deployed', 'in_transit', 'in_production'].includes(status) ? 100 : 0,
      };
    });

    const deployed = items.filter((i) => ['deployed', 'in_transit', 'in_production'].includes(i.status)).length;
    const inStorage = items.filter((i) => i.status === 'in_storage').length;
    const avgUtilization = items.length > 0 ? Math.round((deployed / items.length) * 100) : 0;

    return { items, totalAssets: items.length, deployed, inStorage, avgUtilization };
  } catch {
    return { items: [], totalAssets: 0, deployed: 0, inStorage: 0, avgUtilization: 0 };
  }
}

function statusBadge(status: string) {
  switch (status) {
    case 'deployed': return <Badge variant="success">Deployed</Badge>;
    case 'in_transit': return <Badge variant="warning">In Transit</Badge>;
    case 'in_production': return <Badge variant="warning">In Production</Badge>;
    case 'in_storage': return <Badge variant="muted">In Storage</Badge>;
    case 'retired': return <Badge variant="error">Retired</Badge>;
    default: return <Badge variant="muted">{status.replace(/_/g, ' ')}</Badge>;
  }
}

export default async function EquipmentUtilizationPage() {
  const data = await getEquipUtilData();

  return (
    <TierGate feature="equipment">
      <nav className="mb-6 flex items-center gap-2 text-sm text-text-muted">
        <Link href="/app/reports" className="hover:text-foreground transition-colors">Reports</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Equipment Utilization</span>
      </nav>

      <div className="flex items-center justify-between mb-2">
        <PageHeader title="Equipment Utilization" subtitle="Asset deployment and idle analysis" />
        <Link href="/api/documents/equipment-manifest">
          <Button variant="secondary" size="sm">
            <Download size={14} className="mr-1.5" />
            Export Manifest
          </Button>
        </Link>
      </div>

      <ReportsHubTabs />

      <MetricGrid
        metrics={[
          { label: 'Total Assets', value: String(data.totalAssets) },
          { label: 'Deployed', value: String(data.deployed), changeType: 'positive' },
          { label: 'In Storage', value: String(data.inStorage) },
          { label: 'Utilization', value: `${data.avgUtilization}%`, changeType: data.avgUtilization >= 50 ? 'positive' : 'negative' },
        ]}
      />

      {/* Category breakdown bar */}
      {data.items.length > 0 && (
        <div className="mt-8 rounded-xl border border-border bg-background px-6 py-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Utilization by Category</h3>
          {(() => {
            const catMap = new Map<string, { deployed: number; total: number }>();
            for (const item of data.items) {
              const existing = catMap.get(item.category) ?? { deployed: 0, total: 0 };
              existing.total += 1;
              if (['deployed', 'in_transit', 'in_production'].includes(item.status)) existing.deployed += 1;
              catMap.set(item.category, existing);
            }
            return Array.from(catMap.entries())
              .sort((a, b) => b[1].total - a[1].total)
              .map(([cat, d]) => {
                const pct = d.total > 0 ? Math.round((d.deployed / d.total) * 100) : 0;
                return (
                  <div key={cat} className="flex items-center gap-4 mb-3">
                    <span className="text-sm text-text-secondary w-32 truncate">{cat}</span>
                    <div className="flex-1 h-2 rounded-full bg-bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-text-muted w-16 text-right">{pct}% ({d.deployed}/{d.total})</span>
                  </div>
                );
              });
          })()}
        </div>
      )}

      {data.items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-background px-8 py-16 text-center">
          <p className="text-sm text-text-secondary">No equipment data available.</p>
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-border bg-background overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-bg-secondary">
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Name</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Category</TableHead>
                  <TableHead className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-text-muted">Status</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Location</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Condition</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item, idx) => (
                  <TableRow key={`${item.name}-${idx}`} className="transition-colors hover:bg-bg-secondary/50">
                    <TableCell className="px-6 py-3.5 text-sm font-medium text-foreground">{item.name}</TableCell>
                    <TableCell className="px-6 py-3.5 text-sm text-text-secondary">{item.category}</TableCell>
                    <TableCell className="px-6 py-3.5 text-center">{statusBadge(item.status)}</TableCell>
                    <TableCell className="px-6 py-3.5 text-sm text-text-secondary">{item.location ?? '\u2014'}</TableCell>
                    <TableCell className="px-6 py-3.5 text-sm text-text-secondary capitalize">{item.condition?.replace(/_/g, ' ') ?? '\u2014'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </TierGate>
  );
}
