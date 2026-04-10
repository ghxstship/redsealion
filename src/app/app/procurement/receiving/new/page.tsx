'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import { TierGate } from '@/components/shared/TierGate';

interface PO {
  id: string;
  po_number: string;
  vendor_name: string;
  status: string;
  total_amount: number;
}

export default function NewReceiptPage() {
  const router = useRouter();
  const [pos, setPOs] = useState<PO[]>([]);
  const [selectedPO, setSelectedPO] = useState('');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/purchase-orders?status=sent')
      .then((r) => r.json())
      .then((data) => {
        // Include POs that can have goods received
        const eligible = (data.purchase_orders ?? []).filter(
          (po: PO) => ['sent', 'acknowledged', 'approved', 'partially_received'].includes(po.status),
        );
        setPOs(eligible);
      })
      .catch(() => {});

    // Also fetch all non-draft POs as fallback
    fetch('/api/purchase-orders')
      .then((r) => r.json())
      .then((data) => {
        const eligible = (data.purchase_orders ?? []).filter(
          (po: PO) => !['draft', 'received', 'closed', 'cancelled'].includes(po.status),
        );
        setPOs(eligible);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPO) {
      setError('Please select a purchase order.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/goods-receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchase_order_id: selectedPO,
          received_date: receivedDate,
          notes: notes || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create receipt');
      }

      const { receipt } = await res.json();
      router.push(`/app/procurement/receiving/${receipt.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSaving(false);
    }
  }

  return (
    <TierGate feature="profitability">
      <PageHeader title="Log Goods Receipt" subtitle="Record an incoming delivery against a purchase order." />

      <div className="mb-4">
        <Link href="/app/procurement/receiving" className="text-sm text-brand-primary hover:underline">
          ← Back to Receiving
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="rounded-xl border border-border bg-background p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Receipt Details</h3>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Purchase Order *</label>
            <select
              value={selectedPO}
              onChange={(e) => setSelectedPO(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              required
            >
              <option value="">Select a PO...</option>
              {pos.map((po) => (
                <option key={po.id} value={po.id}>
                  {po.po_number} — {po.vendor_name} (${po.total_amount?.toFixed(2)})
                </option>
              ))}
            </select>
            {pos.length === 0 && (
              <p className="mt-1 text-xs text-text-muted">No eligible POs found. POs must be sent/acknowledged/approved.</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Received Date</label>
            <input
              type="date"
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Delivery notes, condition observations, packing slip reference..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link
            href="/app/procurement/receiving"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-secondary transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || !selectedPO}
            className="rounded-lg bg-brand-primary px-6 py-2 text-sm font-medium text-white hover:bg-brand-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Logging...' : 'Log Receipt'}
          </button>
        </div>
      </form>
    </TierGate>
  );
}
