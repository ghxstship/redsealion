import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

/**
 * POST /api/emails/send — C-02 remediation.
 * Server-side email compose endpoint with RBAC enforcement and audit logging.
 * Currently records the draft to the database. Email delivery integration
 * (Resend, SES, SMTP) should be wired in at the provider call site below.
 */
export async function POST(request: Request) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  let body: {
    to: string;
    subject: string;
    body_text: string;
    thread_id?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } },
      { status: 400 },
    );
  }

  const { to, subject, body_text, thread_id } = body;

  if (!to || !subject || !body_text) {
    return NextResponse.json(
      { error: { code: 'VALIDATION', message: 'to, subject, and body_text are required' } },
      { status: 400 },
    );
  }

  const { supabase, organizationId, userId } = ctx;

  // Resolve sender info
  const { data: { user } } = await supabase.auth.getUser();
  const fromName = user?.user_metadata?.full_name ?? user?.email ?? 'Unknown';
  const fromEmail = user?.email ?? '';

  try {
    // If replying, use existing thread. Otherwise create a new thread.
    let finalThreadId = thread_id;

    if (!finalThreadId) {
      const { data: thread, error: threadErr } = await supabase
        .from('email_threads')
        .insert({
          organization_id: organizationId,
          subject,
          from_name: fromName,
          from_email: fromEmail,
          to_email: to,
          last_message_at: new Date().toISOString(),
          message_count: 1,
        })
        .select('id')
        .single();

      if (threadErr || !thread) {
        return NextResponse.json(
          { error: { code: 'DB_ERROR', message: threadErr?.message ?? 'Failed to create thread' } },
          { status: 500 },
        );
      }
      finalThreadId = thread.id;
    } else {
      // Update existing thread
      await supabase
        .from('email_threads')
        .update({
          last_message_at: new Date().toISOString(),
        })
        .eq('id', finalThreadId);

      // Increment message count
      const { data: currentThread } = await supabase
        .from('email_threads')
        .select('message_count')
        .eq('id', finalThreadId)
        .single();

      if (currentThread) {
        await supabase
          .from('email_threads')
          .update({
            message_count: (currentThread.message_count ?? 0) + 1,
            last_message_at: new Date().toISOString(),
          })
          .eq('id', finalThreadId);
      }
    }

    // Insert the message
    const { error: msgErr } = await supabase.from('email_messages').insert({
      thread_id: finalThreadId,
      organization_id: organizationId,
      from_name: fromName,
      from_email: fromEmail,
      to_emails: [to],
      subject,
      body_text,
      direction: 'outbound',
      status: 'queued', // Not 'sent' — actual delivery TBD
      sent_at: new Date().toISOString(),
    });

    if (msgErr) {
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: msgErr.message } },
        { status: 500 },
      );
    }

    // TODO: Wire email delivery provider (Resend, SES, SMTP) here.
    // On success, update message status to 'sent'.
    // On failure, update to 'failed' and return error.

    // Audit log
    try {
      await supabase.from('audit_logs').insert({
        organization_id: organizationId,
        user_id: userId,
        action: 'email.compose',
        entity_type: 'email_message',
        entity_id: finalThreadId,
        metadata: { to, subject },
      });
    } catch { /* non-blocking */ }

    return NextResponse.json({ success: true, thread_id: finalThreadId });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Failed to send email' } },
      { status: 500 },
    );
  }
}
