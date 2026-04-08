'use client';

import { useState, useEffect } from 'react';
import StripeConnectSetup from '@/components/admin/payments/StripeConnectSetup';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function PaymentSettingsPage() {
  const [instructions, setInstructions] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/settings/general')
      .then((r) => r.json())
      .then((data) => {
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
        body: JSON.stringify({ payment_instructions: instructions }),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Payment Settings"
        subtitle="Configure how your organization accepts payments."
      />

      <div className="max-w-2xl space-y-6">
        {/* Stripe Connect */}
        <StripeConnectSetup />

        {/* Payment Instructions */}
        <Card>
          <h2 className="text-sm font-semibold text-foreground mb-5">Payment Instructions</h2>
          <p className="text-sm text-text-muted mb-3">
            Custom instructions shown to clients on invoices (e.g. wire transfer details, check mailing address).
          </p>
          <textarea
            rows={4}
            value={loaded ? instructions : ''}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Enter payment instructions for your clients..."
            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 resize-none"
          />
        </Card>

        {/* Payment Link Configuration */}
        <Card>
          <h2 className="text-sm font-semibold text-foreground mb-5">Payment Link Configuration</h2>
          <p className="text-sm text-text-muted mb-3">
            When Stripe Connect is active, payment links are created on your connected account so
            funds go directly to your bank account.
          </p>
          <div className="rounded-lg border border-border bg-bg-secondary px-4 py-3">
            <p className="text-xs text-text-muted">
              Payment links are generated automatically when you send invoices.
              Connect your Stripe account above to enable direct payouts.
            </p>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </>
  );
}
