'use client';

import { useState } from 'react';
import Alert from '@/components/ui/Alert';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import { Mail } from 'lucide-react';
import Button from '@/components/ui/Button';

interface PortalMagicLinkFormProps {
  orgSlug: string;
  orgName: string;
}

export default function PortalMagicLinkForm({ orgSlug, orgName }: PortalMagicLinkFormProps) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/public/portal-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, orgSlug }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send login link.');
      }

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-border bg-background p-8 text-center max-w-md mx-auto">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
          <Mail className="h-6 w-6 text-blue-600" strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Check Your Email</h3>
        <p className="mt-2 text-sm text-text-secondary">
          We&apos;ve sent a secure login link to <strong className="text-foreground">{email}</strong>.
          Click the link in your email to access the {orgName} portal.
        </p>
        <p className="mt-4 text-xs text-text-muted">
          Didn&apos;t receive it? Check your spam folder or{' '}
          <Button
            onClick={() => { setSent(false); setEmail(''); }}
            className="underline hover:text-foreground transition-colors"
          >
            try again
          </Button>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="rounded-xl border border-border bg-background p-8 space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">{orgName}</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Enter your email to access the client portal. No password needed.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert className="mb-4">{error}</Alert>
          )}

          <div>
            <FormLabel htmlFor="ml-email">
              Email Address
            </FormLabel>
            <FormInput
              id="ml-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your-email@company.com"
            />
          </div>

          <Button
            type="submit"
            disabled={submitting || !email}
            className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: 'var(--org-primary, var(--color-foreground))' }}
          >
            {submitting ? 'Sending…' : 'Send Login Link'}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-2 text-text-muted">Secure, passwordless access</span>
          </div>
        </div>

        <p className="text-center text-xs text-text-muted">
          A magic link will be sent to your email. Click it to sign in instantly—no passwords to remember.
        </p>
      </div>
    </div>
  );
}
