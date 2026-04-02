import { BaseIntegrationAdapter } from './base';

export class MondayAdapter extends BaseIntegrationAdapter {
  readonly platform = 'monday' as const;
  readonly displayName = 'Monday.com';
  readonly description = 'Create boards and items in Monday.com from proposals.';
  readonly category = 'pm' as const;

  async connect(config: Record<string, unknown>): Promise<{ authUrl: string }> {
    const clientId = config.clientId ?? process.env.MONDAY_CLIENT_ID;
    const redirectUri = config.redirectUri ?? `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/monday/callback`;
    const authUrl = `https://auth.monday.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(String(redirectUri))}`;
    return { authUrl };
  }

  async sync(
    _integrationId: string,
    direction: 'inbound' | 'outbound',
  ) {
    return {
      entityType: direction === 'outbound' ? 'board_item' : 'status_update',
      entityCount: 0,
      errors: [],
    };
  }
}
