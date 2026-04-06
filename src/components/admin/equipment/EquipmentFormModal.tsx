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
  };
}

const CATEGORIES = ['Lighting', 'Audio/Visual', 'Staging', 'Rigging', 'Signage', 'Power', 'Furniture', 'Decor', 'Tools', 'Other'] as const;
const STATUSES = ['planned', 'in_production', 'in_transit', 'deployed', 'in_storage', 'retired', 'disposed'] as const;

export default function EquipmentFormModal({ open, onClose, onCreated, initialData }: EquipmentFormModalProps) {
  const isEditing = !!initialData;
  const [name, setName] = useState(initialData?.name ?? '');
  const [category, setCategory] = useState(initialData?.category ?? '');
  const [status, setStatus] = useState(initialData?.status ?? 'planned');
  const [location, setLocation] = useState(initialData?.current_location ?? '');
  const [serialNumber, setSerialNumber] = useState(initialData?.serial_number ?? '');
  const [description, setDescription] = useState(initialData?.notes ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setName(''); setCategory(''); setStatus('planned');
    setLocation(''); setSerialNumber(''); setDescription(''); setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      name,
      category: category || null,
      status,
      current_location: location ? { type: location } : null,
      serial_number: serialNumber || null,
      description: description || null,
    };

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
    <ModalShell open={open} onClose={onClose} title={isEditing ? 'Edit Equipment' : 'Add Equipment'}>
      {error && <Alert className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
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
