'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import Alert from '@/components/ui/Alert';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

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

interface VendorData {
  id: string;
  name: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  payment_terms: string;
  tax_id: string | null;
  currency: string;
  category: string | null;
  w9_on_file: boolean;
  w9_received_date: string | null;
  status: string;
  notes: string | null;
}

export default function VendorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const vendorId = params.id as string;

  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

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
    status: 'active',
    w9_on_file: false,
    w9_received_date: '',
    address_street: '',
    address_city: '',
    address_state: '',
    address_zip: '',
    address_country: 'US',
  });

  const loadVendor = useCallback(async () => {
    try {
      const res = await fetch(`/api/vendors/${vendorId}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      const v = data.vendor as VendorData;
      setVendor(v);
      setForm({
        name: v.name,
        display_name: v.display_name ?? '',
        email: v.email ?? '',
        phone: v.phone ?? '',
        website: v.website ?? '',
        category: v.category ?? '',
        payment_terms: v.payment_terms ?? 'net_30',
        tax_id: v.tax_id ?? '',
        notes: v.notes ?? '',
        status: v.status,
        w9_on_file: v.w9_on_file,
        w9_received_date: v.w9_received_date ?? '',
        address_street: v.address?.street ?? '',
        address_city: v.address?.city ?? '',
        address_state: v.address?.state ?? '',
        address_zip: v.address?.zip ?? '',
        address_country: v.address?.country ?? 'US',
      });
    } catch {
      setError('Vendor not found.');
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => { loadVendor(); }, [loadVendor]);

  function updateField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Vendor name is required.');
      return;
    }

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch(`/api/vendors/${vendorId}`, {
        method: 'PATCH',
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
          status: form.status,
          w9_on_file: form.w9_on_file,
          w9_received_date: form.w9_received_date || null,
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
        setError(data.error || 'Failed to save vendor.');
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/vendors/${vendorId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      router.push('/app/finance/vendors');
    } catch {
      setError('Failed to delete vendor.');
      setShowDelete(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="rounded-xl border border-border bg-white px-6 py-6 animate-pulse h-48" />
        <div className="rounded-xl border border-border bg-white px-6 py-6 animate-pulse h-48" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-sm text-text-muted">Vendor not found.</p>
        <Button variant="ghost" href="/app/finance/vendors" className="mt-3">
          Back to Vendors
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Button variant="ghost" href="/app/finance/vendors" className="mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Vendors
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {vendor.display_name || vendor.name}
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Edit vendor details and compliance status.
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => setShowDelete(true)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {error && <Alert className="mb-6">{error}</Alert>}

      <form onSubmit={handleSave} className="space-y-6">
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <div>
                <FormLabel>Status</FormLabel>
                <FormSelect
                  value={form.status}
                  onChange={(e) => updateField('status', e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </FormSelect>
              </div>
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

        {/* Financial & Compliance */}
        <div className="rounded-xl border border-border bg-white px-6 py-6">
          <h2 className="text-sm font-semibold text-foreground mb-5">Financial & Compliance</h2>
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
            <div className="sm:col-span-2">
              <div className="flex items-center gap-3">
                <input
                  id="w9_on_file"
                  type="checkbox"
                  checked={form.w9_on_file}
                  onChange={(e) => updateField('w9_on_file', e.target.checked)}
                  className="h-4 w-4 rounded border-border text-foreground focus:ring-foreground/10"
                />
                <label htmlFor="w9_on_file" className="text-sm font-medium text-foreground">
                  W-9 on file
                </label>
              </div>
            </div>
            {form.w9_on_file && (
              <div>
                <FormLabel>W-9 Received Date</FormLabel>
                <FormInput
                  type="date"
                  value={form.w9_received_date}
                  onChange={(e) => updateField('w9_received_date', e.target.value)}
                />
              </div>
            )}
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
        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="text-sm text-green-600 font-medium">Saved.</span>
          )}
          <Button variant="secondary" href="/app/finance/vendors">
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={showDelete}
        title="Delete Vendor"
        message={`Are you sure you want to delete "${vendor.display_name || vendor.name}"? This action cannot be undone.`}
        confirmLabel="Delete Vendor"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
