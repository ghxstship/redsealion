import { TierGate } from '@/components/shared/TierGate';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PageHeader from '@/components/shared/PageHeader';
import { notFound } from 'next/navigation';
import ReplyButton from './ReplyButton';
import SanitizedHtml from '@/components/ui/SanitizedHtml';

interface EmailMessage {
  id: string;
  from_name: string | null;
  from_email: string | null;
  to_emails: string[] | null;
  subject: string | null;
  body_html: string | null;
  body_text: string | null;
  direction: string;
  sent_at: string;
}

export default async function EmailThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const threadId = resolvedParams.id;
  
  if (!threadId) return notFound();

  const supabase = await createClient();
  const ctx = await resolveCurrentOrg();
  if (!ctx) return notFound();

  // Fetch thread
  const { data: thread } = await supabase
    .from('email_threads')
    .select('*')
    .eq('id', threadId)
    .eq('organization_id', ctx.organizationId)
    .single();

  if (!thread) {
    // If thread table was completely missing data but messages exist:
    const { data: fallbackMessages } = await supabase
      .from('email_messages')
      .select('*')
      .eq('organization_id', ctx.organizationId)
      .eq('thread_id', threadId)
      .order('sent_at', { ascending: true });
      
    if (!fallbackMessages || fallbackMessages.length === 0) return notFound();
    
    // We will render fallback messages via the same flow below.
  }

  // Fetch messages
  const { data: messages } = await supabase
    .from('email_messages')
    .select('*')
    .eq('organization_id', ctx.organizationId)
    .eq('thread_id', threadId)
    .order('sent_at', { ascending: true });

  const finalMessages: EmailMessage[] = (messages || []).map((msg: Record<string, unknown>) => ({
    id: msg.id as string,
    from_name: (msg.from_name as string) ?? null,
    from_email: (msg.from_email as string) ?? null,
    to_emails: (msg.to_emails as string[]) ?? null,
    subject: (msg.subject as string) ?? null,
    body_html: (msg.body_html as string) ?? null,
    body_text: (msg.body_text as string) ?? null,
    direction: (msg.direction as string) ?? 'inbound',
    sent_at: (msg.sent_at as string) ?? '',
  }));

  const subject = thread?.subject || finalMessages[0]?.subject || 'No Subject';

  return (
    <TierGate feature="email_inbox">
      <PageHeader
        title={subject}
        subtitle={`Conversation with ${thread?.from_name || finalMessages[0]?.from_name || 'Unknown'}`}
        actionLabel="Reply"
        renderModal={(props) => <ReplyButton {...props} threadId={threadId} toEmail={thread?.from_email || finalMessages[0]?.from_email} />}
      />

      <div className="space-y-4 max-w-4xl">
        {finalMessages.map((msg) => (
          <div key={msg.id} className={`rounded-xl border p-4 ${msg.direction === 'outbound' ? 'bg-bg-secondary border-border ml-12' : 'bg-background border-border mr-12'}`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium text-sm text-foreground">{msg.from_name} <span className="text-text-muted font-normal text-xs ml-1">&lt;{msg.from_email}&gt;</span></p>
                <div className="text-xs text-text-muted mt-0.5">To: {msg.to_emails?.join(', ') || 'Unknown'}</div>
              </div>
              <span className="text-xs text-text-muted whitespace-nowrap">{new Date(msg.sent_at).toLocaleString()}</span>
            </div>
            <div className="text-sm text-foreground prose prose-sm dark:prose-invert max-w-none">
              {msg.body_html ? (
                <SanitizedHtml html={msg.body_html} />
              ) : (
                <pre className="font-sans whitespace-pre-wrap">{msg.body_text}</pre>
              )}
            </div>
          </div>
        ))}

        {finalMessages.length === 0 && (
          <div className="text-sm text-text-muted text-center py-8">No messages found in this thread.</div>
        )}
      </div>
    </TierGate>
  );
}
