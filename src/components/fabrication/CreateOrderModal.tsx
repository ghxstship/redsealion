'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@/components/ui/Alert';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import Button from '@/components/ui/Button';

export default function CreateOrderModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get('name'),
      order_type: fd.get('order_type'),
      quantity: Number(fd.get('quantity') || 1),
      priority: fd.get('priority') || 'medium',
      due_date: fd.get('due_date') || null,
      notes: fd.get('notes'),
    };

    try {
      const res = await fetch('/api/fabrication/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onClose();
        router.refresh();
      } else {
        setError('Failed to create order');
      }
    } catch {
      setError('Error creating order');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-background border border-border shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-bg-secondary/50">
          <h2 className="text-lg font-semibold text-foreground">Create Production Order</h2>
          <Button onClick={onClose} className="text-text-muted hover:text-foreground text-xl">&times;</Button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Order Name / Description</label>
            <FormInput required name="name" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Main Stage Backdrop" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Type</label>
              <FormSelect name="order_type" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="fabrication">Fabrication</option>
                <option value="print">Print</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="custom">Custom</option>
              </FormSelect>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Priority</label>
              <FormSelect name="priority" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </FormSelect>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Quantity</label>
              <FormInput type="number" min="1" defaultValue="1" name="quantity" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Due Date</label>
              <FormInput type="date" name="due_date" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Initial Notes / Instructions</label>
            <FormTextarea name="notes" rows={3} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Optional notes for the shop floor..."></FormTextarea>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
            <Button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-foreground">Cancel</Button>
            <Button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Order'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
