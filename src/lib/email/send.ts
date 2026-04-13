import { Resend } from 'resend';

// ---------------------------------------------------------------------------
// Email sender — Resend wrapper
// ---------------------------------------------------------------------------
// Single point of entry for all transactional email in the platform.
// Uses the RESEND_API_KEY env var. Falls back to console logging in dev
// when no API key is configured.
// ---------------------------------------------------------------------------

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

/**
 * Default "from" address. Override via RESEND_FROM_EMAIL env var.
 * Resend requires a verified domain — use `onboarding@resend.dev` for testing.
 */
const DEFAULT_FROM = process.env.RESEND_FROM_ADDRESS ?? 'Success on Site <sos@ghxstship.pro>';

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  /** Override the default "from" address */
  from?: string;
  /** Reply-to address (e.g., the inviter's email) */
  replyTo?: string;
  /** Optional tags for Resend analytics */
  tags?: Array<{ name: string; value: string }>;
}

interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Send a transactional email via Resend.
 *
 * In development without RESEND_API_KEY, logs the email to console instead
 * of sending, so invitations still work in local dev.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const { to, subject, html, from = DEFAULT_FROM, replyTo, tags } = options;

  // Dev fallback — log instead of sending
  if (!resend) {
    console.log('[email] RESEND_API_KEY not set — logging email instead of sending');
    console.log(`[email] To: ${Array.isArray(to) ? to.join(', ') : to}`);
    console.log(`[email] Subject: ${subject}`);
    console.log(`[email] From: ${from}`);
    if (replyTo) console.log(`[email] Reply-To: ${replyTo}`);
    console.log(`[email] HTML length: ${html.length} chars`);
    return { success: true, id: `dev-${Date.now()}` };
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
      ...(tags ? { tags } : {}),
    });

    if (error) {
      console.error('[email] Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[email] Send failed:', message);
    return { success: false, error: message };
  }
}
