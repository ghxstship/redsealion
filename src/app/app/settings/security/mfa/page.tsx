'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

type MfaStep = 'loading' | 'enroll' | 'verify' | 'done';

export default function MfaSetupPage() {
  const [step, setStep] = useState<MfaStep>('loading');
  const [qrUri, setQrUri] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    checkMfaStatus();
  }, []);

  async function checkMfaStatus() {
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.mfa.listFactors();

      const verified = data?.totp?.find((f) => (f.status as string) === 'verified');
      if (verified) {
        setStep('done');
        return;
      }

      // If there's an unverified factor, use it
      const unverified = data?.totp?.find((f) => (f.status as string) === 'unverified');
      if (unverified) {
        setFactorId(unverified.id);
        setStep('verify');
        return;
      }

      // Need to enroll
      await enrollMfa();
    } catch {
      setError('Failed to check MFA status.');
      setStep('enroll');
    }
  }

  async function enrollMfa() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'FlyteDeck Authenticator',
      });

      if (error) {
        setError(error.message);
        setStep('enroll');
        return;
      }

      setFactorId(data.id);
      setQrUri(data.totp.uri);
      setSecret(data.totp.secret);
      setStep('enroll');
    } catch {
      setError('Failed to set up MFA. Please try again.');
      setStep('enroll');
    }
  }

  async function verifyCode() {
    if (!factorId || code.length !== 6) return;

    setVerifying(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });

      if (challengeError) {
        setError(challengeError.message);
        setVerifying(false);
        return;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      });

      if (verifyError) {
        setError('Invalid verification code. Please try again.');
        setVerifying(false);
        return;
      }

      setStep('done');
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  }

  if (step === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-text-muted" size={24} />
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="text-center py-12">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
            <ShieldCheck className="text-green-600" size={28} strokeWidth={1.8} />
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            MFA Verified
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Your account is protected with multi-factor authentication.
          </p>
          <div className="mt-6">
            <Button href="/app">Continue to Dashboard</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">
          Set Up Multi-Factor Authentication
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Your organization requires MFA. Scan the QR code below with your
          authenticator app, then enter the verification code.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {step === 'enroll' && qrUri && (
        <Card className="mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            1. Scan QR Code
          </h2>
          <div className="flex justify-center mb-4">
            {/* Render QR code as an image using a data URI via Google Charts API fallback */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUri)}`}
              alt="MFA QR Code"
              width={200}
              height={200}
              className="rounded-lg border border-border"
            />
          </div>
          {secret && (
            <div className="bg-bg-secondary rounded-lg px-4 py-3 text-center">
              <p className="text-xs text-text-muted mb-1">Manual entry key</p>
              <p className="text-sm font-mono text-foreground tracking-wider select-all">
                {secret}
              </p>
            </div>
          )}
        </Card>
      )}

      <Card>
        <h2 className="text-sm font-semibold text-foreground mb-4">
          {step === 'enroll' ? '2. Enter Verification Code' : 'Enter Verification Code'}
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            verifyCode();
          }}
          className="space-y-4"
        >
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
            autoFocus
            autoComplete="one-time-code"
          />
          <Button
            type="submit"
            disabled={code.length !== 6 || verifying}
            className="w-full"
          >
            {verifying ? 'Verifying...' : 'Verify & Enable MFA'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
