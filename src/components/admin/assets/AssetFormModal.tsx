'use client';

import { useState, type FormEvent } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface AssetFormData {
  id?: string;
  name: string;
  type: string;
  category: string;
  description: string;
  barcode: string;
  serial_number: string;
  dimensions: string;
  weight: string;
  material: string;
  storage_requirements: string;
  acquisition_cost: string;
  current_value: string;
  depreciation_method: string;
  useful_life_months: string;
  is_reusable: boolean;
  max_deployments: string;
  warranty_start_date: string;
  warranty_end_date: string;
  warranty_provider: string;
  vendor_name: string;
  insurance_policy_number: string;
  insurance_expiry_date: string;
  status: string;
}

interface AssetFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** If provided, we're editing. If null, we're creating. */
  initialData?: Partial<AssetFormData> | null;
}

const ASSET_TYPES = [
  { value: 'equipment', label: 'Equipment' },
  { value: 'signage', label: 'Signage' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'av_equipment', label: 'AV Equipment' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'structural', label: 'Structural' },
  { value: 'decor', label: 'Decor' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'tool', label: 'Tool' },
  { value: 'prop', label: 'Prop' },
  { value: 'other', label: 'Other' },
];

const DEPRECIATION_METHODS = [
  { value: '', label: 'None' },
  { value: 'straight_line', label: 'Straight Line' },
  { value: 'declining_balance', label: 'Declining Balance' },
  { value: 'declining_then_straight', label: 'Declining → Straight Line' },
];

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_production', label: 'In Production' },
  { value: 'in_storage', label: 'In Storage' },
  { value: 'deployed', label: 'Deployed' },
  { value: 'in_transit', label: 'In Transit' },
];

function defaultForm(data?: Partial<AssetFormData> | null): AssetFormData {
  return {
    id: data?.id,
    name: data?.name ?? '',
    type: data?.type ?? 'equipment',
    category: data?.category ?? '',
    description: data?.description ?? '',
    barcode: data?.barcode ?? '',
    serial_number: data?.serial_number ?? '',
    dimensions: data?.dimensions ?? '',
    weight: data?.weight ?? '',
    material: data?.material ?? '',
    storage_requirements: data?.storage_requirements ?? '',
    acquisition_cost: data?.acquisition_cost ?? '',
    current_value: data?.current_value ?? '',
    depreciation_method: data?.depreciation_method ?? '',
    useful_life_months: data?.useful_life_months ?? '',
    is_reusable: data?.is_reusable ?? false,
    max_deployments: data?.max_deployments ?? '',
    warranty_start_date: data?.warranty_start_date ?? '',
    warranty_end_date: data?.warranty_end_date ?? '',
    warranty_provider: data?.warranty_provider ?? '',
    vendor_name: data?.vendor_name ?? '',
    insurance_policy_number: data?.insurance_policy_number ?? '',
    insurance_expiry_date: data?.insurance_expiry_date ?? '',
    status: data?.status ?? 'planned',
  };
}

