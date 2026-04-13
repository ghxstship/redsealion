import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PageHeader from '@/components/shared/PageHeader';
import MetricCard from '@/components/ui/MetricCard';
import StatusBadge, { GENERIC_STATUS_COLORS } from '@/components/ui/StatusBadge';
import { TierGate } from '@/components/shared/TierGate';
import LogisticsHubTabs from '../LogisticsHubTabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

interface WarehouseAsset {
  id: string;
  name: string;
  category: string;
  quantity: number;
  location: string;
  status: string;
}

interface FacilitySummary {
  name: string;
  total_items: number;
  available: number;
  deployed: number;
}





async function getWarehouseData(): Promise<{
  facilities: FacilitySummary[];
  assets: WarehouseAsset[];
}> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('No auth');
const { data: assets } = await supabase
      .from('assets')
      .select()
      .eq('organization_id', ctx.organizationId)
      .order('current_location')
      .order('name');

    if (!assets) throw new Error('No assets');

    const mappedAssets: WarehouseAsset[] = assets.map((a: Record<string, unknown>) => ({
      id: a.id as string,
      name: a.name as string,
      category: (a.category as string) ?? 'Uncategorized',
      quantity: (a.quantity as number) ?? 1,
      location: (a.current_location as string) ?? 'Unknown',
      status: (a.status as string) ?? 'available',
    }));

    // Build facility summaries
    const facilityMap = new Map<string, FacilitySummary>();
    for (const asset of mappedAssets) {
      let fac = facilityMap.get(asset.location);
      if (!fac) {
        fac = { name: asset.location, total_items: 0, available: 0, deployed: 0 };
        facilityMap.set(asset.location, fac);
      }
      fac.total_items += asset.quantity;
      if (asset.status === 'available') fac.available += asset.quantity;
      if (asset.status === 'deployed') fac.deployed += asset.quantity;
    }

    return { facilities: Array.from(facilityMap.values()), assets: mappedAssets };
  } catch {
    return { facilities: [], assets: [] };
  }
}

function formatLabel(s: string): string {
  return s
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default async function WarehousePage() {
  const { facilities, assets } = await getWarehouseData();

  return (
    <TierGate feature="warehouse">
    <>
      {/* Header */}
      <PageHeader
        title="Inventory"
        subtitle={`${facilities.length} facilities · ${assets.length} asset types tracked`}
      />

      <LogisticsHubTabs />

      {/* Facility summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        {facilities.map((facility) => (
          <MetricCard
            key={facility.name}
            label={facility.name}
            value={facility.total_items}
            sublabel="total items"
            trailing={
              <div className="mt-3 flex gap-4 text-xs font-normal">
                <span className="text-green-700">{facility.available} available</span>
                <span className="text-blue-700">{facility.deployed} deployed</span>
              </div>
            }
          />
        ))}
      </div>


      {/* Assets table */}
      <div className="rounded-xl border border-border bg-background overflow-hidden overflow-x-auto">
        <Table >
          <TableHeader>
            <TableRow className="border-b border-border bg-bg-secondary">
              <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Asset</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Category</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Location</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Qty</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Context</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody >
            {assets.map((asset) => (
              <TableRow key={asset.id} className="transition-colors hover:bg-bg-secondary/50">
                <TableCell className="px-6 py-3.5">
                  <Link
                    href={`/app/equipment/${asset.id}`}
                    className="text-sm font-medium text-foreground hover:underline"
                  >
                    {asset.name}
                  </Link>
                </TableCell>
                <TableCell className="px-6 py-3.5">
                  <Badge variant="muted">
                    {asset.category}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-3.5 text-sm text-text-secondary">
                  {asset.location}
                </TableCell>
                <TableCell className="px-6 py-3.5 text-sm tabular-nums text-foreground">
                  {asset.quantity}
                </TableCell>
                <TableCell className="px-6 py-3.5">
                  <StatusBadge status={asset.status} colorMap={GENERIC_STATUS_COLORS} />
                </TableCell>
                <TableCell className="px-6 py-3.5 text-sm text-text-secondary">
                  <div className="flex flex-col gap-1">
                    <Link href={`/app/equipment/${asset.id}`} className="text-xs font-medium text-blue-600 hover:underline">
                      View asset
                    </Link>
                    {asset.status === 'maintenance' && <span className="text-xs text-red-500 font-medium">Flagged for repair</span>}
                    {asset.status === 'deployed' && <span className="text-xs text-blue-500 font-medium">Currently on assignment</span>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {assets.length === 0 && (
              <TableRow><TableCell colSpan={5} className="px-6 py-12 text-center text-sm text-text-muted">No assets in inventory.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
    </TierGate>
  );
}
