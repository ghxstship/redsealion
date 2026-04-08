'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import StatusBadge, { EQUIPMENT_STATUS_COLORS } from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import EmptyState from '@/components/ui/EmptyState';
import DisposalModal from '@/components/admin/assets/DisposalModal';
import RevaluationModal from '@/components/admin/assets/RevaluationModal';
import { formatCurrency, formatLabel, formatDate } from '@/lib/utils';

/**
 * Asset detail client component — handles interactive actions.
 * Receives server-fetched data as props.
 */

interface AssetDetailClientProps {
  asset: {
    id: string;
    name: string;
    type: string;
    category: string;
    status: string;
    condition: string;
    barcode: string | null;
    description: string | null;
    dimensions: string | null;
    weight: string | null;
    material: string | null;
    storage_requirements: string | null;
    acquisition_cost: number | null;
    current_value: number | null;
    depreciation_method: string | null;
    useful_life_months: number | null;
    deployment_count: number;
    max_deployments: number | null;
    is_reusable: boolean;
    photo_urls: string[];
    warranty_start_date: string | null;
    warranty_end_date: string | null;
    warranty_provider: string | null;
    vendor_name: string | null;
    insurance_policy_number: string | null;
    insurance_expiry_date: string | null;
    disposed_at: string | null;
    disposal_method: string | null;
    disposal_proceeds: number | null;
    retired_at: string | null;
    created_at: string;
  };
  proposalName: string | null;
  locationHistory: Array<{
    id: string;
    location: string;
    moved_at: string;
    condition: string;
    notes: string;
  }>;
}

interface DepreciationEntry {
  periodNumber: number;
  entryDate: string;
  depreciationAmount: number;
  accumulatedDepreciation: number;
  bookValue: number;
}

const CONDITION_COLORS: Record<string, string> = {
  new: 'bg-green-50 text-green-700',
  excellent: 'bg-green-50 text-green-700',
  good: 'bg-blue-50 text-blue-700',
  fair: 'bg-amber-50 text-amber-700',
  poor: 'bg-red-50 text-red-700',
  damaged: 'bg-red-100 text-red-800',
};

