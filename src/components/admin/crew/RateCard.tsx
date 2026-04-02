'use client';

import React, { useState } from 'react';

interface Rates {
  hourly: number | null;
  day: number | null;
  ot: number | null;
  perDiem: number | null;
  travel: number | null;
}

interface RateCardProps {
  profileId: string;
  rates: Rates;
  onSaved: () => void;
}

const RATE_FIELDS: { key: keyof Rates; label: string }[] = [
  { key: 'hourly', label: 'Hourly Rate' },
  { key: 'day', label: 'Day Rate' },
  { key: 'ot', label: 'Overtime Rate' },
  { key: 'perDiem', label: 'Per Diem' },
  { key: 'travel', label: 'Travel Rate' },
];

export default function RateCard({ profileId, rates, onSaved }: RateCardProps) {
  const [values, setValues] = useState<Rates>(rates);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const updateField = (key: keyof Rates, raw: string) => {
    setValues((prev) => ({
      ...prev,
      [key]: raw === '' ? null : Number(raw),
    }));
    setSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/crew/profiles/${profileId}/rates`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? 'Failed to save rates.');
      } else {
        setSuccess(true);
        onSaved();
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (val: number | null) =>
    val != null ? `$${val.toFixed(2)}` : '';

  return (
    <div className="bg-white border border-border rounded-lg shadow-sm p-5">
      <h2 className="text-base font-semibold text-foreground mb-4">Rate Card</h2>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800 mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800 mb-4">
          Rates saved successfully.
        </div>
      )}

      <div className="space-y-3">
        {RATE_FIELDS.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-3">
            <label className="text-sm text-foreground font-medium w-32 shrink-0">{label}</label>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={values[key] ?? ''}
                onChange={(e) => updateField(key, e.target.value)}
                placeholder={formatCurrency(rates[key]) || '0.00'}
                className="w-full border border-border rounded-lg pl-7 pr-3 py-2 text-sm text-foreground"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-sm rounded-lg bg-foreground text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Rates'}
        </button>
      </div>
    </div>
  );
}
