import Link from 'next/link';
import { formatCurrency, statusColor } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import type { AssetStatus, AssetCondition } from '@/types/database';

interface AssetRow {
  id: string;
  name: string;
  type: string;
  status: AssetStatus;
  condition: AssetCondition;
  current_location: { name?: string; address?: string } | null;
  current_value: number | null;
  proposal_id: string;
}

function formatStatus(status: string): string {
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function conditionColor(condition: string): string {
  const map: Record<string, string> = {
    new: 'text-green-700',
    excellent: 'text-green-600',
    good: 'text-blue-600',
    fair: 'text-amber-600',
    poor: 'text-red-600',
    damaged: 'text-red-700',
  };
  return map[condition] ?? 'text-text-muted';
}

const statusFilters: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'deployed', label: 'Deployed' },
  { key: 'in_storage', label: 'In Storage' },
  { key: 'in_production', label: 'In Production' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'planned', label: 'Planned' },
];

async function getAssets() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) return [];

    const { data: assets } = await supabase
      .from('assets')
      .select('id, name, type, status, condition, current_location, current_value, proposal_id')
      .eq('organization_id', userData.organization_id)
      .order('name');

    return (assets ?? []) as AssetRow[];
  } catch {
    return [];
  }
}

export default async function AssetsPage() {
  const assets = await getAssets();

  // Fetch proposal names for display
  const supabase = await createClient();
  const proposalIds = [...new Set(assets.map((a) => a.proposal_id))];
  const proposalMap = new Map<string, string>();
  if (proposalIds.length > 0) {
    const { data: proposals } = await supabase
      .from('proposals')
      .select('id, name')
      .in('id', proposalIds);
    for (const p of proposals ?? []) {
      proposalMap.set(p.id, p.name);
    }
  }

  const totalAssets = assets.length;
  const deployed = assets.filter((a) => a.status === 'deployed').length;
  const inStorage = assets.filter((a) => a.status === 'in_storage').length;
  const totalValue = assets.reduce((sum, a) => sum + (a.current_value ?? 0), 0);

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Asset Inventory
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Track physical assets across projects and storage.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-xl border border-border bg-white px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Total Assets</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{totalAssets}</p>
          <p className="mt-1 text-xs text-text-secondary">{formatCurrency(totalValue)} total value</p>
        </div>
        <div className="rounded-xl border border-border bg-white px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Deployed</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{deployed}</p>
          <p className="mt-1 text-xs text-text-secondary">Currently on-site</p>
        </div>
        <div className="rounded-xl border border-border bg-white px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">In Storage</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{inStorage}</p>
          <p className="mt-1 text-xs text-text-secondary">Available for reuse</p>
        </div>
        <div className="rounded-xl border border-border bg-white px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">In Production</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {assets.filter((a) => a.status === 'in_production').length}
          </p>
          <p className="mt-1 text-xs text-text-secondary">Being fabricated</p>
        </div>
      </div>

      {/* Status filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {statusFilters.map((f, idx) => (
          <button
            key={f.key}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              idx === 0
                ? 'bg-foreground text-white'
                : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {assets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white px-5 py-12 text-center">
          <p className="text-sm text-text-muted">
            No assets yet. Assets are automatically created when proposals enter production.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-secondary">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Condition</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Proposal</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {assets.map((asset) => {
                  const location = asset.current_location as { name?: string } | null;
                  return (
                    <tr key={asset.id} className="transition-colors hover:bg-bg-secondary/50">
                      <td className="px-6 py-3.5">
                        <Link
                          href={`/app/assets/${asset.id}`}
                          className="text-sm font-medium text-foreground hover:underline"
                        >
                          {asset.name}
                        </Link>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-text-secondary">{asset.type}</td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(asset.status)}`}>
                          {formatStatus(asset.status)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`text-sm font-medium capitalize ${conditionColor(asset.condition)}`}>
                          {asset.condition}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-text-secondary">{location?.name ?? '—'}</td>
                      <td className="px-6 py-3.5 text-sm text-text-secondary">{proposalMap.get(asset.proposal_id) ?? '—'}</td>
                      <td className="px-6 py-3.5 text-right text-sm font-medium tabular-nums text-foreground">
                        {formatCurrency(asset.current_value ?? 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
