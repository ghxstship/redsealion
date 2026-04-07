'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

type Channel = 'email' | 'sms' | 'in_app';

interface EventType {
  key: string;
  label: string;
}

interface EventCategory {
  name: string;
  events: EventType[];
}

const EVENT_CATEGORIES: EventCategory[] = [
  {
    name: 'Proposals',
    events: [
      { key: 'proposal_sent', label: 'Proposal Sent' },
      { key: 'proposal_viewed', label: 'Proposal Viewed' },
      { key: 'proposal_accepted', label: 'Proposal Accepted' },
      { key: 'proposal_expired', label: 'Proposal Expired' },
    ],
  },
  {
    name: 'Invoices',
    events: [
      { key: 'invoice_sent', label: 'Invoice Sent' },
      { key: 'invoice_paid', label: 'Invoice Paid' },
      { key: 'invoice_overdue', label: 'Invoice Overdue' },
      { key: 'payment_received', label: 'Payment Received' },
    ],
  },
  {
    name: 'Crew',
    events: [
      { key: 'crew_booking_offer', label: 'Booking Offer' },
      { key: 'crew_booking_confirmed', label: 'Booking Confirmed' },
      { key: 'crew_booking_declined', label: 'Booking Declined' },
    ],
  },
  {
    name: 'Equipment',
    events: [
      { key: 'equipment_reserved', label: 'Equipment Reserved' },
      { key: 'equipment_checked_out', label: 'Equipment Checked Out' },
      { key: 'maintenance_due', label: 'Maintenance Due' },
    ],
  },
  {
    name: 'General',
    events: [
      { key: 'task_assigned', label: 'Task Assigned' },
      { key: 'comment_added', label: 'Comment Added' },
      { key: 'document_signed', label: 'Document Signed' },
    ],
  },
];

const CHANNELS: { key: Channel; label: string }[] = [
  { key: 'email', label: 'Email' },
  { key: 'sms', label: 'SMS' },
  { key: 'in_app', label: 'In-App' },
];

function Toggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        enabled ? 'bg-foreground' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
          enabled ? 'translate-x-4.5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<
    Record<string, Record<Channel, boolean>>
  >(() => {
    const initial: Record<string, Record<Channel, boolean>> = {};
    for (const category of EVENT_CATEGORIES) {
      for (const event of category.events) {
        initial[event.key] = { email: true, sms: false, in_app: true };
      }
    }
    return initial;
  });

  const [saving, setSaving] = useState(false);

  function togglePreference(eventKey: string, channel: Channel) {
    setPreferences((prev) => ({
      ...prev,
      [eventKey]: {
        ...prev[eventKey],
        [channel]: !prev[eventKey][channel],
      },
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Choose how you want to be notified.
        </p>
      </div>

      {EVENT_CATEGORIES.map((category) => (
        <Card
          key={category.name}
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">
            {category.name}
          </h3>

          {/* Column headers */}
          <div className="flex items-center border-b border-border pb-3 mb-1">
            <span className="flex-1 text-xs font-medium text-text-muted uppercase tracking-wider">
              Event
            </span>
            {CHANNELS.map((ch) => (
              <span
                key={ch.key}
                className="w-20 text-center text-xs font-medium text-text-muted uppercase tracking-wider"
              >
                {ch.label}
              </span>
            ))}
          </div>

          {/* Event rows */}
          <div className="divide-y divide-border">
            {category.events.map((event) => (
              <div
                key={event.key}
                className="flex items-center py-3"
              >
                <span className="flex-1 text-sm text-foreground">
                  {event.label}
                </span>
                {CHANNELS.map((ch) => (
                  <div key={ch.key} className="w-20 flex justify-center">
                    <Toggle
                      enabled={preferences[event.key]?.[ch.key] ?? false}
                      onToggle={() => togglePreference(event.key, ch.key)}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}
