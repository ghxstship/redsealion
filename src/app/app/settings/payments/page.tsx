import StripeConnectSetup from '@/components/admin/payments/StripeConnectSetup';

export default function PaymentSettingsPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Payment Settings
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Configure how your organization accepts payments.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Stripe Connect */}
        <StripeConnectSetup />

        {/* Payment Instructions */}
        <div className="rounded-xl border border-border bg-white px-6 py-6">
          <h2 className="text-sm font-semibold text-foreground mb-5">Payment Instructions</h2>
          <p className="text-sm text-text-muted mb-3">
            Custom instructions shown to clients on invoices (e.g. wire transfer details, check mailing address).
          </p>
          <textarea
            rows={4}
            placeholder="Enter payment instructions for your clients..."
            className="w-full rounded-lg border border-border bg-white px-3.5 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 resize-none"
          />
        </div>

        {/* Payment Link Configuration */}
        <div className="rounded-xl border border-border bg-white px-6 py-6">
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
        </div>

        <div className="flex justify-end">
          <button className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-foreground/90">
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
}
