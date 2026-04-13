'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import FormSelect from '@/components/ui/FormSelect';
import FormLabel from '@/components/ui/FormLabel';

interface NewCountFormProps {
  onCreated: () => void;
  onClose: () => void;
}

export default function NewCountForm({ onCreated, onClose }: NewCountFormProps) {
  const [countType, setCountType] = useState('full');
  const [facilityId, setFacilityId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/facilities/search');
        if (res.ok) {
          const body = await res.json();
          setFacilities(body.facilities || []);
        }
      } catch {
        // Ignore init error
      }
    }
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/warehouse/counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count_type: countType,
          facility_id: facilityId || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'Failed to create inventory count.');
      } else {
        onCreated();
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background border border-border rounded-lg shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground">New Inventory Count</h2>
        <button onClick={onClose} className="text-text-muted hover:text-foreground text-lg leading-none">
          &times;
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert className="mb-4 text-red-600 bg-red-500/10 border-red-500/30">{error}</Alert>}

        <div className="space-y-3">
          <div>
            <FormLabel>Count Type</FormLabel>
            <FormSelect
              value={countType}
              onChange={(e) => setCountType(e.target.value)}
              required
            >
              <option value="full">Full Inventory (All Assets)</option>
              <option value="cycle">Cycle Count (Partial)</option>
              {facilities.length > 0 && <option value="location">Location Specific</option>}
            </FormSelect>
          </div>

          {(countType === 'location' || (facilities.length > 0 && countType === 'cycle')) && (
            <div>
              <FormLabel>Location / Facility</FormLabel>
              <FormSelect
                value={facilityId}
                onChange={(e) => setFacilityId(e.target.value)}
                required={countType === 'location'}
              >
                <option value="">Select Facility...</option>
                {facilities.map((fac) => (
                  <option key={fac.id} value={fac.id}>{fac.name}</option>
                ))}
              </FormSelect>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg bg-bg-secondary text-foreground hover:bg-bg-tertiary"
          >
            Cancel
          </button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Start Count'}
          </Button>
        </div>
      </form>
    </div>
  );
}
