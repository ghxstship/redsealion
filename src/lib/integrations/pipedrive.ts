import { BaseIntegrationAdapter } from './base';

export class PipedriveAdapter extends BaseIntegrationAdapter {
  readonly platform = 'pipedrive' as const;
  readonly displayName = 'Pipedrive';
  readonly description = 'Sync contacts and deals with Pipedrive CRM.';
  readonly category = 'crm' as const;

  async connect(config: Record<string, unknown>): Promise<{ authUrl: string }> {
    const clientId = config.clientId ?? process.env.PIPEDRIVE_CLIENT_ID;
    const redirectUri = config.redirectUri ?? `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/pipedrive/callback`;
    const authUrl = `https://oauth.pipedrive.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(String(redirectUri))}`;
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
