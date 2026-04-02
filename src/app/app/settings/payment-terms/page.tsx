'use client';

function SelectField({ label, options, defaultValue }: { label: string; options: string[]; defaultValue: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <select
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-border bg-white px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function PercentField({ label, defaultValue, step = '1' }: { label: string; defaultValue: string; step?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          defaultValue={defaultValue}
          step={step}
          className="w-full rounded-lg border border-border bg-white px-3.5 py-2 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">%</span>
      </div>
    </div>
  );
}

export default function PaymentTermsSettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Payment Terms</h2>
        <p className="mt-1 text-sm text-text-secondary">Default payment structure for new proposals.</p>
      </div>

      <div className="rounded-xl border border-border bg-white px-6 py-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Default Structure</h3>
        <div className="space-y-5">
          <SelectField
            label="Payment Structure"
            options={['50/50', '40/40/20', '30/30/30/10', '100% Upfront', '100% On Completion', 'Custom']}
            defaultValue="50/50"
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <PercentField label="Deposit Percentage" defaultValue="50" />
            <PercentField label="Balance Percentage" defaultValue="50" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white px-6 py-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Fees &amp; Surcharges</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <PercentField label="Late Fee Rate (Monthly)" defaultValue="1.5" step="0.1" />
          <PercentField label="Credit Card Surcharge" defaultValue="3" step="0.1" />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white px-6 py-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Payment Instructions</h3>
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
            Default Instructions (shown on invoices)
          </label>
          <textarea
            rows={3}
            defaultValue="Wire transfer to Meridian Experiential LLC. Contact accounting@meridianxp.com for details."
            className="w-full rounded-lg border border-border bg-white px-3.5 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 resize-none"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-foreground/90">
          Save Changes
        </button>
      </div>
    </div>
  );
}
