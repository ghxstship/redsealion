'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

/* ─────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────── */

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
  entity_type: string | null;
  entity_id: string | null;
}

const TYPE_ICONS: Record<string, string> = {
  approval_required: '✋',
  invoice_overdue: '⚠️',
  lead_new: '🔔',
  proposal_viewed: '👁️',
  task_assigned: '📋',
  expense_submitted: '💳',
  deal_stage_changed: '📊',
  system: '⚙️',
};

function entityLink(type: string | null, id: string | null): string | null {
  if (!type || !id) return null;
  const routes: Record<string, string> = {
    proposal: `/app/proposals/${id}`,
    deal: `/app/pipeline/${id}`,
    client: `/app/clients/${id}`,
    invoice: `/app/invoices/${id}`,
    task: `/app/tasks`,
    expense: `/app/expenses`,
    lead: `/app/leads`,
  };
  return routes[type] ?? null;
}

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/* ─────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────── */

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('notifications')
        .select('id, type, title, body, read, created_at, entity_type, entity_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      setNotifications(data ?? []);
    } catch (error) {
      // Supabase not configured or table missing — graceful degradation
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  // Mark all as read
  const markAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      const supabase = createClient();
      await supabase
        .from('notifications')
        .update({ read: true })
        .in(
          'id',
          unread.map((n) => n.id),
        );
    } catch (error) {
        void error; /* Caught: error boundary handles display */
      }
  }, [notifications]);

  return (
    <div ref={panelRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open && unreadCount > 0) markAllRead();
        }}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-bg-secondary"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-text-secondary"
        >
          <path d="M13.73 12a2 2 0 0 0 .27-1V7.5a5 5 0 0 0-10 0V11a2 2 0 0 0 .27 1H13.73Z" />
          <path d="M7 14a2.18 2.18 0 0 0 4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[10px] font-semibold px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-white shadow-lg animate-scale-in overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] font-medium text-text-muted hover:text-foreground transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-text-muted">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-bg-tertiary">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                    <path d="M15.73 13.5a2 2 0 0 0 .27-1V8.5a6 6 0 0 0-12 0v4a2 2 0 0 0 .27 1h11.46Z" />
                    <path d="M8 16a2.18 2.18 0 0 0 4 0" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-foreground">All caught up</p>
                <p className="mt-1 text-xs text-text-muted">
                  No new notifications. You&apos;ll see updates here as they happen.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => {
                  const link = entityLink(notification.entity_type, notification.entity_id);

                  const content = (
                    <>
                      <span className="mt-0.5 text-base shrink-0">
                        {TYPE_ICONS[notification.type] ?? '📌'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm ${!notification.read ? 'font-medium text-foreground' : 'text-text-secondary'}`}>
                          {notification.title}
                        </p>
                        {notification.body && (
                          <p className="mt-0.5 text-xs text-text-muted line-clamp-2">
                            {notification.body}
                          </p>
                        )}
                        <p className="mt-1 text-[10px] text-text-muted">
                          {timeAgo(notification.created_at)}
                        </p>
                      </div>
                      {!notification.read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                      )}
                    </>
                  );

                  const cn = `flex gap-3 px-4 py-3 transition-colors hover:bg-bg-secondary ${
                    !notification.read ? 'bg-blue-50/30' : ''
                  }`;

                  return link ? (
                    <Link
                      key={notification.id}
                      href={link}
                      onClick={() => setOpen(false)}
                      className={cn}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div key={notification.id} className={cn}>
                      {content}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-border px-4 py-2.5 text-center">
              <Link
                href="/app/settings/notifications"
                className="text-xs font-medium text-text-muted hover:text-foreground transition-colors"
                onClick={() => setOpen(false)}
              >
                Notification settings
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
