'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import StatusBadge, { EQUIPMENT_STATUS_COLORS } from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import EmptyState from '@/components/ui/EmptyState';
import DisposalModal from '@/components/admin/assets/DisposalModal';
import RevaluationModal from '@/components/admin/assets/RevaluationModal';
import MoveAssetModal from '@/components/admin/assets/MoveAssetModal';
import AssetFormModal from '@/components/admin/assets/AssetFormModal';
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
    disposal_reason: string | null;
    retired_at: string | null;
    serial_number: string | null;
    total_usage_hours: number | null;
    last_failure_at: string | null;
    purchase_order_id: string | null;
    created_at: string;
  };
  proposalId: string | null;
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

interface AuditLogEntry {
  id: string;
  field_changed: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  change_source: string;
}

interface ValueHistoryEntry {
  id: string;
  previous_value: number | null;
  new_value: number | null;
  change_type: string;
  reason: string | null;
  created_at: string;
}

interface MaintenanceSchedule {
  id: string;
  task_name: string;
  frequency: string;
  next_due_date: string | null;
  last_performed_at: string | null;
}

const CONDITION_COLORS: Record<string, string> = {
  new: 'bg-green-50 text-green-700',
  excellent: 'bg-green-50 text-green-700',
  good: 'bg-blue-50 text-blue-700',
  fair: 'bg-amber-50 text-amber-700',
  poor: 'bg-red-50 text-red-700',
  damaged: 'bg-red-100 text-red-800',
};

