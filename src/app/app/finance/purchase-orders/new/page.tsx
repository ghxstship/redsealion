'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import Alert from '@/components/ui/Alert';

interface VendorOption {
  id: string;
  name: string;
}

interface ProposalOption {
  id: string;
  name: string;
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [proposals, setProposals] = useState<ProposalOption[]>([]);

  const [form, setForm] = useState({
    vendor_id: '',
    vendor_name: '',
    description: '',
    total_amount: '',
    proposal_id: '',
    due_date: '',
  });

  useEffect(() => {
    // Fetch vendors
    fetch('/api/vendors?status=active')
      .then((r) => r.json())
      .then((data) => setVendors(data.vendors ?? []))
      .catch(() => {});
    // Fetch proposals for project link
    fetch('/api/proposals')
      .then((r) => r.json())
      .then((data) => setProposals((data.proposals ?? []).map((p: Record<string, unknown>) => ({
        id: p.id as string,
        name: p.name as string,
      }))))
      .catch(() => {});
  }, []);

  function handleVendorChange(vendorId: string) {
    const vendor = vendors.find((v) => v.id === vendorId);
    setForm((prev) => ({
      ...prev,
      vendor_id: vendorId,
      vendor_name: vendor?.name ?? '',
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.vendor_name.trim()) {
      setError('Vendor is required.');
      return;
    }
    if (!form.total_amount || parseFloat(form.total_amount) <= 0) {
      setError('Total amount must be greater than 0.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_name: form.vendor_name.trim(),
          vendor_id: form.vendor_id || undefined,
          description: form.description.trim() || undefined,
          total_amount: parseFloat(form.total_amount),
          proposal_id: form.proposal_id || undefined,
          due_date: form.due_date || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to create purchase order.');
        return;
      }

      router.push('/app/finance/purchase-orders');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          href="/app/finance/purchase-orders"
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Purchase Orders
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          New Purchase Order
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Create a new purchase order for vendor procurement.
        </p>
      </div>

      {error && <Alert className="mb-6">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vendor Selection */}
        <div className="rounded-xl border border-border bg-white px-6 py-6">
          <h2 className="text-sm font-semibold text-foreground mb-5">Vendor</h2>
          <div className="space-y-4">
            {vendors.length > 0 ? (
              <div>
                <FormLabel>Select Vendor</FormLabel>
                <FormSelect
                  value={form.vendor_id}
                  onChange={(e) => handleVendorChange(e.target.value)}
                >
                  <option value="">Select a vendor...</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </FormSelect>
                <p className="mt-1.5 text-xs text-text-muted">
                  Or type a custom vendor name below if not in database.
                </p>
              </div>
            ) : null}
            <div>
              <FormLabel>Vendor Name {vendors.length > 0 ? '(override)' : '*'}</FormLabel>
              <FormInput
                type="text"
                value={form.vendor_name}
                onChange={(e) => setForm((prev) => ({ ...prev, vendor_name: e.target.value }))}
                placeholder="e.g. Acme Productions"
                required={vendors.length === 0}
              />
            </div>
          </div>
        </div>

        {/* PO Details */}
        <div className="rounded-xl border border-border bg-white px-6 py-6">
          <h2 className="text-sm font-semibold text-foreground mb-5">Order Details</h2>
          <div className="space-y-4">
            <div>
              <FormLabel>Description</FormLabel>
              <FormTextarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="What is being ordered..."
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FormLabel>Total Amount *</FormLabel>
                <FormInput
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.total_amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, total_amount: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <FormLabel>Due Date</FormLabel>
                <FormInput
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm((prev) => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Project Link */}
        {proposals.length > 0 && (
          <div className="rounded-xl border border-border bg-white px-6 py-6">
            <h2 className="text-sm font-semibold text-foreground mb-5">Project Link</h2>
            <div>
              <FormLabel>Associate with Project</FormLabel>
              <FormSelect
                value={form.proposal_id}
                onChange={(e) => setForm((prev) => ({ ...prev, proposal_id: e.target.value }))}
              >
                <option value="">No project</option>
                {proposals.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </FormSelect>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            href="/app/finance/purchase-orders"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Creating...' : 'Create Purchase Order'}
          </Button>
        </div>
      </form>
    </div>
  );
}
