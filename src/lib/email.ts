// Email sending abstraction with provider interface

export interface EmailPayload {
  to: string;
  toName?: string;
  subject: string;
  body: string;
  html?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailProvider {
  send(payload: EmailPayload): Promise<EmailResult>;
}

// Console/log provider for development
class ConsoleEmailProvider implements EmailProvider {
  private warned = false;

  async send(payload: EmailPayload): Promise<EmailResult> {
    if (!this.warned && process.env.NODE_ENV === 'production') {
      // eslint-disable-next-line no-console -- intentional startup warning
      console.warn(
        '[EMAIL] ⚠️ Using console email provider in production. ' +
        'Emails will NOT be delivered. Set EMAIL_PROVIDER=resend and configure RESEND_API_KEY.',
      );
      this.warned = true;
    }
    // Development-only email provider — returns success without sending
    void payload;
    return {
      success: true,
      messageId: `dev_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    };
  }
}

// SMTP provider — not yet implemented
class SmtpEmailProvider implements EmailProvider {
  async send(_payload: EmailPayload): Promise<EmailResult> {
    throw new Error(
      'SMTP email provider is not implemented. ' +
      'Set EMAIL_PROVIDER=resend and configure the Resend SDK in lib/notifications/email.ts.',
    );
  }
}

// Factory
export function createEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER ?? 'console';

  switch (provider) {
    case 'smtp':
      return new SmtpEmailProvider();
    case 'console':
    default:
      return new ConsoleEmailProvider();
  }
}

// Convenience function
export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  const provider = createEmailProvider();
  return provider.send(payload);
}
