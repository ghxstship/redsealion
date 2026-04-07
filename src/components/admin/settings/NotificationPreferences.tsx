'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface Preference {
  event_type: string;
  email: boolean;
  sms: boolean;
  in_app: boolean;
}

const CHANNELS = ['email', 'sms', 'in_app'] as const;

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/notifications/preferences')
      .then((r) => r.json())
      .then((data) => {
        setPreferences(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load preferences.');
        setLoading(false);
      });
  }, []);

  const toggleChannel = (eventType: string, channel: (typeof CHANNELS)[number]) => {
    setPreferences((prev) =>
      prev.map((p) =>
        p.event_type === eventType ? { ...p, [channel]: !p[channel] } : p,
      ),
    );
    setSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? 'Failed to save preferences.');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatEventType = (type: string) =>
    type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const formatChannel = (ch: string) =>
    ch === 'in_app' ? 'In-App' : ch.charAt(0).toUpperCase() + ch.slice(1);

  if (loading) {
    return (
      <div className="bg-white border border-border rounded-lg shadow-sm p-6">
        <p className="text-sm text-text-muted">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-lg shadow-sm p-6">
      <h2 className="text-base font-semibold text-foreground mb-4">Notification Preferences</h2>

      {error && (
        <Alert className="mb-4">{error}</Alert>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800 mb-4">
          Preferences saved successfully.
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-text-secondary font-medium">Event</th>
              {CHANNELS.map((ch) => (
                <th key={ch} className="text-center py-2 px-3 text-text-secondary font-medium">
                  {formatChannel(ch)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preferences.map((pref) => (
              <tr key={pref.event_type} className="border-b border-border">
                <td className="py-2 px-3 text-foreground">{formatEventType(pref.event_type)}</td>
                {CHANNELS.map((ch) => (
                  <td key={ch} className="text-center py-2 px-3">
                    <button
                      type="button"
                      onClick={() => toggleChannel(pref.event_type, ch)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        pref[ch] ? 'bg-foreground' : 'bg-bg-tertiary'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                          pref[ch] ? 'translate-x-4.5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-4">
        <Button onClick={handleSave}
          disabled={saving}>
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}
