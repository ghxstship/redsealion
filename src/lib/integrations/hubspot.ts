import { BaseIntegrationAdapter } from './base';

export class HubSpotAdapter extends BaseIntegrationAdapter {
  readonly platform = 'hubspot' as const;
  readonly displayName = 'HubSpot';
  readonly description = 'Sync contacts, deals, and companies with HubSpot CRM.';
  readonly category = 'crm' as const;

  async connect(config: Record<string, unknown>): Promise<{ authUrl: string }> {
    const clientId = config.clientId ?? process.env.HUBSPOT_CLIENT_ID;
    const redirectUri = config.redirectUri ?? `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/hubspot/callback`;
    const scopes = 'crm.objects.contacts.read crm.objects.contacts.write crm.objects.deals.read crm.objects.deals.write';
    const authUrl = `https://app.hubspot.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(String(redirectUri))}&scope=${encodeURIComponent(scopes)}`;
    return { authUrl };
  }

  async sync(
    _integrationId: string,
    direction: 'inbound' | 'outbound',
  ) {
    return {
      entityType: direction === 'inbound' ? 'client' : 'deal',
      entityCount: 0,
      errors: [],
    };
  }
}
