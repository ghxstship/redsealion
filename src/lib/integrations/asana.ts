import { BaseIntegrationAdapter } from './base';

export class AsanaAdapter extends BaseIntegrationAdapter {
  readonly platform = 'asana' as const;
  readonly displayName = 'Asana';
  readonly description = 'Create tasks and projects in Asana from proposals.';
  readonly category = 'pm' as const;

  async connect(config: Record<string, unknown>): Promise<{ authUrl: string }> {
    const clientId = config.clientId ?? process.env.ASANA_CLIENT_ID;
    const redirectUri = config.redirectUri ?? `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/asana/callback`;
    const authUrl = `https://app.asana.com/-/oauth_authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(String(redirectUri))}&response_type=code`;
    return { authUrl };
  }

  async sync(
    _integrationId: string,
    direction: 'inbound' | 'outbound',
  ) {
    return {
      entityType: direction === 'outbound' ? 'task' : 'status_update',
      entityCount: 0,
      errors: [],
    };
  }
}