export default function AssetDetailClient({ asset, proposalId, proposalName, locationHistory }: AssetDetailClientProps) {
  const router = useRouter();
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [disposalOpen, setDisposalOpen] = useState(false);
  const [revaluationOpen, setRevaluationOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [depreciationSchedule, setDepreciationSchedule] = useState<DepreciationEntry[]>([]);
  const [depreciationLoading, setDepreciationLoading] = useState(false);
  const [depreciationError, setDepreciationError] = useState<string | null>(null);
  const [maintenanceCostTotal, setMaintenanceCostTotal] = useState<number | null>(null);
  const [maintenanceError, setMaintenanceError] = useState<string | null>(null);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [valueHistory, setValueHistory] = useState<ValueHistoryEntry[]>([]);
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<MaintenanceSchedule[]>([]);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => router.refresh(), [router]);

  // M-8: Click-outside handler for action menu
  useEffect(() => {
    if (!actionMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setActionMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [actionMenuOpen]);

  // Fetch depreciation schedule — M-2: with error handling
  useEffect(() => {
    if (!asset.depreciation_method || !asset.useful_life_months || !asset.acquisition_cost) return;
    setDepreciationLoading(true);
    setDepreciationError(null);
    fetch(`/api/assets/${asset.id}/depreciation`)
      .then((r) => r.json())
      .then((data) => setDepreciationSchedule(data.schedule ?? []))
      .catch(() => setDepreciationError('Failed to load depreciation schedule.'))
      .finally(() => setDepreciationLoading(false));
  }, [asset.id, asset.depreciation_method, asset.useful_life_months, asset.acquisition_cost]);

  // Fetch maintenance TCO — M-2: with error handling
  useEffect(() => {
    setMaintenanceError(null);
    fetch(`/api/equipment/maintenance?assetId=${asset.id}`)
      .then((r) => r.json())
      .then((data) => {
        const records = data.records ?? [];
        const total = records.reduce((sum: number, r: { cost?: number }) => sum + (r.cost ?? 0), 0);
        setMaintenanceCostTotal(total);
      })
      .catch(() => setMaintenanceError('Failed to load maintenance data.'));
  }, [asset.id]);

  // H-6: Fetch audit log
  useEffect(() => {
    fetch(`/api/assets/${asset.id}/audit-log`)
      .then((r) => r.json())
      .then((data) => setAuditLog(data.entries ?? []))
      .catch(() => {});
  }, [asset.id]);

  // H-7: Fetch value history
  useEffect(() => {
    fetch(`/api/assets/${asset.id}/value-history`)
      .then((r) => r.json())
      .then((data) => setValueHistory(data.entries ?? []))
      .catch(() => {});
  }, [asset.id]);

  // H-5: Fetch maintenance schedules
  useEffect(() => {
    fetch(`/api/assets/${asset.id}/maintenance`)
      .then((r) => r.json())
      .then((data) => {
        setMaintenanceSchedules(data.schedules ?? []);
        // Also compute TCO from records
        const records = data.records ?? [];
        const total = records.reduce((sum: number, r: Record<string, unknown>) => sum + ((r.cost as number) ?? 0), 0);
        if (total > 0) setMaintenanceCostTotal(total);
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

  // Edit form initial data
  const editFormData = {
    id: asset.id,
    name: asset.name,
    type: asset.type,
    category: asset.category,
    description: asset.description ?? '',
    barcode: asset.barcode ?? '',
    serial_number: asset.serial_number ?? '',
    dimensions: asset.dimensions ?? '',
    weight: asset.weight ?? '',
    material: asset.material ?? '',
    storage_requirements: asset.storage_requirements ?? '',
    acquisition_cost: asset.acquisition_cost != null ? String(asset.acquisition_cost) : '',
    current_value: asset.current_value != null ? String(asset.current_value) : '',
    depreciation_method: asset.depreciation_method ?? '',
    useful_life_months: asset.useful_life_months != null ? String(asset.useful_life_months) : '',
    is_reusable: asset.is_reusable,
    max_deployments: asset.max_deployments != null ? String(asset.max_deployments) : '',
    warranty_start_date: asset.warranty_start_date?.split('T')[0] ?? '',
    warranty_end_date: asset.warranty_end_date?.split('T')[0] ?? '',
    warranty_provider: asset.warranty_provider ?? '',
    vendor_name: asset.vendor_name ?? '',
    insurance_policy_number: asset.insurance_policy_number ?? '',
    insurance_expiry_date: asset.insurance_expiry_date?.split('T')[0] ?? '',
    status: asset.status,
  };

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
            {asset.type} &middot; {asset.category} {asset.barcode ? `· ${asset.barcode}` : ''}{asset.serial_number ? ` · S/N: ${asset.serial_number}` : ''}
          </p>
        </div>
        {!isTerminal && (
          <div className="flex items-center gap-3 shrink-0">
            <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>Edit</Button>
            <Button variant="secondary" size="sm" onClick={() => setRevaluationOpen(true)}>Revalue</Button>
            <div className="relative" ref={actionMenuRef}>
              <Button variant="secondary" size="sm" onClick={() => setActionMenuOpen(!actionMenuOpen)}>
                Actions ▾
              </Button>
              {actionMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-border bg-background shadow-lg py-1 z-10">
                  {asset.status !== 'retired' && asset.status !== 'disposed' && (
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-bg-secondary transition-colors"
                      onClick={() => { setActionMenuOpen(false); setMoveOpen(true); }}
                    >
                      Move Asset
                    </button>
                  )}
                  {/* H-2: Recondition button for retired assets */}
                  {asset.status === 'retired' && (
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-green-700 hover:bg-green-50 transition-colors"
                      onClick={async () => {
                        setActionMenuOpen(false);
                        await fetch(`/api/assets/${asset.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'in_storage', condition: 'good' }),
                        });
                        refresh();
                      }}
                    >
                      Recondition → Storage
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

      {/* Alert for disposed/retired — L-4: include disposal_reason */}
      {asset.status === 'disposed' && (
        <Alert variant="warning" className="mb-6">
          This asset was disposed on {formatDate(asset.disposed_at!)} via {formatLabel(asset.disposal_method ?? 'unknown')}.
          {asset.disposal_reason ? ` Reason: ${asset.disposal_reason}.` : ''}
          {asset.disposal_proceeds ? ` Proceeds: ${formatCurrency(asset.disposal_proceeds)}.` : ''}
        </Alert>
      )}
      {asset.status === 'retired' && (
        <Alert variant="info" className="mb-6">
          This asset was retired on {formatDate(asset.retired_at!)}. Use <strong>Actions → Recondition</strong> to return it to storage, or <strong>Dispose</strong> to remove it permanently.
        </Alert>
      )}

      <div className="space-y-8">
        {/* ── Row 1: Details + Financial ──────────────────────────── */}
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
              {/* L-1: Serial Number */}
              {asset.serial_number && (
                <div className="flex justify-between border-t border-border pt-3">
                  <dt className="text-sm text-text-muted">Serial Number</dt>
                  <dd className="text-sm text-foreground font-mono">{asset.serial_number}</dd>
                </div>
              )}
              {/* L-2: Usage hours */}
              {asset.total_usage_hours != null && asset.total_usage_hours > 0 && (
                <div className="flex justify-between border-t border-border pt-3">
                  <dt className="text-sm text-text-muted">Usage Hours</dt>
                  <dd className="text-sm text-foreground tabular-nums">{asset.total_usage_hours}h</dd>
                </div>
              )}
              {/* L-2: Last failure */}
              {asset.last_failure_at && (
                <div className="flex justify-between border-t border-border pt-3">
                  <dt className="text-sm text-text-muted">Last Failure</dt>
                  <dd className="text-sm text-red-700">{formatDate(asset.last_failure_at)}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Financial Summary */}
          <div className="rounded-xl border border-border bg-background px-6 py-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Financial Summary</h2>
            {maintenanceError && (
              <Alert variant="warning" className="mb-3 text-xs">{maintenanceError}</Alert>
            )}
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
              {/* M-11: Proposal name as clickable link */}
              <div className="flex justify-between border-t border-border pt-3">
                <dt className="text-sm text-text-muted">Current Proposal</dt>
                <dd className="text-sm text-foreground">
                  {proposalId && proposalName ? (
                    <Link href={`/app/proposals/${proposalId}`} className="text-blue-600 hover:underline">
                      {proposalName}
                    </Link>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
              {/* L-3: Purchase order linkage */}
              {asset.purchase_order_id && (
                <div className="flex justify-between border-t border-border pt-3">
                  <dt className="text-sm text-text-muted">Purchase Order</dt>
                  <dd className="text-sm">
                    <Link href={`/app/finance/purchase-orders/${asset.purchase_order_id}`} className="text-blue-600 hover:underline font-mono text-xs">
                      {asset.purchase_order_id.slice(0, 8)}…
                    </Link>
                  </dd>
                </div>
              )}
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
            {depreciationError && (
              <Alert variant="warning" className="mb-3 text-xs">{depreciationError}</Alert>
            )}
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
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-muted">{depreciationSchedule.length} periods</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const csv = ['Period,Date,Depreciation,Accumulated,Book Value']
                      .concat(depreciationSchedule.map((e) =>
                        `${e.periodNumber},${e.entryDate},${e.depreciationAmount},${e.accumulatedDepreciation},${e.bookValue}`
                      ))
                      .join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${asset.name.replace(/\s+/g, '-')}-depreciation.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Export CSV
                </Button>
              </div>
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
            {/* C-8: Photo upload — placeholder until storage integration */}
            <Button variant="ghost" size="sm" disabled title="Photo upload coming soon">+ Upload Photo</Button>
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

        {/* ── H-5: Maintenance ───────────────────────────────────── */}
        {maintenanceSchedules.length > 0 && (
          <div className="rounded-xl border border-border bg-background px-6 py-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Maintenance Schedules</h2>
            <div className="space-y-3">
              {maintenanceSchedules.map((s) => (
                <div key={s.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.task_name}</p>
                    <p className="text-xs text-text-muted mt-0.5">Frequency: {formatLabel(s.frequency)}</p>
                  </div>
                  <div className="text-right">
                    {s.next_due_date && (
                      <p className="text-xs text-text-muted">Due: {formatDate(s.next_due_date)}</p>
                    )}
                    {s.last_performed_at && (
                      <p className="text-xs text-text-muted">Last: {formatDate(s.last_performed_at)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── H-7: Value History ─────────────────────────────────── */}
        {valueHistory.length > 0 && (
          <div className="rounded-xl border border-border bg-background overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Value History</h2>
            </div>
            <div className="overflow-x-auto max-h-48 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0">
                  <tr className="border-b border-border bg-bg-secondary">
                    <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Date</th>
                    <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Type</th>
                    <th className="px-6 py-2 text-right text-xs font-medium uppercase tracking-wider text-text-muted">From</th>
                    <th className="px-6 py-2 text-right text-xs font-medium uppercase tracking-wider text-text-muted">To</th>
                    <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {valueHistory.map((v) => (
                    <tr key={v.id} className="transition-colors hover:bg-bg-secondary/50">
                      <td className="px-6 py-2 text-sm text-text-secondary">{formatDate(v.created_at)}</td>
                      <td className="px-6 py-2 text-sm">
                        <StatusBadge status={v.change_type} />
                      </td>
                      <td className="px-6 py-2 text-sm text-right text-text-secondary tabular-nums">{v.previous_value != null ? formatCurrency(v.previous_value) : '—'}</td>
                      <td className="px-6 py-2 text-sm text-right font-medium text-foreground tabular-nums">{v.new_value != null ? formatCurrency(v.new_value) : '—'}</td>
                      <td className="px-6 py-2 text-sm text-text-muted max-w-xs truncate">{v.reason ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── H-6: Audit Trail ───────────────────────────────────── */}
        {auditLog.length > 0 && (
          <div className="rounded-xl border border-border bg-background overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Audit Trail</h2>
            </div>
            <div className="overflow-x-auto max-h-48 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0">
                  <tr className="border-b border-border bg-bg-secondary">
                    <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Date</th>
                    <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Field</th>
                    <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-muted">From</th>
                    <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-muted">To</th>
                    <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {auditLog.map((log) => (
                    <tr key={log.id} className="transition-colors hover:bg-bg-secondary/50">
                      <td className="px-6 py-2 text-sm text-text-secondary">{formatDate(log.created_at)}</td>
                      <td className="px-6 py-2 text-sm text-foreground font-mono text-xs">{log.field_changed}</td>
                      <td className="px-6 py-2 text-sm text-text-secondary">{log.old_value ?? '—'}</td>
                      <td className="px-6 py-2 text-sm text-foreground">{log.new_value ?? '—'}</td>
                      <td className="px-6 py-2 text-sm text-text-muted">{log.change_source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
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
      <MoveAssetModal
        open={moveOpen}
        onClose={() => setMoveOpen(false)}
        onMoved={refresh}
        asset={{ id: asset.id, name: asset.name }}
      />
      <AssetFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={refresh}
        initialData={editFormData}
      />
    </>
  );
}
