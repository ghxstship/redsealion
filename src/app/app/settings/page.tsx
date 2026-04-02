'use client';

function InputField({ label, defaultValue, type = 'text' }: { label: string; defaultValue: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={type}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-border bg-white px-3.5 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
      />
    </div>
  );
}

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

export default function GeneralSettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">General</h2>
        <p className="mt-1 text-sm text-text-secondary">Core organization settings.</p>
      </div>
      <div className="rounded-xl border border-border bg-white px-6 py-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Organization</h3>
        <div className="space-y-5">
          <InputField label="Organization Name" defaultValue="Meridian Experiential" />
          <InputField label="URL Slug" defaultValue="meridian-experiential" />
          <SelectField
            label="Timezone"
            options={['America/Los_Angeles', 'America/New_York', 'America/Chicago', 'America/Denver', 'Europe/London', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Singapore', 'Australia/Sydney']}
            defaultValue="America/Los_Angeles"
          />
          <SelectField
            label="Currency"
            options={['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD', 'SGD', 'JPY']}
            defaultValue="USD"
          />
          <InputField label="Invoice Prefix" defaultValue="MER" />
          <InputField label="Proposal Prefix" defaultValue="MER" />
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
