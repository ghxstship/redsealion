import Link from 'next/link';
import { formatCurrency, statusColor } from '@/lib/utils';

const assetsData: Record<string, {
  name: string;
  type: string;
  category: string;
  status: string;
  condition: string;
  description: string;
  dimensions: string;
  weight: string;
  material: string;
  acquisition_cost: number;
  current_value: number;
  barcode: string;
  deployment_count: number;
  max_deployments: number | null;
  reusable: boolean;
  storage_requirements: string;
  proposal: string;
  location_history: Array<{
    id: string;
    location: string;
    moved_at: string;
    condition: string;
    notes: string;
  }>;
  photos: string[];
}> = {
  asset_001: {
    name: 'LED Video Wall (12x8)',
    type: 'AV Equipment',
    category: 'Technology',
    status: 'deployed',
    condition: 'excellent',
    description: 'High-resolution LED video wall panel array, 12ft wide by 8ft tall. 2.5mm pixel pitch, indoor rated.',
    dimensions: '12ft x 8ft x 6in',
    weight: '420 lbs',
    material: 'Aluminum frame, LED panels',
    acquisition_cost: 52000,
    current_value: 45000,
    barcode: 'XPB-AV-2025-001',
    deployment_count: 3,
    max_deployments: null,
    reusable: true,
    storage_requirements: 'Climate controlled, upright storage, anti-static covers',
    proposal: 'Spotify Wrapped Pop-Up',
    location_history: [
      { id: 'lh_01', location: 'NYC - Hudson Yards', moved_at: '2026-03-01T00:00:00Z', condition: 'excellent', notes: 'Deployed for Spotify Wrapped activation' },
      { id: 'lh_02', location: 'LA Warehouse', moved_at: '2026-01-15T00:00:00Z', condition: 'excellent', notes: 'Returned from SNKRS Fest, full inspection passed' },
      { id: 'lh_03', location: 'LA Convention Center', moved_at: '2025-11-20T00:00:00Z', condition: 'excellent', notes: 'Deployed for Nike SNKRS Fest' },
      { id: 'lh_04', location: 'LA Warehouse', moved_at: '2025-09-01T00:00:00Z', condition: 'new', notes: 'Initial delivery and setup from manufacturer' },
    ],
    photos: [],
  },
};

const defaultAsset = assetsData.asset_001;

function formatStatus(status: string): string {
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function conditionColor(condition: string): string {
  const map: Record<string, string> = {
    new: 'bg-green-50 text-green-700',
    excellent: 'bg-green-50 text-green-700',
    good: 'bg-blue-50 text-blue-700',
    fair: 'bg-amber-50 text-amber-700',
    poor: 'bg-red-50 text-red-700',
    damaged: 'bg-red-100 text-red-800',
  };
  return map[condition] ?? 'bg-gray-100 text-gray-700';
}

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const asset = assetsData[id] ?? defaultAsset;

  return (
    <>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-text-muted">
        <Link href="/app/assets" className="hover:text-foreground transition-colors">
          Assets
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">{asset.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {asset.name}
            </h1>
            <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(asset.status)}`}>
              {formatStatus(asset.status)}
            </span>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            {asset.type} &middot; {asset.category} &middot; {asset.barcode}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary">
            Edit Asset
          </button>
          <button className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-foreground/90">
            Move Asset
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Info cards */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Details */}
          <div className="rounded-xl border border-border bg-white px-6 py-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Details</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-text-muted">Description</dt>
                <dd className="text-sm text-foreground text-right max-w-xs">{asset.description}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <dt className="text-sm text-text-muted">Dimensions</dt>
                <dd className="text-sm text-foreground">{asset.dimensions}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <dt className="text-sm text-text-muted">Weight</dt>
                <dd className="text-sm text-foreground">{asset.weight}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <dt className="text-sm text-text-muted">Material</dt>
                <dd className="text-sm text-foreground">{asset.material}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <dt className="text-sm text-text-muted">Storage</dt>
                <dd className="text-sm text-foreground text-right max-w-xs">{asset.storage_requirements}</dd>
              </div>
            </dl>
          </div>

          {/* Lifecycle */}
          <div className="rounded-xl border border-border bg-white px-6 py-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Lifecycle</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-text-muted">Condition</dt>
                <dd>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${conditionColor(asset.condition)}`}>
                    {asset.condition}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <dt className="text-sm text-text-muted">Acquisition Cost</dt>
                <dd className="text-sm font-medium text-foreground tabular-nums">{formatCurrency(asset.acquisition_cost)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <dt className="text-sm text-text-muted">Current Value</dt>
                <dd className="text-sm font-medium text-foreground tabular-nums">{formatCurrency(asset.current_value)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <dt className="text-sm text-text-muted">Deployments</dt>
                <dd className="text-sm text-foreground">
                  {asset.deployment_count}{asset.max_deployments ? ` / ${asset.max_deployments}` : ''}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <dt className="text-sm text-text-muted">Reusable</dt>
                <dd className="text-sm text-foreground">{asset.reusable ? 'Yes' : 'No'}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <dt className="text-sm text-text-muted">Current Proposal</dt>
                <dd className="text-sm text-foreground">{asset.proposal}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Photos */}
        <div className="rounded-xl border border-border bg-white px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Photos</h2>
            <button className="text-xs font-medium text-text-muted hover:text-foreground transition-colors">
              + Upload Photo
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-lg bg-bg-tertiary flex items-center justify-center"
              >
                <p className="text-xs text-text-muted">Photo {i}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Location History */}
        <div className="rounded-xl border border-border bg-white px-6 py-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Location History</h2>
          <div className="space-y-0">
            {asset.location_history.map((entry, index) => (
              <div key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
                {index < asset.location_history.length - 1 && (
                  <div className="absolute left-[7px] top-5 bottom-0 w-px bg-border" />
                )}
                <div className="relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-border bg-white" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{entry.location}</p>
                      <p className="text-xs text-text-muted mt-0.5">{entry.notes}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-text-muted">{formatDate(entry.moved_at)}</p>
                      <span className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${conditionColor(entry.condition)}`}>
                        {entry.condition}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
