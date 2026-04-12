'use client';

import { useState } from 'react';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';

interface ReferralLinkSectionProps {
  referralCode: string | null;
  appUrl: string;
  isAuthenticated: boolean;
}

export default function ReferralLinkSection({
  referralCode,
  appUrl,
  isAuthenticated,
}: ReferralLinkSectionProps) {
  const [copied, setCopied] = useState(false);

  const referralUrl = referralCode
    ? `${appUrl}/api/public/referral/${referralCode}`
    : null;

  async function handleCopy() {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the input
      const input = document.querySelector<HTMLInputElement>('#referral-link-input');
      input?.select();
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="border-t border-border pt-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">Your Referral Link</h2>
        <p className="text-sm text-text-muted">
          Please <a href="login" className="underline hover:text-foreground">sign in</a> to generate your personalized referral code.
        </p>
      </div>
    );
  }

  if (!referralCode) {
    return (
      <div className="border-t border-border pt-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">Your Referral Link</h2>
        <p className="text-sm text-text-muted">
          Your referral code is being created. Please check back shortly or contact the team for your link.
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-border pt-6">
      <h2 className="text-sm font-semibold text-foreground mb-3">Your Referral Link</h2>
      <div className="flex items-center gap-2">
        <FormInput
          id="referral-link-input"
          type="text"
          readOnly
          value={referralUrl ?? ''}
          className="flex-1 rounded-md border border-border bg-bg-secondary px-3 py-2 text-sm text-text-muted"
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <Button
          type="button"
          onClick={handleCopy}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--org-primary, var(--color-foreground))' }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      <p className="mt-2 text-xs text-text-muted">
        Share this link with friends and colleagues.
      </p>
    </div>
  );
}
