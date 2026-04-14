'use client';

import { useState, type FormEvent } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface EquipmentFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  /** If provided, pre-fills the form for editing */
  initialData?: {
    id: string;
    name: string;
    category: string;
    status: string;
    current_location: string;
    serial_number: string | null;
    notes: string | null;
    acquisition_cost?: number | null;
    depreciation_method?: string | null;
    useful_life_months?: number | null;
    warranty_start_date?: string | null;
    warranty_end_date?: string | null;
    warranty_provider?: string | null;
    vendor_name?: string | null;
    insurance_policy_number?: string | null;
    insurance_expiry_date?: string | null;
  };
}

const CATEGORIES = ['Lighting', 'Audio/Visual', 'Staging', 'Rigging', 'Signage', 'Power', 'Furniture', 'Decor', 'Tools', 'Other'] as const;
const STATUSES = ['planned', 'in_production', 'in_transit', 'deployed', 'in_storage', 'retired', 'disposed'] as const;
const DEPRECIATION_METHODS = [
  { value: '', label: 'None' },
  { value: 'straight_line', label: 'Straight Line' },
  { value: 'declining_balance', label: 'Declining Balance' },
  { value: 'declining_then_straight', label: 'Declining then Straight' },
] as const;

export default function EquipmentFormModal({ open, onClose, onCreated, initialData }: EquipmentFormModalProps) {
  const isEditing = !!initialData;

  // Core fields
  const [name, setName] = useState(initialData?.name ?? '');
  const [category, setCategory] = useState(initialData?.category ?? '');
  const [status, setStatus] = useState(initialData?.status ?? 'planned');
  const [location, setLocation] = useState(initialData?.current_location ?? '');
  const [serialNumber, setSerialNumber] = useState(initialData?.serial_number ?? '');
  const [description, setDescription] = useState(initialData?.notes ?? '');

  // Financial fields
  const [acquisitionCost, setAcquisitionCost] = useState(initialData?.acquisition_cost?.toString() ?? '');
  const [depreciationMethod, setDepreciationMethod] = useState(initialData?.depreciation_method ?? '');
  const [usefulLife, setUsefulLife] = useState(initialData?.useful_life_months?.toString() ?? '');

  // Warranty fields
  const [warrantyStart, setWarrantyStart] = useState(initialData?.warranty_start_date?.split('T')[0] ?? '');
  const [warrantyEnd, setWarrantyEnd] = useState(initialData?.warranty_end_date?.split('T')[0] ?? '');
  const [warrantyProvider, setWarrantyProvider] = useState(initialData?.warranty_provider ?? '');

  // Vendor & Insurance
  const [vendorName, setVendorName] = useState(initialData?.vendor_name ?? '');
  const [insurancePolicy, setInsurancePolicy] = useState(initialData?.insurance_policy_number ?? '');
  const [insuranceExpiry, setInsuranceExpiry] = useState(initialData?.insurance_expiry_date?.split('T')[0] ?? '');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(
    !!(initialData?.acquisition_cost || initialData?.warranty_end_date || initialData?.vendor_name),
  );

  function resetForm() {
    setName(''); setCategory(''); setStatus('planned');
    setLocation(''); setSerialNumber(''); setDescription('');
    setAcquisitionCost(''); setDepreciationMethod(''); setUsefulLife('');
    setWarrantyStart(''); setWarrantyEnd(''); setWarrantyProvider('');
    setVendorName(''); setInsurancePolicy(''); setInsuranceExpiry('');
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload: Record<string, unknown> = {
      name,
      category: category || null,
      status,
      current_location: location ? { type: location } : null,
      serial_number: serialNumber || null,
      description: description || null,
    };

    // Lifecycle fields (only include if filled)
    if (acquisitionCost) {
      payload.acquisition_cost = parseFloat(acquisitionCost);
      payload.current_value = parseFloat(acquisitionCost); // default to acquisition cost
    }
    if (depreciationMethod) payload.depreciation_method = depreciationMethod;
    if (usefulLife) payload.useful_life_months = parseInt(usefulLife);
    if (warrantyStart) payload.warranty_start_date = warrantyStart;
    if (warrantyEnd) payload.warranty_end_date = warrantyEnd;
    if (warrantyProvider) payload.warranty_provider = warrantyProvider;
    if (vendorName) payload.vendor_name = vendorName;
    if (insurancePolicy) payload.insurance_policy_number = insurancePolicy;
    if (insuranceExpiry) payload.insurance_expiry_date = insuranceExpiry;

    try {
      const url = isEditing ? `/api/assets/${initialData.id}` : '/api/assets';
      const method = isEditing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to ${isEditing ? 'update' : 'create'} equipment`);
      }

      resetForm();
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} title={isEditing ? 'Edit Equipment' : 'Add Equipment'} size="xl">
      {error && <Alert className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Core fields */}
        <div>
          <FormLabel>Name *</FormLabel>
          <FormInput type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 20ft LED Wall Panel" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Category</FormLabel>
            <FormSelect value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select category...</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </FormSelect>
          </div>
          <div>
            <FormLabel>Status</FormLabel>
            <FormSelect value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>)}
            </FormSelect>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Location</FormLabel>
            <FormInput type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Warehouse A" />
          </div>
          <div>
            <FormLabel>Serial #</FormLabel>
            <FormInput type="text" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="SN-00001" />
          </div>
        </div>

        <div>
          <FormLabel>Description</FormLabel>
          <FormTextarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            placeholder="Any additional details..." />
        </div>

        {/* Advanced toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm font-medium text-text-muted hover:text-foreground transition-colors"
        >
          {showAdvanced ? <span className="text-xs mr-1">&#9662;</span> : <span className="text-xs mr-1">&#9656;</span>}{showAdvanced ? 'Hide' : 'Show'} financial & warranty details
        </button>

        {showAdvanced && (
          <div className="space-y-4 border-t border-border pt-4">
            {/* Financial */}
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Financial</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <FormLabel>Acquisition Cost</FormLabel>
                <FormInput type="number" min="0" step="0.01" value={acquisitionCost} onChange={(e) => setAcquisitionCost(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <FormLabel>Depreciation</FormLabel>
                <FormSelect value={depreciationMethod} onChange={(e) => setDepreciationMethod(e.target.value)}>
                  {DEPRECIATION_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </FormSelect>
              </div>
              <div>
                <FormLabel>Useful Life (months)</FormLabel>
                <FormInput type="number" min="1" value={usefulLife} onChange={(e) => setUsefulLife(e.target.value)} placeholder="60" />
              </div>
            </div>

            {/* Vendor */}
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mt-4">Vendor</p>
            <div>
              <FormLabel>Vendor Name</FormLabel>
              <FormInput type="text" value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="e.g. ROE Visual" />
            </div>

            {/* Warranty */}
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mt-4">Warranty</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <FormLabel>Start Date</FormLabel>
                <FormInput type="date" value={warrantyStart} onChange={(e) => setWarrantyStart(e.target.value)} />
              </div>
              <div>
                <FormLabel>End Date</FormLabel>
                <FormInput type="date" value={warrantyEnd} onChange={(e) => setWarrantyEnd(e.target.value)} />
              </div>
              <div>
                <FormLabel>Provider</FormLabel>
                <FormInput type="text" value={warrantyProvider} onChange={(e) => setWarrantyProvider(e.target.value)} placeholder="e.g. MFR Warranty" />
              </div>
            </div>

            {/* Insurance */}
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mt-4">Insurance</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormLabel>Policy #</FormLabel>
                <FormInput type="text" value={insurancePolicy} onChange={(e) => setInsurancePolicy(e.target.value)} placeholder="POL-2026-A1" />
              </div>
              <div>
                <FormLabel>Expiry Date</FormLabel>
                <FormInput type="date" value={insuranceExpiry} onChange={(e) => setInsuranceExpiry(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>
            {submitting ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Add Equipment')}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