export default function AssetFormModal({ open, onClose, onSaved, initialData }: AssetFormModalProps) {
  const isEdit = !!initialData?.id;
  const [form, setForm] = useState<AssetFormData>(() => defaultForm(initialData));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof AssetFormData>(key: K, value: AssetFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        type: form.type,
        category: form.category || 'Other',
        description: form.description || null,
        barcode: form.barcode || null,
        serial_number: form.serial_number || null,
        dimensions: form.dimensions || null,
        weight: form.weight || null,
        material: form.material || null,
        storage_requirements: form.storage_requirements || null,
        acquisition_cost: form.acquisition_cost ? parseFloat(form.acquisition_cost) : null,
        current_value: form.current_value ? parseFloat(form.current_value) : null,
        depreciation_method: form.depreciation_method || null,
        useful_life_months: form.useful_life_months ? parseInt(form.useful_life_months) : null,
        is_reusable: form.is_reusable,
        max_deployments: form.max_deployments ? parseInt(form.max_deployments) : null,
        warranty_start_date: form.warranty_start_date || null,
        warranty_end_date: form.warranty_end_date || null,
        warranty_provider: form.warranty_provider || null,
        vendor_name: form.vendor_name || null,
        insurance_policy_number: form.insurance_policy_number || null,
        insurance_expiry_date: form.insurance_expiry_date || null,
      };

      if (!isEdit) {
        payload.status = form.status;
      }

      const url = isEdit ? `/api/assets/${form.id}` : '/api/assets';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to ${isEdit ? 'update' : 'create'} asset`);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Asset' : 'New Asset'}
      subtitle={isEdit ? form.name : 'Create a new tracked asset'}
    >
      {error && <Alert className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        {/* ── Core Info ──────────────────────────────────────────── */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-medium uppercase tracking-wider text-text-muted mb-2">Core Info</legend>

          <div>
            <FormLabel>Name *</FormLabel>
            <FormInput
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. LED Panel Array #4"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormLabel>Type</FormLabel>
              <FormSelect value={form.type} onChange={(e) => update('type', e.target.value)}>
                {ASSET_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </FormSelect>
            </div>
            <div>
              <FormLabel>Category</FormLabel>
              <FormInput
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                placeholder="e.g. Stage Lighting"
              />
            </div>
          </div>

          {!isEdit && (
            <div>
              <FormLabel>Status</FormLabel>
              <FormSelect value={form.status} onChange={(e) => update('status', e.target.value)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </FormSelect>
            </div>
          )}

          <div>
            <FormLabel>Description</FormLabel>
            <FormTextarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={2}
              placeholder="Brief description..."
            />
          </div>
        </fieldset>

        {/* ── Identification ─────────────────────────────────────── */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-medium uppercase tracking-wider text-text-muted mb-2">Identification</legend>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormLabel>Barcode</FormLabel>
              <FormInput value={form.barcode} onChange={(e) => update('barcode', e.target.value)} placeholder="Barcode / QR" />
            </div>
            <div>
              <FormLabel>Serial Number</FormLabel>
              <FormInput value={form.serial_number} onChange={(e) => update('serial_number', e.target.value)} placeholder="S/N" />
            </div>
          </div>
        </fieldset>

        {/* ── Physical ───────────────────────────────────────────── */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-medium uppercase tracking-wider text-text-muted mb-2">Physical</legend>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <FormLabel>Dimensions</FormLabel>
              <FormInput value={form.dimensions} onChange={(e) => update('dimensions', e.target.value)} placeholder="L × W × H" />
            </div>
            <div>
              <FormLabel>Weight</FormLabel>
              <FormInput value={form.weight} onChange={(e) => update('weight', e.target.value)} placeholder="e.g. 25 lbs" />
            </div>
            <div>
              <FormLabel>Material</FormLabel>
              <FormInput value={form.material} onChange={(e) => update('material', e.target.value)} placeholder="e.g. Aluminum" />
            </div>
          </div>
          <div>
            <FormLabel>Storage Requirements</FormLabel>
            <FormInput value={form.storage_requirements} onChange={(e) => update('storage_requirements', e.target.value)} placeholder="e.g. Climate controlled" />
          </div>
        </fieldset>

        {/* ── Financial ──────────────────────────────────────────── */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-medium uppercase tracking-wider text-text-muted mb-2">Financial</legend>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormLabel>Acquisition Cost ($)</FormLabel>
              <FormInput type="number" min="0" step="0.01" value={form.acquisition_cost} onChange={(e) => update('acquisition_cost', e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <FormLabel>Current Value ($)</FormLabel>
              <FormInput type="number" min="0" step="0.01" value={form.current_value} onChange={(e) => update('current_value', e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormLabel>Depreciation Method</FormLabel>
              <FormSelect value={form.depreciation_method} onChange={(e) => update('depreciation_method', e.target.value)}>
                {DEPRECIATION_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </FormSelect>
            </div>
            <div>
              <FormLabel>Useful Life (months)</FormLabel>
              <FormInput type="number" min="1" step="1" value={form.useful_life_months} onChange={(e) => update('useful_life_months', e.target.value)} placeholder="36" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_reusable" checked={form.is_reusable} onChange={(e) => update('is_reusable', e.target.checked)} className="h-4 w-4 rounded border-border" />
              <FormLabel htmlFor="is_reusable" className="mb-0">Reusable</FormLabel>
            </div>
            <div>
              <FormLabel>Max Deployments</FormLabel>
              <FormInput type="number" min="1" step="1" value={form.max_deployments} onChange={(e) => update('max_deployments', e.target.value)} placeholder="Unlimited" />
            </div>
          </div>
        </fieldset>

        {/* ── Vendor & Warranty ──────────────────────────────────── */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-medium uppercase tracking-wider text-text-muted mb-2">Vendor & Warranty</legend>
          <div>
            <FormLabel>Vendor Name</FormLabel>
            <FormInput value={form.vendor_name} onChange={(e) => update('vendor_name', e.target.value)} placeholder="Supplier name" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <FormLabel>Warranty Provider</FormLabel>
              <FormInput value={form.warranty_provider} onChange={(e) => update('warranty_provider', e.target.value)} />
            </div>
            <div>
              <FormLabel>Warranty Start</FormLabel>
              <FormInput type="date" value={form.warranty_start_date} onChange={(e) => update('warranty_start_date', e.target.value)} />
            </div>
            <div>
              <FormLabel>Warranty End</FormLabel>
              <FormInput type="date" value={form.warranty_end_date} onChange={(e) => update('warranty_end_date', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormLabel>Insurance Policy #</FormLabel>
              <FormInput value={form.insurance_policy_number} onChange={(e) => update('insurance_policy_number', e.target.value)} />
            </div>
            <div>
              <FormLabel>Insurance Expiry</FormLabel>
              <FormInput type="date" value={form.insurance_expiry_date} onChange={(e) => update('insurance_expiry_date', e.target.value)} />
            </div>
          </div>
        </fieldset>

        {/* ── Actions ────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Asset'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
