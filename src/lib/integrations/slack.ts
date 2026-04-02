import { BaseIntegrationAdapter } from './base';

export class SlackAdapter extends BaseIntegrationAdapter {
  readonly platform = 'slack' as const;
  readonly displayName = 'Slack';
  readonly description = 'Send notifications and updates to Slack channels.';
  readonly category = 'messaging' as const;

  async connect(config: Record<string, unknown>): Promise<{ authUrl: string }> {
    const clientId = config.clientId ?? process.env.SLACK_CLIENT_ID;
    const redirectUri = config.redirectUri ?? `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/slack/callback`;
    const scopes = 'chat:write,channels:read';
    const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(String(redirectUri))}&scope=${encodeURIComponent(scopes)}`;
    return { authUrl };
  }

  async sync(
    _integrationId: string,
    _direction: 'inbound' | 'outbound',
  ) {
    return {
      entityType: 'notification',
      entityCount: 0,
      errors: [],
    };
  }
}
