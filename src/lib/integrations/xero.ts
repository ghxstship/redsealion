import { BaseIntegrationAdapter } from './base';

export class XeroAdapter extends BaseIntegrationAdapter {
  readonly platform = 'xero' as const;
  readonly displayName = 'Xero';
  readonly description = 'Sync invoices, payments, and contacts with Xero accounting.';
  readonly category = 'accounting' as const;

  async connect(config: Record<string, unknown>): Promise<{ authUrl: string }> {
    const clientId = config.clientId ?? process.env.XERO_CLIENT_ID;
    const redirectUri = config.redirectUri ?? `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/xero/callback`;
    const scopes = 'openid profile email accounting.transactions accounting.contacts';
    const authUrl = `https://login.xero.com/identity/connect/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(String(redirectUri))}&scope=${encodeURIComponent(scopes)}`;
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
