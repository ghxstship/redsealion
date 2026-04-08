'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';

interface Facility {
  id: string;
  name: string;
}

interface TransferItem {
  assetSearch: string;
  assetId: string;
  quantity: number;
}

interface TransferFormProps {
  facilities: Facility[];
  onCreated: () => void;
  onClose: () => void;
}

export default function TransferForm({ facilities, onCreated, onClose }: TransferFormProps) {
  const [fromFacilityId, setFromFacilityId] = useState('');
  const [toFacilityId, setToFacilityId] = useState('');
  const [items, setItems] = useState<TransferItem[]>([{ assetSearch: '', assetId: '', quantity: 1 }]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Record<number, Array<{ id: string; name: string }>>>({});

  const addItem = () => {
    setItems([...items, { assetSearch: '', assetId: '', quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    setSearchResults((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const updateItem = (index: number, field: keyof TransferItem, value: string | number) => {
    setItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const searchAssets = async (index: number, query: string) => {
    updateItem(index, 'assetSearch', query);
    if (query.length < 2) {
      setSearchResults((prev) => ({ ...prev, [index]: [] }));
      return;
    }

    try {
      const res = await fetch(`/api/equipment/assets?search=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults((prev) => ({ ...prev, [index]: data }));
    } catch (error) {
        void error; /* Caught: error boundary handles display */
      }
  };

  const selectAsset = (index: number, asset: { id: string; name: string }) => {
    setItems(
      items.map((item, i) =>
        i === index ? { ...item, assetId: asset.id, assetSearch: asset.name } : item,
      ),
    );
    setSearchResults((prev) => ({ ...prev, [index]: [] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fromFacilityId === toFacilityId) {
      setError('Source and destination facilities must be different.');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/warehouse/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_facility_id: fromFacilityId,
          to_facility_id: toFacilityId,
          items: items.map((i) => ({ asset_id: i.assetId, quantity: i.quantity })),
          notes: notes || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? 'Failed to create transfer.');
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
        <h2 className="text-base font-semibold text-foreground">Create Transfer</h2>
        <button onClick={onClose} className="text-text-muted hover:text-foreground text-lg leading-none">
          &times;
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert className="mb-4">{error}</Alert>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FormLabel>From Facility</FormLabel>
            <FormSelect
              value={fromFacilityId}
              onChange={(e) => setFromFacilityId(e.target.value)}
              required
            >
              <option value="">Select</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </FormSelect>
          </div>
          <div>
            <FormLabel>To Facility</FormLabel>
            <FormSelect
              value={toFacilityId}
              onChange={(e) => setToFacilityId(e.target.value)}
              required
            >
              <option value="">Select</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </FormSelect>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <FormLabel>Items</FormLabel>
            <button
              type="button"
              onClick={addItem}
              className="px-3 py-1 text-xs rounded-lg bg-bg-secondary text-foreground hover:bg-bg-tertiary"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <FormInput
                    type="text"
                    value={item.assetSearch}
                    onChange={(e) => searchAssets(index, e.target.value)}
                    placeholder="Search asset..."
                    required={!item.assetId} />
                  {searchResults[index] && searchResults[index].length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-sm max-h-32 overflow-y-auto">
                      {searchResults[index].map((asset) => (
                        <li key={asset.id}>
                          <button
                            type="button"
                            onClick={() => selectAsset(index, asset)}
                            className="w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-bg-secondary"
                          >
                            {asset.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <FormInput
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))} />
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-500 hover:text-red-700 text-sm px-2"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <FormLabel>Notes</FormLabel>
          <FormTextarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg bg-bg-secondary text-foreground hover:bg-bg-tertiary"
          >
            Cancel
          </button>
          <Button type="submit"
            disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Transfer'}
          </Button>
        </div>
      </form>
    </div>
  );
}
