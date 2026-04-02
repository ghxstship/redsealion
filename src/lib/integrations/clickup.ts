import { BaseIntegrationAdapter } from './base';

export class ClickUpAdapter extends BaseIntegrationAdapter {
  readonly platform = 'clickup' as const;
  readonly displayName = 'ClickUp';
  readonly description = 'Create tasks and projects in ClickUp from proposals.';
  readonly category = 'pm' as const;

  async connect(config: Record<string, unknown>): Promise<{ authUrl: string }> {
    const clientId = config.clientId ?? process.env.CLICKUP_CLIENT_ID;
    const redirectUri = config.redirectUri ?? `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/clickup/callback`;
    const authUrl = `https://app.clickup.com/api?client_id=${clientId}&redirect_uri=${encodeURIComponent(String(redirectUri))}`;
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
