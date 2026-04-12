'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import Alert from '@/components/ui/Alert';
import FormTextarea from '@/components/ui/FormTextarea';

export default function GoodsReceiptForm({ onClose, onCreated }: { onClose: () => void, onCreated: () => void }) {
  const [poId, setPoId] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poId.trim()) {
      setError('PO ID is required');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/goods-receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchase_order_id: poId.trim(),
          notes: notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'Failed to create receipt');
      } else {
        onCreated();
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background border border-border rounded-lg shadow-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">New Goods Receipt</h3>
        <button onClick={onClose} className="text-text-muted hover:text-foreground">
          &times;
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert className="mb-4 text-red-600 bg-red-50 border-red-200">{error}</Alert>}

        <div>
          <FormLabel>Purchase Order ID</FormLabel>
          <FormInput
            value={poId}
            onChange={(e) => setPoId(e.target.value)}
            placeholder="e.g., 550e8400-e29b-41d4-a716-446655440000"
            required
          />
          <p className="text-xs text-text-muted mt-1">Paste PO UUID for now</p>
        </div>

        <div>
          <FormLabel>Notes</FormLabel>
          <FormTextarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-foreground focus:outline-none"
            rows={3}
            placeholder="Receipt condition, missing items, etc."
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg hover:bg-bg-secondary text-text-secondary"
          >
            Cancel
          </button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Create Receipt'}
          </Button>
        </div>
      </form>
    </div>
  );
}
