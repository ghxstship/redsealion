'use client';

import { useState, useEffect } from 'react';

function InputField({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-white px-3.5 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
      />
    </div>
  );
}

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
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-white px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

export default function GeneralSettingsPage() {
  const [orgName, setOrgName] = useState('');
  const [slug, setSlug] = useState('');
  const [timezone, setTimezone] = useState('America/Los_Angeles');
  const [currency, setCurrency] = useState('USD');
  const [invoicePrefix, setInvoicePrefix] = useState('');
  const [proposalPrefix, setProposalPrefix] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/settings/general')
      .then((r) => r.json())
      .then((data) => {
        if (data.organization) {
          setOrgName(data.organization.name ?? '');
          setSlug(data.organization.slug ?? '');
          setTimezone(data.organization.settings?.timezone ?? 'America/Los_Angeles');
          setCurrency(data.organization.settings?.currency ?? 'USD');
          setInvoicePrefix(data.organization.settings?.invoicePrefix ?? '');
          setProposalPrefix(data.organization.settings?.proposalPrefix ?? '');
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch('/api/settings/general', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgName,
          slug,
          settings: { timezone, currency, invoicePrefix, proposalPrefix },
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
          <h2 className="text-lg font-semibold text-foreground">General</h2>
          <p className="mt-1 text-sm text-text-secondary">Core organization settings.</p>
        </div>
        <div className="rounded-xl border border-border bg-white px-6 py-6 animate-pulse h-64" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">General</h2>
        <p className="mt-1 text-sm text-text-secondary">Core organization settings.</p>
      </div>
      <div className="rounded-xl border border-border bg-white px-6 py-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Organization</h3>
        <div className="space-y-5">
          <InputField label="Organization Name" value={orgName} onChange={setOrgName} />
          <InputField label="URL Slug" value={slug} onChange={setSlug} />
          <SelectField
            label="Timezone"
            options={['America/Los_Angeles', 'America/New_York', 'America/Chicago', 'America/Denver', 'Europe/London', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Singapore', 'Australia/Sydney']}
            value={timezone}
            onChange={setTimezone}
          />
          <SelectField
            label="Currency"
            options={['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD', 'SGD', 'JPY']}
            value={currency}
            onChange={setCurrency}
          />
          <InputField label="Invoice Prefix" value={invoicePrefix} onChange={setInvoicePrefix} />
          <InputField label="Proposal Prefix" value={proposalPrefix} onChange={setProposalPrefix} />
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-foreground/90 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
