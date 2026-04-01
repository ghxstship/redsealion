'use client';

import { useState } from 'react';

type SettingsTab = 'general' | 'branding' | 'facilities' | 'payment' | 'integrations';

const tabs: { key: SettingsTab; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'branding', label: 'Branding' },
  { key: 'facilities', label: 'Facilities' },
  { key: 'payment', label: 'Payment' },
  { key: 'integrations', label: 'Integrations' },
];

const facilities = [
  { id: 'fac_001', name: 'Meridian HQ', city: 'Los Angeles', state: 'CA', type: 'headquarters', isHQ: true },
  { id: 'fac_002', name: 'Meridian Fabrication', city: 'Long Beach', state: 'CA', type: 'warehouse', isHQ: false },
];

const integrations = [
  { id: 'int_001', platform: 'Salesforce', description: 'Sync clients and proposals to Salesforce CRM.', enabled: false },
  { id: 'int_002', platform: 'HubSpot', description: 'Export client and deal data to HubSpot.', enabled: true },
  { id: 'int_003', platform: 'QuickBooks', description: 'Sync invoices and payments to QuickBooks Online.', enabled: false },
  { id: 'int_004', platform: 'Slack', description: 'Send proposal notifications to Slack channels.', enabled: true },
  { id: 'int_005', platform: 'Zapier', description: 'Connect to 5,000+ apps through Zapier webhooks.', enabled: false },
];

const fontOptions = ['Inter', 'DM Sans', 'Plus Jakarta Sans', 'Manrope', 'Outfit', 'Space Grotesk'];

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

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your organization preferences.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-8 border-b border-border">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.key
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-text-muted hover:text-text-secondary hover:border-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* General */}
      {activeTab === 'general' && (
        <div className="max-w-2xl space-y-6">
          <div className="rounded-xl border border-border bg-white px-6 py-6">
            <h2 className="text-sm font-semibold text-foreground mb-5">Organization</h2>
            <div className="space-y-5">
              <InputField label="Organization Name" defaultValue="Meridian Experiential" />
              <InputField label="URL Slug" defaultValue="meridian-experiential" />
              <SelectField
                label="Timezone"
                options={['America/Los_Angeles', 'America/New_York', 'America/Chicago', 'America/Denver', 'Europe/London', 'Asia/Tokyo']}
                defaultValue="America/Los_Angeles"
              />
              <SelectField
                label="Currency"
                options={['USD', 'EUR', 'GBP', 'CAD', 'AUD']}
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
      )}

      {/* Branding */}
      {activeTab === 'branding' && (
        <div className="max-w-2xl space-y-6">
          <div className="rounded-xl border border-border bg-white px-6 py-6">
            <h2 className="text-sm font-semibold text-foreground mb-5">Colors</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                  Primary Color
                </label>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 shrink-0 rounded-lg border border-border" style={{ backgroundColor: '#0f172a' }} />
                  <input
                    type="text"
                    defaultValue="#0f172a"
                    className="flex-1 rounded-lg border border-border bg-white px-3.5 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                  Secondary Color
                </label>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 shrink-0 rounded-lg border border-border" style={{ backgroundColor: '#3b82f6' }} />
                  <input
                    type="text"
                    defaultValue="#3b82f6"
                    className="flex-1 rounded-lg border border-border bg-white px-3.5 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                  Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 shrink-0 rounded-lg border border-border" style={{ backgroundColor: '#6366f1' }} />
                  <input
                    type="text"
                    defaultValue="#6366f1"
                    className="flex-1 rounded-lg border border-border bg-white px-3.5 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                  Background Color
                </label>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 shrink-0 rounded-lg border border-border" style={{ backgroundColor: '#ffffff' }} />
                  <input
                    type="text"
                    defaultValue="#ffffff"
                    className="flex-1 rounded-lg border border-border bg-white px-3.5 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-white px-6 py-6">
            <h2 className="text-sm font-semibold text-foreground mb-5">Typography</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <SelectField
                label="Heading Font"
                options={fontOptions}
                defaultValue="Inter"
              />
              <SelectField
                label="Body Font"
                options={fontOptions}
                defaultValue="Inter"
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-white px-6 py-6">
            <h2 className="text-sm font-semibold text-foreground mb-5">Logo</h2>
            <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border py-12">
              <div className="text-center">
                <p className="text-sm text-text-muted">Drop your logo here or click to upload</p>
                <p className="mt-1 text-xs text-text-muted">SVG, PNG, or JPG (max 2MB)</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-white px-6 py-6">
            <h2 className="text-sm font-semibold text-foreground mb-5">Portal Copy</h2>
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
      )}

      {/* Facilities */}
      {activeTab === 'facilities' && (
        <div className="max-w-2xl space-y-6">
          <div className="rounded-xl border border-border bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Facilities</h2>
              <button className="text-xs font-medium text-text-muted hover:text-foreground transition-colors">
                + Add Facility
              </button>
            </div>
            <div className="divide-y divide-border">
              {facilities.map((facility) => (
                <div key={facility.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{facility.name}</p>
                      {facility.isHQ && (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          HQ
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {facility.city}, {facility.state} &middot; {facility.type}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-bg-secondary">
                      Edit
                    </button>
                    <button className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payment */}
      {activeTab === 'payment' && (
        <div className="max-w-2xl space-y-6">
          <div className="rounded-xl border border-border bg-white px-6 py-6">
            <h2 className="text-sm font-semibold text-foreground mb-5">Default Payment Terms</h2>
            <div className="space-y-5">
              <SelectField
                label="Payment Structure"
                options={['50/50', '40/40/20', '30/30/30/10', 'Custom']}
                defaultValue="50/50"
              />
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                    Deposit Percentage
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      defaultValue="50"
                      className="w-full rounded-lg border border-border bg-white px-3.5 py-2 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                    Balance Percentage
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      defaultValue="50"
                      className="w-full rounded-lg border border-border bg-white px-3.5 py-2 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">%</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                    Late Fee Rate (Monthly)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      defaultValue="1.5"
                      step="0.1"
                      className="w-full rounded-lg border border-border bg-white px-3.5 py-2 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                    Credit Card Surcharge
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      defaultValue="3"
                      step="0.1"
                      className="w-full rounded-lg border border-border bg-white px-3.5 py-2 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-foreground/90">
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Integrations */}
      {activeTab === 'integrations' && (
        <div className="max-w-2xl space-y-4">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="flex items-center justify-between rounded-xl border border-border bg-white px-6 py-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{integration.platform}</p>
                <p className="mt-0.5 text-xs text-text-muted">{integration.description}</p>
              </div>
              <button
                className={`relative ml-4 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                  integration.enabled ? 'bg-green-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                    integration.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
