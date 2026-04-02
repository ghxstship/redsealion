/**
 * Email provider abstraction for the notification system.
 */

export interface EmailProvider {
  send(to: string, subject: string, html: string): Promise<void>;
}

/**
 * Email provider backed by Resend (https://resend.com).
 *
 * Requires the RESEND_API_KEY environment variable. If the key is missing
 * the provider logs a warning and returns silently so the rest of the
 * application can continue to function in development.
 */
export class ResendEmailProvider implements EmailProvider {
  private apiKey: string | undefined;
  private fromAddress: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY;
    this.fromAddress = process.env.RESEND_FROM_ADDRESS ?? 'notifications@flytedeck.com';
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.apiKey) {
      console.warn('[Email] RESEND_API_KEY is not set -- skipping email send');
      return;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: this.fromAddress,
          to,
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('[Email] Resend API error:', response.status, errorBody);
      }
    } catch (error) {
      console.error('[Email] Failed to send via Resend:', error);
    }
  }
}
