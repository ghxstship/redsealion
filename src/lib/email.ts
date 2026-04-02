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
  async send(payload: EmailPayload): Promise<EmailResult> {
    console.log('[Email] Sending email:', {
      to: payload.to,
      subject: payload.subject,
      bodyLength: payload.body.length,
    });
    return {
      success: true,
      messageId: `dev_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    };
  }
}

// SMTP provider placeholder
class SmtpEmailProvider implements EmailProvider {
  async send(payload: EmailPayload): Promise<EmailResult> {
    // TODO: Implement SMTP sending via nodemailer or similar
    console.log('[Email] SMTP send not implemented, falling back to console:', payload.subject);
    return {
      success: true,
      messageId: `smtp_placeholder_${Date.now()}`,
    };
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
