'use client';

import { useState } from 'react';
import SignatureCapture from '@/components/portal/SignatureCapture';
import { CheckCircle2 } from 'lucide-react';

interface SignPageClientProps {
  token: string;
  documentTitle: string;
  signerName: string;
  signerEmail: string;
  orgName: string;
}

export default function SignPageClient({
  token,
  documentTitle,
  signerName,
  signerEmail,
  orgName,
}: SignPageClientProps) {
  const [status, setStatus] = useState<'ready' | 'submitting' | 'success' | 'error'>('ready');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSign(signatureDataUrl: string) {
    setStatus('submitting');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/esign/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          signature_data: signatureDataUrl,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Unknown error' }));
        setErrorMessage(body.error ?? 'Failed to submit signature.');
        setStatus('error');
        return;
      }

      setStatus('success');
    } catch {
      setErrorMessage('Network error. Please check your connection and try again.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="text-green-600" size={28} strokeWidth={1.8} />
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            Document Signed
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Thank you, {signerName}. Your signature has been recorded successfully.
          </p>
          <p className="mt-4 text-xs text-text-muted">
            A confirmation will be sent to {signerEmail}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-secondary flex flex-col items-center p-6">
      {/* Header */}
      <div className="w-full max-w-2xl mb-8">
        <p className="text-sm text-text-muted text-center">{orgName}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground text-center">
          {documentTitle}
        </h1>
      </div>

      {/* Document info */}
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Signer Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-text-muted">Name</p>
            <p className="text-sm font-medium text-foreground">{signerName}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Email</p>
            <p className="text-sm text-foreground">{signerEmail}</p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="w-full max-w-2xl mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Signature canvas */}
      <div className="w-full max-w-2xl mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">Your Signature</h2>
        <SignatureCapture onSign={handleSign} />
        {status === 'submitting' && (
          <p className="mt-2 text-xs text-text-muted text-center animate-pulse">
            Submitting your signature…
          </p>
        )}
        <p className="mt-3 text-xs text-text-muted text-center">
          By signing, you agree to the terms of this document.
        </p>
      </div>

      <p className="mt-4 text-center text-xs text-text-muted">
        Powered by FlyteDeck &middot; Secure electronic signature
      </p>
    </div>
  );
}
