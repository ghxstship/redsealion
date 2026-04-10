'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import Alert from '@/components/ui/Alert';

interface ShipmentBOLCardProps {
  shipmentId: string;
  initialData: {
    freight_class: string | null;
    nmfc_code: string | null;
    declared_value_cents: number | null;
    is_hazardous: boolean | null;
    bol_special_instructions: string | null;
  };
}

export default function ShipmentBOLCard({ shipmentId, initialData }: ShipmentBOLCardProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    freight_class: initialData.freight_class ?? '',
    nmfc_code: initialData.nmfc_code ?? '',
    declared_value: initialData.declared_value_cents ? (initialData.declared_value_cents / 100).toFixed(2) : '',
    is_hazardous: initialData.is_hazardous ?? false,
    bol_special_instructions: initialData.bol_special_instructions ?? '',
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const payload = {
      freight_class: formData.freight_class.trim() || null,
      nmfc_code: formData.nmfc_code.trim() || null,
      declared_value_cents: formData.declared_value ? Math.round(parseFloat(formData.declared_value) * 100) : 0,
      is_hazardous: formData.is_hazardous,
      bol_special_instructions: formData.bol_special_instructions.trim() || null,
    };

    try {
      const res = await fetch(`/api/shipments/${shipmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to save BOL details');
      }

      setSuccess('BOL Data Saved successfully.');
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('An error occurred while saving.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-background p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Bill of Lading (BOL) Details</h3>
          <p className="text-xs text-text-muted mt-1">Data captured here will sync with future BOL PDF generation features.</p>
        </div>
        <Button size="sm" onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save BOL Data'}
        </Button>
      </div>

      {success && <Alert variant="success" className="mb-4">{success}</Alert>}
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FormLabel>Freight Class</FormLabel>
          <FormInput
            value={formData.freight_class}
            onChange={(e) => handleChange('freight_class', e.target.value)}
            placeholder="e.g. 70, 92.5, 100"
          />
        </div>
        <div>
          <FormLabel>NMFC Code</FormLabel>
          <FormInput
            value={formData.nmfc_code}
            onChange={(e) => handleChange('nmfc_code', e.target.value)}
            placeholder="e.g. 118400-9"
          />
        </div>
        <div>
          <FormLabel>Declared Value ($)</FormLabel>
          <FormInput
            type="number"
            step="0.01"
            value={formData.declared_value}
            onChange={(e) => handleChange('declared_value', e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="flex items-center gap-2 mt-6">
          <input
            type="checkbox"
            id="hazmat-checkbox"
            checked={formData.is_hazardous}
            onChange={(e) => handleChange('is_hazardous', e.target.checked)}
            className="rounded border-border text-foreground focus:ring-foreground bg-bg-secondary w-4 h-4"
          />
          <FormLabel htmlFor="hazmat-checkbox" className="!mb-0 cursor-pointer text-sm">
            Contains Hazardous Materials (Hazmat)
          </FormLabel>
        </div>
        <div className="col-span-2">
          <FormLabel>Special Handling Instructions</FormLabel>
          <textarea
            value={formData.bol_special_instructions}
            onChange={(e) => handleChange('bol_special_instructions', e.target.value)}
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-foreground focus:outline-none"
            rows={3}
            placeholder="DNL, Do Not Stack, Protect from Freezing, Keep Upright..."
          />
        </div>
      </div>
    </div>
  );
}
