'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import EmptyState from '@/components/ui/EmptyState';

interface BundleItem {
  asset_id: string;
  quantity: number;
}

interface Asset {
  id: string;
  name: string;
}

interface BundleEditorProps {
  bundle?: {
    id: string;
    name: string;
    description: string;
    items: BundleItem[];
  };
  onClose: () => void;
  onSaved: () => void;
}

export default function BundleEditor({ bundle, onClose, onSaved }: BundleEditorProps) {
  const [name, setName] = useState(bundle?.name ?? '');
  const [description, setDescription] = useState(bundle?.description ?? '');
  const [items, setItems] = useState<BundleItem[]>(bundle?.items ?? []);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/equipment/assets')
      .then((r) => r.json())
      .then((data) => setAssets(data))
      .catch(() => {});
  }, []);

  const addItem = () => {
    setItems([...items, { asset_id: '', quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof BundleItem, value: string | number) => {
    setItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = { name, description, items };
    const url = bundle ? `/api/equipment/bundles/${bundle.id}` : '/api/equipment/bundles';
    const method = bundle ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? 'Failed to save bundle.');
      } else {
        onSaved();
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background border border-border rounded-lg shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground">
          {bundle ? 'Edit Bundle' : 'Create Bundle'}
        </h2>
        <button onClick={onClose} className="text-text-muted hover:text-foreground text-lg leading-none">
          &times;
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert className="mb-4">{error}</Alert>
        )}

        <div>
          <FormLabel>Name</FormLabel>
          <FormInput
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Bundle name" />
        </div>

        <div>
          <FormLabel>Description</FormLabel>
          <FormTextarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2} />
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

          {items.length === 0 && (
            <EmptyState message="No items added yet" className="border-0 shadow-none px-2 py-8" />
          )}

          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <FormSelect
                  value={item.asset_id}
                  onChange={(e) => updateItem(index, 'asset_id', e.target.value)}
                  required
                >
                  <option value="">Select asset</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </FormSelect>
                <FormInput
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))} />
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-red-500 hover:text-red-700 text-sm px-2"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
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
            {submitting ? 'Saving...' : 'Save Bundle'}
          </Button>
        </div>
      </form>
    </div>
  );
}
