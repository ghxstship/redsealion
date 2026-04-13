'use client';

import { useState, useTransition } from 'react';
import Button from '@/components/ui/Button';

interface NotificationItem {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

interface NotificationTogglesProps {
  notifications: NotificationItem[];
  organizationId: string;
}

export default function NotificationToggles({
  notifications: initialNotifications,
  organizationId,
}: NotificationTogglesProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleToggle(id: string) {
    setError(null);
    setPendingId(id);

    const current = notifications.find((n) => n.id === id);
    if (!current) return;

    const newEnabled = !current.enabled;

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, enabled: newEnabled } : n)),
    );

    startTransition(async () => {
      try {
        const res = await fetch('/api/public/notification-preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organization_id: organizationId,
            event_type: id,
            channel: 'email',
            enabled: newEnabled,
          }),
        });

        if (!res.ok) {
          // Revert on failure
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, enabled: !newEnabled } : n)),
          );
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? 'Failed to update preference.');
        }
      } catch {
        // Revert on network error
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, enabled: !newEnabled } : n)),
        );
        setError('Network error.');
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="flex items-center justify-between gap-4 py-2"
        >
          <div>
            <p className="text-sm font-medium text-foreground">{notif.label}</p>
            <p className="text-xs text-text-muted">{notif.description}</p>
          </div>
          <Button
            type="button"
            onClick={() => handleToggle(notif.id)}
            disabled={pendingId === notif.id}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${
              notif.enabled ? 'bg-green-500' : 'bg-bg-tertiary'
            }`}
            role="switch"
            aria-checked={notif.enabled}
            aria-label={notif.label}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${
                notif.enabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </Button>
        </div>
      ))}
    </div>
  );
}
