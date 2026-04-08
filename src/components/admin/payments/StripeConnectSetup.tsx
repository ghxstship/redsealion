'use client';

import { CheckCircle2, Check, X } from 'lucide-react';

import { useState, useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';

interface ConnectStatus {
  connected: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
}

type OnboardingState = 'loading' | 'not_connected' | 'pending' | 'active';

export default function StripeConnectSetup() {
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [state, setState] = useState<OnboardingState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/payments/connect');
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to fetch Connect status.');
        setState('not_connected');
        return;
      }
      const data: ConnectStatus = await res.json();
      setStatus(data);

      if (!data.connected) {
        setState('not_connected');
      } else if (data.charges_enabled) {
        setState('active');
      } else {
        setState('pending');
      }
    } catch {
      setError('Failed to fetch Connect status.');
      setState('not_connected');
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  async function handleConnect() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/payments/connect', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to start onboarding.');
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('Failed to start onboarding.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleContinue() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/payments/connect/refresh');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to generate onboarding link.');
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('Failed to generate onboarding link.');
    } finally {
      setIsLoading(false);
    }
  }

  if (state === 'loading') {
    return (
      <div className="rounded-xl border border-border bg-background px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-foreground" />
          <p className="text-sm text-text-muted">Loading Stripe Connect status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-background px-6 py-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-foreground">Stripe Connect</h2>
        {state === 'not_connected' && (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            Not connected
          </span>
        )}
        {state === 'pending' && (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
            Pending
          </span>
        )}
        {state === 'active' && (
          <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
            Connected
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {state === 'not_connected' && (
        <div>
          <p className="text-sm text-text-muted mb-4">
            Connect your Stripe account to accept payments directly into your bank account.
            You&apos;ll be redirected to Stripe to complete the setup.
          </p>
          <Button onClick={handleConnect}
            disabled={isLoading}>
            {isLoading ? 'Connecting...' : 'Connect with Stripe'}
          </Button>
        </div>
      )}

      {state === 'pending' && (
        <div>
          <p className="text-sm text-text-muted mb-4">
            Your Stripe account has been created but onboarding is not yet complete.
            Please continue the setup to start accepting payments.
          </p>
          <div className="mb-4 space-y-2">
            <StatusRow
              label="Details submitted"
              enabled={status?.details_submitted ?? false}
            />
            <StatusRow
              label="Charges enabled"
              enabled={status?.charges_enabled ?? false}
            />
            <StatusRow
              label="Payouts enabled"
              enabled={status?.payouts_enabled ?? false}
            />
          </div>
          <Button onClick={handleContinue}
            disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Continue Setup'}
          </Button>
        </div>
      )}

      {state === 'active' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={20} className="text-green-500" />
            <p className="text-sm font-medium text-foreground">
              Your Stripe account is fully connected and active.
            </p>
          </div>
          <div className="space-y-2">
            <StatusRow label="Charges enabled" enabled={true} />
            <StatusRow label="Payouts enabled" enabled={status?.payouts_enabled ?? false} />
          </div>
        </div>
      )}
    </div>
  );
}

function StatusRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {enabled ? (
        <Check size={16} className="text-green-500" />
      ) : (
        <X size={16} className="text-gray-300" />
      )}
      <span className="text-sm text-text-muted">{label}</span>
    </div>
  );
}
