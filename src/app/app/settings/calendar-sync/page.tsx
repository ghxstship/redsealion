'use client';

import { useState } from 'react';

type Provider = 'google' | 'outlook' | 'ical';
type SyncDirection = 'one-way' | 'two-way';

interface ProviderConfig {
  key: Provider;
  name: string;
  description: string;
  connected: boolean;
  lastSynced: string | null;
  syncDirection: SyncDirection;
  calendarId: string;
}

const defaultProviders: ProviderConfig[] = [
  {
    key: 'google',
    name: 'Google Calendar',
    description: 'Sync events with your Google Calendar account.',
    connected: false,
    lastSynced: null,
    syncDirection: 'one-way',
    calendarId: '',
  },
  {
    key: 'outlook',
    name: 'Microsoft Outlook',
    description: 'Sync events with your Outlook calendar.',
    connected: false,
    lastSynced: null,
    syncDirection: 'one-way',
    calendarId: '',
  },
  {
    key: 'ical',
    name: 'iCal Feed',
    description: 'Subscribe to events via iCal feed URL.',
    connected: false,
    lastSynced: null,
    syncDirection: 'one-way',
    calendarId: '',
  },
];

export default function CalendarSyncPage() {
  const [providers, setProviders] = useState<ProviderConfig[]>(defaultProviders);
  const [syncProjects, setSyncProjects] = useState(true);
  const [syncCrewBookings, setSyncCrewBookings] = useState(true);
  const [syncMaintenance, setSyncMaintenance] = useState(false);
  const [syncDeadlines, setSyncDeadlines] = useState(true);
  const [feedCopied, setFeedCopied] = useState(false);

  const feedUrl = 'https://app.flytedeck.com/api/calendar/feed?token=xxx';

  function handleConnect(key: Provider) {
    setProviders((prev) =>
      prev.map((p) =>
        p.key === key ? { ...p, connected: true, lastSynced: 'Just now' } : p
      )
    );
    fetch('/api/settings/calendar-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: key }),
    }).catch(() => {});
  }

  function handleDisconnect(key: Provider) {
    setProviders((prev) =>
      prev.map((p) =>
        p.key === key ? { ...p, connected: false, lastSynced: null, calendarId: '' } : p
      )
    );
    fetch(`/api/settings/calendar-sync?provider=${key}`, { method: 'DELETE' }).catch(() => {});
  }

  function handleSyncDirection(key: Provider, dir: SyncDirection) {
    setProviders((prev) =>
      prev.map((p) => (p.key === key ? { ...p, syncDirection: dir } : p))
    );
  }

  function handleCalendarId(key: Provider, id: string) {
    setProviders((prev) =>
      prev.map((p) => (p.key === key ? { ...p, calendarId: id } : p))
    );
  }

  function handleCopyFeed() {
    navigator.clipboard.writeText(feedUrl).then(() => {
      setFeedCopied(true);
      setTimeout(() => setFeedCopied(false), 2000);
    });
  }

  function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-foreground' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
          }`}
        />
      </button>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Calendar Sync</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Connect your calendar to sync events automatically.
        </p>
      </div>

      {/* Provider cards */}
      {providers.map((provider) => (
        <div key={provider.key} className="rounded-xl border border-border bg-white px-6 py-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Icon placeholder */}
              <div className="h-10 w-10 rounded-lg bg-gray-100 border border-border flex items-center justify-center">
                <svg className="h-5 w-5 text-text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{provider.name}</h3>
                <p className="text-sm text-text-secondary">{provider.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {provider.connected ? (
                <>
                  <span className="flex items-center gap-1.5 text-xs text-green-600">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    Last synced {provider.lastSynced}
                  </span>
                  <button
                    onClick={() => handleDisconnect(provider.key)}
                    className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <>
                  <span className="flex items-center gap-1.5 text-xs text-text-muted">
                    <span className="h-2 w-2 rounded-full bg-gray-300" />
                    Not Connected
                  </span>
                  <button
                    onClick={() => handleConnect(provider.key)}
                    className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:bg-foreground/90 transition-colors"
                  >
                    Connect
                  </button>
                </>
              )}
            </div>
          </div>

          {provider.connected && (
            <div className="space-y-4 border-t border-border pt-4">
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                  Sync Direction
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSyncDirection(provider.key, 'one-way')}
                    className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
                      provider.syncDirection === 'one-way'
                        ? 'border-foreground bg-foreground/5 text-foreground'
                        : 'border-border bg-white text-text-secondary hover:bg-gray-50'
                    }`}
                  >
                    One-way: FlyteDeck to Calendar
                  </button>
                  <button
                    onClick={() => handleSyncDirection(provider.key, 'two-way')}
                    className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
                      provider.syncDirection === 'two-way'
                        ? 'border-foreground bg-foreground/5 text-foreground'
                        : 'border-border bg-white text-text-secondary hover:bg-gray-50'
                    }`}
                  >
                    Two-way
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                  Calendar ID
                </label>
                <input
                  type="text"
                  value={provider.calendarId}
                  onChange={(e) => handleCalendarId(provider.key, e.target.value)}
                  placeholder="e.g. primary or calendar@group.calendar.google.com"
                  className="w-full rounded-lg border border-border bg-white px-3.5 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
                />
              </div>
            </div>
          )}
        </div>
      ))}

      {/* iCal Feed URL */}
      <div className="rounded-xl border border-border bg-white px-6 py-6">
        <h3 className="text-sm font-semibold text-foreground mb-2">iCal Feed URL</h3>
        <p className="text-sm text-text-secondary mb-4">
          Use this URL to subscribe to your FlyteDeck calendar from any calendar app.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={feedUrl}
            readOnly
            className="flex-1 rounded-lg border border-border bg-gray-50 px-3.5 py-2 text-sm text-text-secondary cursor-not-allowed"
          />
          <button
            onClick={handleCopyFeed}
            className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50 transition-colors"
          >
            {feedCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Sync Settings */}
      <div className="rounded-xl border border-border bg-white px-6 py-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Sync Settings</h3>
        <div className="space-y-4">
          {[
            { label: 'Projects', checked: syncProjects, onChange: setSyncProjects },
            { label: 'Crew Bookings', checked: syncCrewBookings, onChange: setSyncCrewBookings },
            { label: 'Maintenance Schedule', checked: syncMaintenance, onChange: setSyncMaintenance },
            { label: 'Deadlines', checked: syncDeadlines, onChange: setSyncDeadlines },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{item.label}</span>
              <Toggle checked={item.checked} onChange={item.onChange} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
