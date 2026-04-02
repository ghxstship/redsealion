'use client';

import { TierGate } from '@/components/shared/TierGate';

const SAMPLE_THREADS = [
  {
    id: '1',
    subject: 'Re: Booth design specs for CES 2026',
    from_name: 'Sarah Chen',
    from_email: 'sarah@acmecorp.com',
    last_message_at: '2026-03-31T16:45:00Z',
    message_count: 5,
    deal_title: 'ACME CES Booth',
  },
  {
    id: '2',
    subject: 'Invoice #INV-2024-042 payment confirmation',
    from_name: 'Mike Johnson',
    from_email: 'mike@globalevents.com',
    last_message_at: '2026-03-30T09:20:00Z',
    message_count: 3,
    deal_title: 'Global Events Pop-up',
  },
  {
    id: '3',
    subject: 'Material samples - please review',
    from_name: 'Lisa Park',
    from_email: 'lisa@techstart.io',
    last_message_at: '2026-03-28T14:10:00Z',
    message_count: 8,
    deal_title: 'TechStart Launch Event',
  },
];

export default function EmailsPage() {
  return (
    <TierGate feature="email_inbox">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Email Inbox
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Email threads linked to your deals and clients.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-white divide-y divide-border">
        {SAMPLE_THREADS.map((thread) => (
          <div
            key={thread.id}
            className="px-5 py-4 flex items-start gap-4 hover:bg-bg-secondary transition-colors cursor-pointer"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg-secondary text-xs font-semibold text-text-secondary">
              {thread.from_name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground truncate">
                  {thread.from_name}
                </p>
                <span className="text-xs text-text-muted whitespace-nowrap">
                  {new Date(thread.last_message_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-foreground truncate mt-0.5">{thread.subject}</p>
              <div className="mt-1 flex items-center gap-3 text-xs text-text-muted">
                <span>{thread.message_count} messages</span>
                {thread.deal_title && (
                  <span className="inline-flex items-center rounded-full bg-bg-secondary px-2 py-0.5 text-xs font-medium text-text-secondary">
                    {thread.deal_title}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {SAMPLE_THREADS.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-white px-5 py-12 text-center">
          <p className="text-sm text-text-muted">
            No email threads yet. Connect your email or integration to see conversations here.
          </p>
        </div>
      )}
    </TierGate>
  );
}
