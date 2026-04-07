'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';

export default function TaxSettingsPage() {
  const [defaultRate, setDefaultRate] = useState('0');
  const [taxLabel, setTaxLabel] = useState('Tax');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings/general')
      .then((r) => r.json())
      .then((data) => {
        const org = data.organization;
        if (org) {
          setDefaultRate(String(org.default_tax_rate ?? 0));
          setTaxLabel(org.tax_label ?? 'Tax');
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch('/api/settings/tax', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          default_tax_rate: parseFloat(defaultRate) || 0,
          tax_label: taxLabel.trim() || 'Tax',
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Tax Settings</h2>
          <p className="mt-1 text-sm text-text-secondary">Configure default tax rates for invoicing.</p>
        </div>
        <Skeleton />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Tax Settings</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Configure the default tax rate and label applied to new invoices.
        </p>
      </div>

      <Card>
        <h3 className="text-sm font-semibold text-foreground mb-5">Default Tax Configuration</h3>
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <FormLabel>Default Tax Rate</FormLabel>
              <div className="relative">
                <FormInput
                  type="number"
                  value={defaultRate}
                  onChange={(e) => setDefaultRate(e.target.value)}
                  step="0.01"
                  min="0"
                  max="100"
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">%</span>
              </div>
              <p className="mt-1.5 text-xs text-text-muted">
                Applied to taxable line items when no specific rate is set.
              </p>
            </div>
            <div>
              <FormLabel>Tax Label</FormLabel>
              <FormInput
                type="text"
                value={taxLabel}
                onChange={(e) => setTaxLabel(e.target.value)}
                placeholder="Tax"
              />
              <p className="mt-1.5 text-xs text-text-muted">
                Label shown on invoices (e.g. &quot;Tax&quot;, &quot;VAT&quot;, &quot;GST&quot;, &quot;Sales Tax&quot;).
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="rounded-xl border border-border bg-bg-secondary/30 p-4">
        <p className="text-xs text-text-muted">
          <strong>Note:</strong> Setting a default tax rate of 0% means invoices will not include tax by default.
          Individual line items can still have their own tax rate set during invoice creation.
          For organizations outside the US, change the label to match your local tax nomenclature (e.g. VAT, GST).
        </p>
      </div>

      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="text-sm text-green-600 font-medium">Settings saved.</span>
        )}
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
