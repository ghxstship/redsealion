import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export const metadata = {
  title: 'Account Deactivated — FlyteDeck',
};

export default function ReactivatePage() {
  return (
    <div className="min-h-screen bg-bg-secondary flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
          <ShieldAlert className="text-amber-600" size={28} strokeWidth={1.8} />
        </div>

        <h1 className="text-xl font-semibold text-foreground">
          Account Deactivated
        </h1>

        <p className="mt-3 text-sm text-text-secondary leading-relaxed">
          Your account has been deactivated by your organization&apos;s
          administrator. If you believe this is a mistake, please contact your
          admin to request reactivation.
        </p>

        <div className="mt-8 space-y-3">
          <Link
            href="/login"
            className="block w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-foreground/90"
          >
            Back to Sign In
          </Link>
          <a
            href="mailto:support@flytedeck.com"
            className="block w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
