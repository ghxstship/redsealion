'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';

const fontOptions = ['Inter', 'DM Sans', 'Plus Jakarta Sans', 'Manrope', 'Outfit', 'Space Grotesk'];

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 shrink-0 rounded-lg border border-border" style={{ backgroundColor: value }} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-lg border border-border bg-background px-3.5 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
        />
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
      />
    </div>
  );
}

function SelectField({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

export default function BrandingSettingsPage() {
  const [primary, setPrimary] = useState('#0f172a');
  const [secondary, setSecondary] = useState('#3b82f6');
  const [accent, setAccent] = useState('#6366f1');
  const [bg, setBg] = useState('#ffffff');
  const [headingFont, setHeadingFont] = useState('Inter');
  const [bodyFont, setBodyFont] = useState('Inter');
  const [portalTitle, setPortalTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [footer, setFooter] = useState('');
  const [emailFrom, setEmailFrom] = useState('');
  const [emailReplyTo, setEmailReplyTo] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/settings/general')
      .then((r) => r.json())
      .then((data) => {
        const bc = data.organization?.brand_config;
        if (bc) {
          setPrimary(bc.primaryColor ?? '#0f172a');
          setSecondary(bc.secondaryColor ?? '#3b82f6');
          setAccent(bc.accentColor ?? '#6366f1');
          setBg(bc.backgroundColor ?? '#ffffff');
          setHeadingFont(bc.fontHeading ?? 'Inter');
          setBodyFont(bc.fontBody ?? 'Inter');
          setPortalTitle(bc.portalTitle ?? '');
          setTagline(bc.companyTagline ?? '');
          setFooter(bc.footerText ?? '');
          setEmailFrom(bc.emailFromName ?? '');
          setEmailReplyTo(bc.emailReplyTo ?? '');
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch('/api/settings/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_config: {
            primaryColor: primary,
            secondaryColor: secondary,
            accentColor: accent,
            backgroundColor: bg,
            fontHeading: headingFont,
            fontBody: bodyFont,
            portalTitle,
            companyTagline: tagline,
            footerText: footer,
            emailFromName: emailFrom,
            emailReplyTo,
          },
        }),
      });
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Branding</h2>
          <p className="mt-1 text-sm text-text-secondary">Customize colors, fonts, and portal appearance.</p>
        </div>
        <Skeleton height="h-64" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Branding</h2>
        <p className="mt-1 text-sm text-text-secondary">Customize colors, fonts, and portal appearance.</p>
      </div>

      <Card>
        <h3 className="text-sm font-semibold text-foreground mb-5">Colors</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <ColorField label="Primary Color" value={primary} onChange={setPrimary} />
          <ColorField label="Secondary Color" value={secondary} onChange={setSecondary} />
          <ColorField label="Accent Color" value={accent} onChange={setAccent} />
          <ColorField label="Background Color" value={bg} onChange={setBg} />
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-foreground mb-5">Typography</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <SelectField label="Heading Font" options={fontOptions} value={headingFont} onChange={setHeadingFont} />
          <SelectField label="Body Font" options={fontOptions} value={bodyFont} onChange={setBodyFont} />
        </div>
      </Card>

      <Card>
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
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-foreground mb-5">Portal Copy</h3>
        <div className="space-y-5">
          <InputField label="Portal Title" value={portalTitle} onChange={setPortalTitle} />
          <InputField label="Tagline" value={tagline} onChange={setTagline} />
          <InputField label="Footer Text" value={footer} onChange={setFooter} />
          <InputField label="Email From Name" value={emailFrom} onChange={setEmailFrom} />
          <InputField label="Email Reply-To" value={emailReplyTo} onChange={setEmailReplyTo} type="email" />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
