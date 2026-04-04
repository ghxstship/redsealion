import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatCurrency, statusColor } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';

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

  const supabase = await createClient();

  // Fetch asset
  const { data: asset } = await supabase
    .from('assets')
    .select('*')
    .eq('id', id)
    .single();

  if (!asset) notFound();

  // Fetch proposal name
  const { data: proposal } = await supabase
    .from('proposals')
    .select('name')
    .eq('id', asset.proposal_id)
    .single();

  // Fetch location history
  const { data: locationHistory } = await supabase
    .from('asset_location_history')
    .select('*')
    .eq('asset_id', id)
    .order('moved_at', { ascending: false });

  const history = (locationHistory ?? []).map((entry) => {
    const loc = entry.location as { name?: string } | null;
    return {
      id: entry.id,
      location: loc?.name ?? 'Unknown',
      moved_at: entry.moved_at,
      condition: entry.condition_at_move ?? 'unknown',
      notes: entry.notes ?? '',
    };
  });

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
            {asset.type} &middot; {asset.category} {asset.barcode ? `· ${asset.barcode}` : ''}
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
              {asset.description && (
                <div className="flex justify-between">
                  <dt className="text-sm text-text-muted">Description</dt>
                  <dd className="text-sm text-foreground text-right max-w-xs">{asset.description}</dd>
                </div>
              )}
              {asset.dimensions && (
                <div className="flex justify-between border-t border-border pt-3">
                  <dt className="text-sm text-text-muted">Dimensions</dt>
                  <dd className="text-sm text-foreground">{asset.dimensions}</dd>
                </div>
              )}
              {asset.weight && (
                <div className="flex justify-between border-t border-border pt-3">
                  <dt className="text-sm text-text-muted">Weight</dt>
                  <dd className="text-sm text-foreground">{asset.weight}</dd>
                </div>
              )}
              {asset.material && (
                <div className="flex justify-between border-t border-border pt-3">
                  <dt className="text-sm text-text-muted">Material</dt>
                  <dd className="text-sm text-foreground">{asset.material}</dd>
                </div>
              )}
              {asset.storage_requirements && (
                <div className="flex justify-between border-t border-border pt-3">
                  <dt className="text-sm text-text-muted">Storage</dt>
                  <dd className="text-sm text-foreground text-right max-w-xs">{asset.storage_requirements}</dd>
                </div>
              )}
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
              {asset.acquisition_cost != null && (
                <div className="flex justify-between border-t border-border pt-3">
                  <dt className="text-sm text-text-muted">Acquisition Cost</dt>
                  <dd className="text-sm font-medium text-foreground tabular-nums">{formatCurrency(asset.acquisition_cost)}</dd>
                </div>
              )}
              {asset.current_value != null && (
                <div className="flex justify-between border-t border-border pt-3">
                  <dt className="text-sm text-text-muted">Current Value</dt>
                  <dd className="text-sm font-medium text-foreground tabular-nums">{formatCurrency(asset.current_value)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-3">
                <dt className="text-sm text-text-muted">Deployments</dt>
                <dd className="text-sm text-foreground">
                  {asset.deployment_count}{asset.max_deployments ? ` / ${asset.max_deployments}` : ''}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <dt className="text-sm text-text-muted">Reusable</dt>
                <dd className="text-sm text-foreground">{asset.is_reusable ? 'Yes' : 'No'}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <dt className="text-sm text-text-muted">Current Proposal</dt>
                <dd className="text-sm text-foreground">{proposal?.name ?? '—'}</dd>
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
          {asset.photo_urls && asset.photo_urls.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {asset.photo_urls.map((url: string, i: number) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden bg-bg-tertiary">
                  <img src={url} alt={`${asset.name} photo ${i + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-bg-secondary py-8 text-sm text-text-muted">
              No photos uploaded yet
            </div>
          )}
        </div>

        {/* Location History */}
        <div className="rounded-xl border border-border bg-white px-6 py-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Location History</h2>
          {history.length === 0 ? (
            <p className="text-sm text-text-muted">No location history recorded.</p>
          ) : (
            <div className="space-y-0">
              {history.map((entry, index) => (
                <div key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {index < history.length - 1 && (
                    <div className="absolute left-[7px] top-5 bottom-0 w-px bg-border" />
                  )}
                  <div className="relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-border bg-white" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{entry.location}</p>
                        {entry.notes && (
                          <p className="text-xs text-text-muted mt-0.5">{entry.notes}</p>
                        )}
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
          )}
        </div>
      </div>
    </>
  );
}
