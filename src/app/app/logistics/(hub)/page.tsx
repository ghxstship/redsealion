import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/ui/Card';
import { TierGate } from '@/components/shared/TierGate';
import LogisticsHubTabs from '../LogisticsHubTabs';

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



const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-50 text-green-700',
  deployed: 'bg-blue-50 text-blue-700',
  maintenance: 'bg-red-50 text-red-700',
};

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
          <Card key={facility.name} padding="default" className="p-5">
            <h3 className="text-sm font-medium text-foreground">{facility.name}</h3>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
              {facility.total_items}
            </p>
            <p className="text-xs text-text-muted">total items</p>
            <div className="mt-3 flex gap-4 text-xs">
              <span className="text-green-700">{facility.available} available</span>
              <span className="text-blue-700">{facility.deployed} deployed</span>
            </div>
          </Card>
        ))}
      </div>


      {/* Assets table */}
      <div className="rounded-xl border border-border bg-background overflow-hidden overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Asset</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Qty</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Context</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {assets.map((asset) => (
              <tr key={asset.id} className="transition-colors hover:bg-bg-secondary/50">
                <td className="px-6 py-3.5">
                  <Link
                    href={`/app/equipment/${asset.id}`}
                    className="text-sm font-medium text-foreground hover:underline"
                  >
                    {asset.name}
                  </Link>
                </td>
                <td className="px-6 py-3.5">
                  <span className="inline-flex items-center rounded-full bg-bg-secondary px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                    {asset.category}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-sm text-text-secondary">
                  {asset.location}
                </td>
                <td className="px-6 py-3.5 text-sm tabular-nums text-foreground">
                  {asset.quantity}
                </td>
                <td className="px-6 py-3.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[asset.status] ?? 'bg-bg-secondary text-text-muted'
                    }`}
                  >
                    {formatLabel(asset.status)}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-sm text-text-secondary">
                  <div className="flex flex-col gap-1">
                    <Link href={`/app/equipment/${asset.id}`} className="text-xs font-medium text-blue-600 hover:underline">
                      View asset
                    </Link>
                    {asset.status === 'maintenance' && <span className="text-xs text-red-500 font-medium">Flagged for repair</span>}
                    {asset.status === 'deployed' && <span className="text-xs text-blue-500 font-medium">Currently on assignment</span>}
                  </div>
                </td>
              </tr>
            ))}
            {assets.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-text-muted">No assets in inventory.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
    </TierGate>
  );
}
