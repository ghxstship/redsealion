'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import Alert from '@/components/ui/Alert';

const CATEGORIES = [
  'AV / Production',
  'Catering',
  'Decor & Florals',
  'Entertainment',
  'Fabrication',
  'Furniture Rental',
  'Graphics & Print',
  'Lighting',
  'Photography / Video',
  'Staffing',
  'Technology',
  'Transportation',
  'Venue',
  'Other',
];

const PAYMENT_TERMS = [
  { value: 'net_15', label: 'Net 15' },
  { value: 'net_30', label: 'Net 30' },
  { value: 'net_45', label: 'Net 45' },
  { value: 'net_60', label: 'Net 60' },
  { value: 'due_on_receipt', label: 'Due on Receipt' },
  { value: 'prepaid', label: 'Prepaid' },
];

export default function NewVendorPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    display_name: '',
    email: '',
    phone: '',
    website: '',
    category: '',
    payment_terms: 'net_30',
    tax_id: '',
    notes: '',
    address_street: '',
    address_city: '',
    address_state: '',
    address_zip: '',
    address_country: 'US',
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Vendor name is required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          display_name: form.display_name.trim() || null,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          website: form.website.trim() || null,
          category: form.category || null,
          payment_terms: form.payment_terms,
          tax_id: form.tax_id.trim() || null,
          notes: form.notes.trim() || null,
          address: {
            street: form.address_street,
            city: form.address_city,
            state: form.address_state,
            zip: form.address_zip,
            country: form.address_country,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to create vendor.');
        return;
      }

      router.push('/app/finance/vendors');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Button variant="ghost" href="/app/finance/vendors" className="mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Vendors
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Add Vendor</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Add a new supplier or vendor to your organization.
        </p>
      </div>

      {error && <Alert className="mb-6">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-xl border border-border bg-white px-6 py-6">
          <h2 className="text-sm font-semibold text-foreground mb-5">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <FormLabel>Vendor Name *</FormLabel>
              <FormInput
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g. Acme Productions"
                required
              />
            </div>
            <div>
              <FormLabel>Display Name</FormLabel>
              <FormInput
                type="text"
                value={form.display_name}
                onChange={(e) => updateField('display_name', e.target.value)}
                placeholder="Optional — if different from company name"
              />
            </div>
            <div>
              <FormLabel>Category</FormLabel>
              <FormSelect
                value={form.category}
                onChange={(e) => updateField('category', e.target.value)}
              >
                <option value="">Select category...</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </FormSelect>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="rounded-xl border border-border bg-white px-6 py-6">
          <h2 className="text-sm font-semibold text-foreground mb-5">Contact Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FormLabel>Email</FormLabel>
              <FormInput
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="vendor@example.com"
              />
            </div>
            <div>
              <FormLabel>Phone</FormLabel>
              <FormInput
                type="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="sm:col-span-2">
              <FormLabel>Website</FormLabel>
              <FormInput
                type="url"
                value={form.website}
                onChange={(e) => updateField('website', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="rounded-xl border border-border bg-white px-6 py-6">
          <h2 className="text-sm font-semibold text-foreground mb-5">Address</h2>
          <div className="space-y-4">
            <div>
              <FormLabel>Street</FormLabel>
              <FormInput
                type="text"
                value={form.address_street}
                onChange={(e) => updateField('address_street', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="col-span-2 sm:col-span-2">
                <FormLabel>City</FormLabel>
                <FormInput
                  type="text"
                  value={form.address_city}
                  onChange={(e) => updateField('address_city', e.target.value)}
                />
              </div>
              <div>
                <FormLabel>State</FormLabel>
                <FormInput
                  type="text"
                  value={form.address_state}
                  onChange={(e) => updateField('address_state', e.target.value)}
                />
              </div>
              <div>
                <FormLabel>ZIP</FormLabel>
                <FormInput
                  type="text"
                  value={form.address_zip}
                  onChange={(e) => updateField('address_zip', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Financial */}
        <div className="rounded-xl border border-border bg-white px-6 py-6">
          <h2 className="text-sm font-semibold text-foreground mb-5">Financial Details</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FormLabel>Payment Terms</FormLabel>
              <FormSelect
                value={form.payment_terms}
                onChange={(e) => updateField('payment_terms', e.target.value)}
              >
                {PAYMENT_TERMS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </FormSelect>
            </div>
            <div>
              <FormLabel>Tax ID / EIN</FormLabel>
              <FormInput
                type="text"
                value={form.tax_id}
                onChange={(e) => updateField('tax_id', e.target.value)}
                placeholder="XX-XXXXXXX"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-xl border border-border bg-white px-6 py-6">
          <h2 className="text-sm font-semibold text-foreground mb-5">Notes</h2>
          <FormTextarea
            rows={4}
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="Any additional notes about this vendor..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" href="/app/finance/vendors">
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Creating...' : 'Create Vendor'}
          </Button>
        </div>
      </form>
    </div>
  );
}
