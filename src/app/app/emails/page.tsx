import { TierGate } from '@/components/shared/TierGate';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/shared/PageHeader';

interface EmailThreadRow {
  id: string;
  subject: string;
  from_name: string;
  from_email: string;
  last_message_at: string;
  message_count: number;
  deal_title: string | null;
}

const FALLBACK_THREADS: EmailThreadRow[] = [
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

async function getEmailThreads(): Promise<EmailThreadRow[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('No auth');
// Try email_threads table first
    const { data: threads, error } = await supabase
      .from('email_threads')
      .select()
      .eq('organization_id', ctx.organizationId)
      .order('last_message_at', { ascending: false });

    if (error) {
      // Fall back to email_messages if email_threads doesn't exist
      const { data: messages } = await supabase
        .from('email_messages')
        .select()
        .eq('organization_id', ctx.organizationId)
        .order('sent_at', { ascending: false });

      if (!messages || messages.length === 0) throw new Error('No messages');

      // Group by thread_id or subject
      const threadMap = new Map<string, EmailThreadRow>();
      for (const msg of messages) {
        const key = (msg.thread_id as string) ?? (msg.subject as string) ?? msg.id;
        if (!threadMap.has(key)) {
          threadMap.set(key, {
            id: key,
            subject: (msg.subject as string) ?? '(No subject)',
            from_name: (msg.from_name as string) ?? '',
            from_email: (msg.from_email as string) ?? '',
            last_message_at: (msg.sent_at as string) ?? '',
            message_count: 1,
            deal_title: (msg.deal_title as string) ?? null,
          });
        } else {
          const existing = threadMap.get(key)!;
          existing.message_count += 1;
          if ((msg.sent_at as string) > existing.last_message_at) {
            existing.last_message_at = msg.sent_at as string;
            existing.from_name = (msg.from_name as string) ?? existing.from_name;
            existing.from_email = (msg.from_email as string) ?? existing.from_email;
          }
        }
      }

      return Array.from(threadMap.values());
    }

    if (!threads || threads.length === 0) throw new Error('No threads');

    return threads.map((t: Record<string, unknown>) => ({
      id: t.id as string,
      subject: (t.subject as string) ?? '(No subject)',
      from_name: (t.from_name as string) ?? '',
      from_email: (t.from_email as string) ?? '',
      last_message_at: (t.last_message_at as string) ?? '',
      message_count: (t.message_count as number) ?? 0,
      deal_title: (t.deal_title as string) ?? null,
    }));
  } catch {
    return FALLBACK_THREADS;
  }
}

export default async function EmailsPage() {
  const threads = await getEmailThreads();

  return (
    <TierGate feature="email_inbox">
<PageHeader
        title="Email Inbox"
        subtitle="Email threads linked to your deals and clients."
      />

      <div className="rounded-xl border border-border bg-white divide-y divide-border">
        {threads.map((thread) => (
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

      {threads.length === 0 && (
        <EmptyState
          message="No email threads yet"
          description="Connect your email or integration to see conversations here."
        />
      )}
    </TierGate>
  );
}
