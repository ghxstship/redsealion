'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import { TierGate } from '@/components/shared/TierGate';

export default function NewSupplierPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    display_name: '',
    email: '',
    phone: '',
    website: '',
    payment_terms: 'net_30',
    category: '',
    tax_id: '',
    notes: '',
  });

  function update(field: string, value: string) {
    setForm({ ...form, [field]: value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Vendor name is required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          display_name: form.display_name || null,
          email: form.email || null,
          phone: form.phone || null,
          website: form.website || null,
          payment_terms: form.payment_terms,
          category: form.category || null,
          tax_id: form.tax_id || null,
          notes: form.notes || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create vendor');
      }

      const { vendor } = await res.json();
      router.push(`/app/procurement/suppliers/${vendor.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSaving(false);
    }
  }

  return (
    <TierGate feature="profitability">
      <PageHeader title="Add Supplier" subtitle="Register a new vendor for procurement." />

      <div className="mb-4">
        <Link href="/app/procurement/suppliers" className="text-sm text-brand-primary hover:underline">
          ← Back to Suppliers
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="rounded-xl border border-border bg-background p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Vendor Information</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Vendor Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Acme Supplies"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Display Name</label>
              <input
                type="text"
                value={form.display_name}
                onChange={(e) => update('display_name', e.target.value)}
                placeholder="Contact person name"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="vendor@example.com"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Website</label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => update('website', e.target.value)}
                placeholder="https://vendor.com"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Category</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                placeholder="e.g. Staging, AV, Catering"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Financial Details</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Payment Terms</label>
              <select
                value={form.payment_terms}
                onChange={(e) => update('payment_terms', e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="due_on_receipt">Due on Receipt</option>
                <option value="net_15">Net 15</option>
                <option value="net_30">Net 30</option>
                <option value="net_45">Net 45</option>
                <option value="net_60">Net 60</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Tax ID / EIN</label>
              <input
                type="text"
                value={form.tax_id}
                onChange={(e) => update('tax_id', e.target.value)}
                placeholder="XX-XXXXXXX"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-6 space-y-4">
          <label className="block text-xs font-medium text-text-secondary mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            rows={3}
            placeholder="Additional notes about this vendor..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground resize-none"
          />
        </div>

        <div className="flex gap-3 justify-end">
          <Link
            href="/app/procurement/suppliers"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-secondary transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand-primary px-6 py-2 text-sm font-medium text-white hover:bg-brand-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Add Supplier'}
          </button>
        </div>
      </form>
    </TierGate>
  );
}
