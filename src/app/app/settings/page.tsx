'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import FormSelect from '@/components/ui/FormSelect';
import Alert from '@/components/ui/Alert';



export default function GeneralSettingsPage() {
  const [orgName, setOrgName] = useState('');
  const [slug, setSlug] = useState('');
  const [timezone, setTimezone] = useState('America/Los_Angeles');
  const [currency, setCurrency] = useState('USD');
  const [invoicePrefix, setInvoicePrefix] = useState('');
  const [proposalPrefix, setProposalPrefix] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

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
    setSaveStatus('idle');
    try {
      const res = await fetch('/api/settings/general', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgName,
          slug,
          settings: { timezone, currency, invoicePrefix, proposalPrefix },
        }),
      });
      setSaveStatus(res.ok ? 'success' : 'error');
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  }

  if (!loaded) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">General</h2>
          <p className="mt-1 text-sm text-text-secondary">Core organization settings.</p>
        </div>
        <Skeleton height="h-64" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">General</h2>
        <p className="mt-1 text-sm text-text-secondary">Core organization settings.</p>
      </div>
      <Card>
        <h3 className="text-sm font-semibold text-foreground mb-5">Organization</h3>
        <div className="space-y-5">
          <div>
            <FormLabel>Organization Name</FormLabel>
            <FormInput value={orgName} onChange={(e) => setOrgName(e.target.value)} />
          </div>
          <div>
            <FormLabel>URL Slug</FormLabel>
            <FormInput value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
          <div>
            <FormLabel>Timezone</FormLabel>
            <FormSelect value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {['America/Los_Angeles', 'America/New_York', 'America/Chicago', 'America/Denver', 'Europe/London', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Singapore', 'Australia/Sydney'].map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </FormSelect>
          </div>
          <div>
            <FormLabel>Currency</FormLabel>
            <FormSelect value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD', 'SGD', 'JPY'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </FormSelect>
          </div>
          <div>
            <FormLabel>Invoice Prefix</FormLabel>
            <FormInput value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} />
          </div>
          <div>
            <FormLabel>Proposal Prefix</FormLabel>
            <FormInput value={proposalPrefix} onChange={(e) => setProposalPrefix(e.target.value)} />
          </div>
        </div>
      </Card>
      {saveStatus === 'success' && (
        <Alert variant="success">Settings saved successfully.</Alert>
      )}
      {saveStatus === 'error' && (
        <Alert variant="error">Failed to save settings. Please try again.</Alert>
      )}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
