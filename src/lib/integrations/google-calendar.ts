import { BaseIntegrationAdapter } from './base';

export class GoogleCalendarAdapter extends BaseIntegrationAdapter {
  readonly platform = 'google_calendar' as const;
  readonly displayName = 'Google Calendar';
  readonly description = 'Sync milestones and deadlines to Google Calendar.';
  readonly category = 'calendar' as const;

  async connect(config: Record<string, unknown>): Promise<{ authUrl: string }> {
    const clientId = config.clientId ?? process.env.GOOGLE_CLIENT_ID;
    const redirectUri = config.redirectUri ?? `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google_calendar/callback`;
    const scopes = 'https://www.googleapis.com/auth/calendar.events';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(String(redirectUri))}&scope=${encodeURIComponent(scopes)}&response_type=code&access_type=offline`;
    return { authUrl };
  }

  async sync(
    _integrationId: string,
    direction: 'inbound' | 'outbound',
  ) {
    return {
      entityType: direction === 'outbound' ? 'calendar_event' : 'milestone',
      entityCount: 0,
      errors: [],
    };
  }
}
