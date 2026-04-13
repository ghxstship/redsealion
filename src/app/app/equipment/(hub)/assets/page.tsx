import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import type { AssetStatus, AssetCondition } from '@/types/database';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import AssetsTable from '@/components/admin/assets/AssetsTable';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/ui/Card';
import EquipmentHubTabs from '../../EquipmentHubTabs';

import { RoleGate } from '@/components/shared/RoleGate';
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
      location_name: (a.current_location as { name?: string } | null)?.name ?? null,
      proposal_name: a.proposal_id ? (proposalMap.get(a.proposal_id) ?? null) : null,
      current_value: a.current_value,
    }));
  } catch {
    return [];
  }
}

export default async function AssetsPage() {
  const assets = await getAssets();
  const totalValue = assets.reduce((sum, a) => sum + (a.current_value ?? 0), 0);
  const deployed = assets.filter((a) => a.status === 'deployed').length;
  const inStorage = assets.filter((a) => a.status === 'in_storage').length;

  return (
    <RoleGate>
    <>
      <PageHeader
        title="Asset Inventory"
        subtitle="Track physical assets across projects and storage."
      />

      <EquipmentHubTabs />

      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Total Assets</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{assets.length}</p>
          <p className="mt-1 text-xs text-text-secondary">{formatCurrency(totalValue)} total value</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Deployed</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{deployed}</p>
          <p className="mt-1 text-xs text-text-secondary">Currently on-site</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">In Storage</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{inStorage}</p>
          <p className="mt-1 text-xs text-text-secondary">Available for reuse</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">In Production</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{assets.filter((a) => a.status === 'in_production').length}</p>
          <p className="mt-1 text-xs text-text-secondary">Being fabricated</p>
        </Card>
      </div>

      <AssetsTable assets={assets} />
    </>
  </RoleGate>
  );
}
