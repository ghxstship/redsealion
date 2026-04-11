import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import AssetsTable from '@/components/admin/assets/AssetsTable';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';
import { RoleGate } from '@/components/shared/RoleGate';
import { TierGate } from '@/components/shared/TierGate';
import NewAssetButton from './NewAssetButton';
import MetricCard from '@/components/ui/MetricCard';

interface AssetRow {
  id: string;
  name: string;
  type: string;
  status: string;
  condition: string;
  location_name: string | null;
  proposal_name: string | null;
  current_value: number | null;
}

async function getAssets(): Promise<AssetRow[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: assets } = await supabase
      .from('assets')
      .select('id, name, type, status, condition, current_location, current_value, proposal_id')
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .order('name');

    if (!assets || assets.length === 0) return [];

    // Fetch proposal names
    const proposalIds = [...new Set(assets.map((a) => a.proposal_id).filter(Boolean))];
    const proposalMap = new Map<string, string>();
    if (proposalIds.length > 0) {
      const { data: proposals } = await supabase.from('proposals').select('id, name').in('id', proposalIds);
      for (const p of proposals ?? []) proposalMap.set(p.id, p.name);
    }

    return assets.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      status: a.status,
      condition: a.condition,
      location_name: (a.current_location as string | null) ?? null,
      proposal_name: a.proposal_id ? (proposalMap.get(a.proposal_id) ?? null) : null,
      current_value: a.current_value,
    }));
  } catch {
    return [];
  }
}

export default async function AssetsHubPage() {
  const assets = await getAssets();

  // #34: Server-side aggregation — compute stats from the already-fetched list
  // (ideal: DB-level COUNT queries, but this avoids a second round-trip since we
  //  already need the full list for the table below)
  const totalValue = assets.reduce((sum, a) => sum + (a.current_value ?? 0), 0);
  const deployed = assets.filter((a) => a.status === 'deployed').length;
  const inStorage = assets.filter((a) => a.status === 'in_storage').length;
  const inProduction = assets.filter((a) => a.status === 'in_production').length;

  return (
    <RoleGate resource="assets">
    <TierGate feature="assets">
      <PageHeader
        title="Assets"
        subtitle="Track physical assets across projects and storage."
      >
        <NewAssetButton />
      </PageHeader>

      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard label="Total Assets" value={assets.length} sublabel={`${formatCurrency(totalValue)} total value`} />
        <MetricCard label="Deployed" value={deployed} sublabel="Currently on-site" />
        <MetricCard label="In Storage" value={inStorage} sublabel="Available for reuse" />
        <MetricCard label="In Production" value={inProduction} sublabel="Being fabricated" />
      </div>

      <AssetsTable assets={assets} />
    </TierGate>
    </RoleGate>
  );
}
