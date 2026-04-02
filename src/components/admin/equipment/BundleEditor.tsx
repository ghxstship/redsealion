'use client';

import React, { useState, useEffect } from 'react';

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
    <div className="bg-white border border-border rounded-lg shadow-sm p-5">
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
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground"
            placeholder="Bundle name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground resize-none"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">Items</label>
            <button
              type="button"
              onClick={addItem}
              className="px-3 py-1 text-xs rounded-lg bg-bg-secondary text-foreground hover:bg-bg-tertiary"
            >
              + Add Item
            </button>
          </div>

          {items.length === 0 && (
            <p className="text-sm text-text-muted">No items added yet.</p>
          )}

          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <select
                  value={item.asset_id}
                  onChange={(e) => updateItem(index, 'asset_id', e.target.value)}
                  required
                  className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-white text-foreground"
                >
                  <option value="">Select asset</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                  className="w-20 border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                />
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
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-sm rounded-lg bg-foreground text-white hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save Bundle'}
          </button>
        </div>
      </form>
    </div>
  );
}
