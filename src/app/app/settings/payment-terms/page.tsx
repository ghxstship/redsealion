'use client';

import FormInput from '@/components/ui/FormInput';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';

import { RoleGate } from '@/components/shared/RoleGate';
function SelectField({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <FormSelect
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </FormSelect>
    </div>
  );
}

function PercentField({
  label,
  value,
  onChange,
  step = '1',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        <FormInput
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          step={step}
          className="w-full rounded-lg border border-border bg-background px-3.5 py-2 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">%</span>
      </div>
    </div>
  );
}

export default function PaymentTermsSettingsPage() {
  const [structure, setStructure] = useState('50/50');
  const [deposit, setDeposit] = useState('50');
  const [balance, setBalance] = useState('50');
  const [lateFee, setLateFee] = useState('1.5');
  const [ccSurcharge, setCcSurcharge] = useState('3');
  const [instructions, setInstructions] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/settings/general')
      .then((r) => r.json())
      .then((data) => {
        const terms = data.organization?.default_payment_terms;
        if (terms) {
          setStructure(terms.structure ?? '50/50');
          setDeposit(String(terms.depositPercent ?? 50));
          setBalance(String(terms.balancePercent ?? 50));
          setLateFee(String(terms.lateFeeRate ?? 1.5));
          setCcSurcharge(String(terms.creditCardSurcharge ?? 3));
        }
        setInstructions(data.organization?.payment_instructions ?? '');
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch('/api/settings/payment-terms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          default_payment_terms: {
            structure,
            depositPercent: parseFloat(deposit),
            balancePercent: parseFloat(balance),
            lateFeeRate: parseFloat(lateFee),
            creditCardSurcharge: parseFloat(ccSurcharge),
          },
          payment_instructions: instructions,
        }),
      });
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Payment Terms</h2>
          <p className="mt-1 text-sm text-text-secondary">Default payment structure for new proposals.</p>
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <RoleGate resource="settings">
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Payment Terms</h2>
        <p className="mt-1 text-sm text-text-secondary">Default payment structure for new proposals.</p>
      </div>

      <Card>
        <h3 className="text-sm font-semibold text-foreground mb-5">Default Structure</h3>
        <div className="space-y-5">
          <SelectField
            label="Payment Structure"
            options={['50/50', '40/40/20', '30/30/30/10', '100% Upfront', '100% On Completion', 'Custom']}
            value={structure}
            onChange={setStructure}
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <PercentField label="Deposit Percentage" value={deposit} onChange={setDeposit} />
            <PercentField label="Balance Percentage" value={balance} onChange={setBalance} />
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-foreground mb-5">Fees &amp; Surcharges</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <PercentField label="Late Fee Rate (Monthly)" value={lateFee} onChange={setLateFee} step="0.1" />
          <PercentField label="Credit Card Surcharge" value={ccSurcharge} onChange={setCcSurcharge} step="0.1" />
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-foreground mb-5">Payment Instructions</h3>
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
            Default Instructions (shown on invoices)
          </label>
          <FormTextarea
            rows={3}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 resize-none"
          />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  
    </RoleGate>);
}
