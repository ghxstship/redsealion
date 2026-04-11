import { TierGate } from '@/components/shared/TierGate';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/shared/PageHeader';
import Avatar from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Link from 'next/link';
import ComposeEmailButton from './ComposeEmailButton';

interface EmailThreadRow {
  id: string;
  subject: string;
  from_name: string;
  from_email: string;
  last_message_at: string;
  message_count: number;
  deal_title: string | null;
}

async function getEmailThreads(): Promise<{ threads: EmailThreadRow[]; error: string | null }> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('No auth');

    const { data: threads, error } = await supabase
      .from('email_threads')
      .select()
      .eq('organization_id', ctx.organizationId)
      .order('last_message_at', { ascending: false });

    if (error) {
      return { threads: [], error: error.message };
    }

    if (!threads || threads.length === 0) return { threads: [], error: null };

    return {
      threads: threads.map((t: Record<string, unknown>) => ({
        id: t.id as string,
        subject: (t.subject as string) ?? '(No subject)',
        from_name: (t.from_name as string) ?? '',
        from_email: (t.from_email as string) ?? '',
        last_message_at: (t.last_message_at as string) ?? '',
        message_count: (t.message_count as number) ?? 0,
        deal_title: (t.deal_title as string) ?? null,
      })),
      error: null,
    };
  } catch {
    return { threads: [], error: null };
  }
}

export default async function EmailsPage() {
  const { threads, error } = await getEmailThreads();

  return (
      <TierGate feature="email_inbox">
        <PageHeader
          title="Email Inbox"
          subtitle="Email threads linked to your deals and clients."
        >
          <ComposeEmailButton />
        </PageHeader>

      {error && (
        <Alert variant="error" className="mb-6">{error}</Alert>
      )}

      <div className="rounded-xl border border-border bg-background divide-y divide-border">
        {threads.map((thread) => (
          <Link
            href={`/app/emails/${thread.id}`}
            key={thread.id}
            className="block px-5 py-4 hover:bg-bg-secondary transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex items-start gap-4">
            <Avatar name={thread.from_name} />
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
                  <Badge variant="default">{thread.deal_title}</Badge>
                )}
              </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {threads.length === 0 && !error && (
        <EmptyState
          message="No email threads yet"
          description="Connect your email or integration to see conversations here."
          action={<Button href="/app/settings/integrations" variant="primary">Connect Integration</Button>}
        />
      )}
    </TierGate>
  );
}
