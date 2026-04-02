import { BaseIntegrationAdapter } from './base';

export class SalesforceAdapter extends BaseIntegrationAdapter {
  readonly platform = 'salesforce' as const;
  readonly displayName = 'Salesforce';
  readonly description = 'Sync contacts, opportunities, and accounts with Salesforce CRM.';
  readonly category = 'crm' as const;

  async connect(config: Record<string, unknown>): Promise<{ authUrl: string }> {
    const clientId = config.clientId ?? process.env.SALESFORCE_CLIENT_ID;
    const redirectUri = config.redirectUri ?? `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/salesforce/callback`;
    const authUrl = `https://login.salesforce.com/services/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(String(redirectUri))}`;
    return { authUrl };
  }

  async sync(
    _integrationId: string,
    direction: 'inbound' | 'outbound',
  ) {
    // Placeholder: map Salesforce objects to XPB entities
    return {
      entityType: direction === 'inbound' ? 'client' : 'opportunity',
      entityCount: 0,
      errors: [],
    };
  }
}
