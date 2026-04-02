/**
 * SMS provider abstraction for the notification system.
 */

export interface SmsProvider {
  send(to: string, body: string): Promise<void>;
}

/**
 * SMS provider backed by Twilio.
 *
 * Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER
 * environment variables. If any are missing the provider logs a warning
 * and returns silently.
 */
export class TwilioSmsProvider implements SmsProvider {
  private accountSid: string | undefined;
  private authToken: string | undefined;
  private fromNumber: string | undefined;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_FROM_NUMBER;
  }

  async send(to: string, body: string): Promise<void> {
    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      console.warn('[SMS] Twilio env vars not configured -- skipping SMS send');
      return;
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const credentials = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

      const params = new URLSearchParams({
        To: to,
        From: this.fromNumber,
        Body: body,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${credentials}`,
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('[SMS] Twilio API error:', response.status, errorBody);
      }
    } catch (error) {
      console.error('[SMS] Failed to send via Twilio:', error);
    }
  }
}