export default function AssetDetailClient({ asset, proposalName, locationHistory }: AssetDetailClientProps) {
  const router = useRouter();
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [disposalOpen, setDisposalOpen] = useState(false);
  const [revaluationOpen, setRevaluationOpen] = useState(false);
  const [depreciationSchedule, setDepreciationSchedule] = useState<DepreciationEntry[]>([]);
  const [depreciationLoading, setDepreciationLoading] = useState(false);
  const [maintenanceCostTotal, setMaintenanceCostTotal] = useState<number | null>(null);

  const refresh = useCallback(() => router.refresh(), [router]);

  // Fetch depreciation schedule
  useEffect(() => {
    if (!asset.depreciation_method || !asset.useful_life_months || !asset.acquisition_cost) return;
    setDepreciationLoading(true);
    fetch(`/api/assets/${asset.id}/depreciation`)
      .then((r) => r.json())
      .then((data) => setDepreciationSchedule(data.schedule ?? []))
      .catch(() => {})
      .finally(() => setDepreciationLoading(false));
  }, [asset.id, asset.depreciation_method, asset.useful_life_months, asset.acquisition_cost]);

  // Fetch maintenance TCO
  useEffect(() => {
    fetch(`/api/equipment/maintenance?assetId=${asset.id}`)
      .then((r) => r.json())
      .then((data) => {
        const records = data.records ?? [];
        const total = records.reduce((sum: number, r: { cost?: number }) => sum + (r.cost ?? 0), 0);
        setMaintenanceCostTotal(total);
      })
      .catch(() => {});
  }, [asset.id]);

  const acquisitionCost = asset.acquisition_cost ?? 0;
  const currentValue = asset.current_value ?? 0;
  const accumulatedDepreciation = acquisitionCost - currentValue;
  const tco = acquisitionCost + (maintenanceCostTotal ?? 0);

  // Warranty status
  const warrantyActive = asset.warranty_end_date && new Date(asset.warranty_end_date) > new Date();
  const warrantyDaysRemaining = asset.warranty_end_date
    ? Math.ceil((new Date(asset.warranty_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const insuranceActive = asset.insurance_expiry_date && new Date(asset.insurance_expiry_date) > new Date();

  const isTerminal = asset.status === 'disposed';

  return (
    <>
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{asset.name}</h1>
            <StatusBadge status={asset.status} colorMap={EQUIPMENT_STATUS_COLORS} />
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            {asset.type} &middot; {asset.category} {asset.barcode ? `· ${asset.barcode}` : ''}
          </p>
        </div>
        {!isTerminal && (
          <div className="relative flex items-center gap-3 shrink-0">
            <Button variant="secondary" onClick={() => setRevaluationOpen(true)}>Revalue</Button>
            <div className="relative">
              <Button variant="secondary" onClick={() => setActionMenuOpen(!actionMenuOpen)}>
                Actions ▾
              </Button>
              {actionMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-border bg-background shadow-lg py-1 z-10">
                  {asset.status !== 'retired' && asset.status !== 'disposed' && (
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-bg-secondary transition-colors"
                      onClick={() => { setActionMenuOpen(false); alert('Asset movement is managed in the upcoming Logistics v2 suite.'); }}
                    >
                      Move Asset
                    </button>
                  )}
                  {['deployed', 'in_storage'].includes(asset.status) && (
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-amber-700 hover:bg-amber-50 transition-colors"
                      onClick={async () => {
                        setActionMenuOpen(false);
                        await fetch(`/api/assets/${asset.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'retired', disposal_reason: 'Manual retirement' }),
                        });
                        refresh();
                      }}
                    >
                      Retire
                    </button>
                  )}
                  {['in_storage', 'retired'].includes(asset.status) && (
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50 transition-colors"
                      onClick={() => { setActionMenuOpen(false); setDisposalOpen(true); }}
                    >
                      Dispose
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Alert for disposed/retired */}
      {asset.status === 'disposed' && (
        <Alert variant="warning" className="mb-6">
          This asset was disposed on {formatDate(asset.disposed_at!)} via {formatLabel(asset.disposal_method ?? 'unknown')}.
          {asset.disposal_proceeds ? ` Proceeds: ${formatCurrency(asset.disposal_proceeds)}.` : ''}
        </Alert>
      )}
      {asset.status === 'retired' && (
        <Alert variant="info" className="mb-6">
          This asset was retired on {formatDate(asset.retired_at!)}. It can be reconditioned and returned to storage, or disposed.
        </Alert>
      )}

      <div className="space-y-8">
        {/* ── Row 1: Details + Lifecycle ──────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Details */}
          <div className="rounded-xl border border-border bg-background px-6 py-5">
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
              {asset.vendor_name && (
                <div className="flex justify-between border-t border-border pt-3">
                  <dt className="text-sm text-text-muted">Vendor</dt>
                  <dd className="text-sm text-foreground">{asset.vendor_name}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Financial Summary */}
          <div className="rounded-xl border border-border bg-background px-6 py-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Financial Summary</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-text-muted">Condition</dt>
                <dd>
                  <StatusBadge status={asset.condition} colorMap={CONDITION_COLORS} />
                </dd>
              </div>
              {acquisitionCost > 0 && (
                <div className="flex justify-between border-t border-border pt-3">
                  <dt className="text-sm text-text-muted">Acquisition Cost</dt>
                  <dd className="text-sm font-medium text-foreground tabular-nums">{formatCurrency(acquisitionCost)}</dd>
                </div>
              )}
              {accumulatedDepreciation > 0 && (
                <div className="flex justify-between border-t border-border pt-3">
                  <dt className="text-sm text-text-muted">Depreciation</dt>
                  <dd className="text-sm font-medium text-red-700 tabular-nums">-{formatCurrency(accumulatedDepreciation)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-3">
                <dt className="text-sm text-text-muted">Book Value</dt>
                <dd className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(currentValue)}</dd>
              </div>
              {maintenanceCostTotal != null && maintenanceCostTotal > 0 && (
                <div className="flex justify-between border-t border-border pt-3">
                  <dt className="text-sm text-text-muted">Maintenance (TCO)</dt>
                  <dd className="text-sm font-medium text-foreground tabular-nums">{formatCurrency(maintenanceCostTotal)}</dd>
                </div>
              )}
              {tco > 0 && (
                <div className="flex justify-between border-t-2 border-border pt-3">
                  <dt className="text-sm font-medium text-foreground">Total Cost of Ownership</dt>
                  <dd className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(tco)}</dd>
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
                <dd className="text-sm text-foreground">{proposalName ?? '—'}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* ── Row 2: Warranty & Insurance + Depreciation Method ──── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Warranty & Insurance */}
          <div className="rounded-xl border border-border bg-background px-6 py-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Warranty & Insurance</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-text-muted">Warranty Status</dt>
                <dd>
                  {warrantyActive ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      Active — {warrantyDaysRemaining}d remaining
                    </span>
                  ) : asset.warranty_end_date ? (
                    <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">Expired</span>
                  ) : (
                    <span className="text-sm text-text-muted">Not set</span>
                  )}
                </dd>
              </div>
              {asset.warranty_provider && (
                <div className="flex justify-between border-t border-border pt-3">
                  <dt className="text-sm text-text-muted">Provider</dt>
                  <dd className="text-sm text-foreground">{asset.warranty_provider}</dd>
                </div>
              )}
              {asset.warranty_end_date && (
                <div className="flex justify-between border-t border-border pt-3">
                  <dt className="text-sm text-text-muted">Expires</dt>
                  <dd className="text-sm text-foreground">{formatDate(asset.warranty_end_date)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-3">
                <dt className="text-sm text-text-muted">Insurance</dt>
                <dd>
                  {insuranceActive ? (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">Active</span>
                  ) : asset.insurance_expiry_date ? (
                    <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">Expired</span>
                  ) : (
                    <span className="text-sm text-text-muted">Not set</span>
                  )}
                </dd>
              </div>
              {asset.insurance_policy_number && (
                <div className="flex justify-between border-t border-border pt-3">
                  <dt className="text-sm text-text-muted">Policy #</dt>
                  <dd className="text-sm text-foreground font-mono">{asset.insurance_policy_number}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Depreciation Config */}
          <div className="rounded-xl border border-border bg-background px-6 py-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Depreciation</h2>
            {asset.depreciation_method ? (
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-text-muted">Method</dt>
                  <dd className="text-sm text-foreground">{formatLabel(asset.depreciation_method)}</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-3">
                  <dt className="text-sm text-text-muted">Useful Life</dt>
                  <dd className="text-sm text-foreground">{asset.useful_life_months} months</dd>
                </div>
                {depreciationSchedule.length > 0 && (
                  <>
                    <div className="flex justify-between border-t border-border pt-3">
                      <dt className="text-sm text-text-muted">Monthly Depreciation</dt>
                      <dd className="text-sm font-medium text-foreground tabular-nums">
                        {formatCurrency(depreciationSchedule[0]?.depreciationAmount ?? 0)}
                      </dd>
                    </div>
                    <div className="flex justify-between border-t border-border pt-3">
                      <dt className="text-sm text-text-muted">Residual Value</dt>
                      <dd className="text-sm font-medium text-foreground tabular-nums">
                        {formatCurrency(depreciationSchedule[depreciationSchedule.length - 1]?.bookValue ?? 0)}
                      </dd>
                    </div>
                  </>
                )}
              </dl>
            ) : (
              <p className="text-sm text-text-muted">No depreciation configured. Set the depreciation method and useful life to enable tracking.</p>
            )}
          </div>
        </div>

        {/* ── Depreciation Schedule Table ─────────────────────────── */}
        {depreciationSchedule.length > 0 && (
          <div className="rounded-xl border border-border bg-background overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Depreciation Schedule</h2>
              <span className="text-xs text-text-muted">{depreciationSchedule.length} periods</span>
            </div>
            {depreciationLoading ? (
              <div className="px-6 py-8 text-center text-sm text-text-muted">Loading schedule...</div>
            ) : (
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0">
                    <tr className="border-b border-border bg-bg-secondary">
                      <th className="px-6 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Period</th>
                      <th className="px-6 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Date</th>
                      <th className="px-6 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Depreciation</th>
                      <th className="px-6 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Accumulated</th>
                      <th className="px-6 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Book Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {depreciationSchedule.slice(0, 60).map((entry) => (
                      <tr key={entry.periodNumber} className="transition-colors hover:bg-bg-secondary/50">
                        <td className="px-6 py-2.5 text-sm text-text-secondary tabular-nums">{entry.periodNumber}</td>
                        <td className="px-6 py-2.5 text-sm text-text-secondary">{formatDate(entry.entryDate)}</td>
                        <td className="px-6 py-2.5 text-sm text-right text-red-700 tabular-nums">{formatCurrency(entry.depreciationAmount)}</td>
                        <td className="px-6 py-2.5 text-sm text-right text-text-secondary tabular-nums">{formatCurrency(entry.accumulatedDepreciation)}</td>
                        <td className="px-6 py-2.5 text-sm text-right font-medium text-foreground tabular-nums">{formatCurrency(entry.bookValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Photos ──────────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-background px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Photos</h2>
            <Button variant="ghost" size="sm">+ Upload Photo</Button>
          </div>
          {asset.photo_urls && asset.photo_urls.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {asset.photo_urls.map((url, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden bg-bg-tertiary">
                  <img src={url} alt={`${asset.name} photo ${i + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No photos uploaded yet" className="border-bg-secondary/30 hidden shadow-none" />
          )}
        </div>

        {/* ── Location History ────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-background px-6 py-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Location History</h2>
          {locationHistory.length === 0 ? (
            <p className="text-sm text-text-muted">No location history recorded.</p>
          ) : (
            <div className="space-y-0">
              {locationHistory.map((entry, index) => (
                <div key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {index < locationHistory.length - 1 && (
                    <div className="absolute left-[7px] top-5 bottom-0 w-px bg-border" />
                  )}
                  <div className="relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-border bg-background" />
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
                        <StatusBadge status={entry.condition} colorMap={CONDITION_COLORS} className="mt-1" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────── */}
      <DisposalModal
        open={disposalOpen}
        onClose={() => setDisposalOpen(false)}
        onDisposed={refresh}
        asset={{ id: asset.id, name: asset.name, currentValue: currentValue, status: asset.status }}
      />
      <RevaluationModal
        open={revaluationOpen}
        onClose={() => setRevaluationOpen(false)}
        onRevalued={refresh}
        asset={{ id: asset.id, name: asset.name, currentValue: currentValue }}
      />
    </>
  );
}
