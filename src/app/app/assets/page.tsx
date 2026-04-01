import Link from 'next/link';
import { formatCurrency, statusColor } from '@/lib/utils';
import type { AssetStatus, AssetCondition } from '@/types/database';

interface MockAsset {
  id: string;
  name: string;
  type: string;
  status: AssetStatus;
  condition: AssetCondition;
  location: string;
  proposal: string;
  current_value: number;
}

const assets: MockAsset[] = [
  {
    id: 'asset_001',
    name: 'LED Video Wall (12x8)',
    type: 'AV Equipment',
    status: 'deployed',
    condition: 'excellent',
    location: 'NYC - Hudson Yards',
    proposal: 'Spotify Wrapped Pop-Up',
    current_value: 45000,
  },
  {
    id: 'asset_002',
    name: 'Custom Nike Swoosh Sculpture',
    type: 'Fabrication',
    status: 'in_production',
    condition: 'new',
    location: 'Long Beach Fab Shop',
    proposal: 'Nike Air Max Experience',
    current_value: 18000,
  },
  {
    id: 'asset_003',
    name: 'Modular Stage Platform (20x30)',
    type: 'Structure',
    status: 'in_storage',
    condition: 'good',
    location: 'LA Warehouse',
    proposal: 'Nike SNKRS Fest 2026',
    current_value: 32000,
  },
  {
    id: 'asset_004',
    name: 'Interactive Touch Kiosks (x4)',
    type: 'Technology',
    status: 'deployed',
    condition: 'good',
    location: 'Cupertino - Apple Store',
    proposal: 'Apple Vision Pro Demo Suite',
    current_value: 24000,
  },
  {
    id: 'asset_005',
    name: 'Branded Vinyl Wraps Set',
    type: 'Graphics',
    status: 'disposed',
    condition: 'poor',
    location: 'Disposed',
    proposal: 'Spotify Listening Lounge',
    current_value: 0,
  },
  {
    id: 'asset_006',
    name: 'Ambient Sound System',
    type: 'AV Equipment',
    status: 'in_storage',
    condition: 'excellent',
    location: 'LA Warehouse',
    proposal: 'Mercedes-Benz EQS Launch',
    current_value: 15000,
  },
  {
    id: 'asset_007',
    name: 'Holographic Display Unit',
    type: 'Technology',
    status: 'in_transit',
    condition: 'new',
    location: 'In transit to Sandy Springs',
    proposal: 'Mercedes-Benz EQS Launch',
    current_value: 28000,
  },
  {
    id: 'asset_008',
    name: 'Custom Signage Package',
    type: 'Graphics',
    status: 'planned',
    condition: 'new',
    location: 'Not yet fabricated',
    proposal: 'Nike Air Max Experience',
    current_value: 8500,
  },
];

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

export default function AssetsPage() {
  const totalAssets = assets.length;
  const deployed = assets.filter((a) => a.status === 'deployed').length;
  const inStorage = assets.filter((a) => a.status === 'in_storage').length;
  const totalValue = assets.reduce((sum, a) => sum + a.current_value, 0);

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
              {assets.map((asset) => (
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
                  <td className="px-6 py-3.5 text-sm text-text-secondary">{asset.location}</td>
                  <td className="px-6 py-3.5 text-sm text-text-secondary">{asset.proposal}</td>
                  <td className="px-6 py-3.5 text-right text-sm font-medium tabular-nums text-foreground">
                    {formatCurrency(asset.current_value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
