import { BaseIntegrationAdapter } from './base';

export class QuickBooksAdapter extends BaseIntegrationAdapter {
  readonly platform = 'quickbooks' as const;
  readonly displayName = 'QuickBooks';
  readonly description = 'Sync invoices, payments, and customers with QuickBooks Online.';
  readonly category = 'accounting' as const;

  async connect(config: Record<string, unknown>): Promise<{ authUrl: string }> {
    const clientId = config.clientId ?? process.env.QUICKBOOKS_CLIENT_ID;
    const redirectUri = config.redirectUri ?? `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/quickbooks/callback`;
    const scopes = 'com.intuit.quickbooks.accounting';
    const authUrl = `https://appcenter.intuit.com/connect/oauth2?client_id=${clientId}&redirect_uri=${encodeURIComponent(String(redirectUri))}&scope=${encodeURIComponent(scopes)}&response_type=code`;
    return { authUrl };
  }

  async sync(
    _integrationId: string,
    direction: 'inbound' | 'outbound',
  ) {
    return {
      entityType: direction === 'outbound' ? 'invoice' : 'payment',
      entityCount: 0,
      errors: [],
    };
  }
}
