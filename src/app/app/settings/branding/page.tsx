'use client';

const fontOptions = ['Inter', 'DM Sans', 'Plus Jakarta Sans', 'Manrope', 'Outfit', 'Space Grotesk'];

function ColorField({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 shrink-0 rounded-lg border border-border" style={{ backgroundColor: defaultValue }} />
        <input
          type="text"
          defaultValue={defaultValue}
          className="flex-1 rounded-lg border border-border bg-white px-3.5 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
        />
      </div>
    </div>
  );
}

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

export default function BrandingSettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Branding</h2>
        <p className="mt-1 text-sm text-text-secondary">Customize colors, fonts, and portal appearance.</p>
      </div>

      <div className="rounded-xl border border-border bg-white px-6 py-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Colors</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <ColorField label="Primary Color" defaultValue="#0f172a" />
          <ColorField label="Secondary Color" defaultValue="#3b82f6" />
          <ColorField label="Accent Color" defaultValue="#6366f1" />
          <ColorField label="Background Color" defaultValue="#ffffff" />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white px-6 py-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Typography</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <SelectField label="Heading Font" options={fontOptions} defaultValue="Inter" />
          <SelectField label="Body Font" options={fontOptions} defaultValue="Inter" />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white px-6 py-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Logo &amp; Favicon</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">Logo</label>
            <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border py-10">
              <div className="text-center">
                <p className="text-sm text-text-muted">Drop logo or click to upload</p>
                <p className="mt-1 text-xs text-text-muted">SVG, PNG, or JPG (max 2MB)</p>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">Favicon</label>
            <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border py-10">
              <div className="text-center">
                <p className="text-sm text-text-muted">Drop favicon or click to upload</p>
                <p className="mt-1 text-xs text-text-muted">ICO, PNG, or SVG (32x32)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white px-6 py-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Portal Copy</h3>
        <div className="space-y-5">
          <InputField label="Portal Title" defaultValue="Meridian Experiential" />
          <InputField label="Tagline" defaultValue="Experiences that move people." />
          <InputField label="Footer Text" defaultValue="© 2026 Meridian Experiential LLC" />
          <InputField label="Email From Name" defaultValue="Meridian Experiential" />
          <InputField label="Email Reply-To" defaultValue="hello@meridian.co" type="email" />
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
