import type { IntegrationAdapter } from './base';
import { SalesforceAdapter } from './salesforce';
import { HubSpotAdapter } from './hubspot';
import { PipedriveAdapter } from './pipedrive';
import { QuickBooksAdapter } from './quickbooks';
import { XeroAdapter } from './xero';
import { SlackAdapter } from './slack';
import { AsanaAdapter } from './asana';
import { ClickUpAdapter } from './clickup';
import { MondayAdapter } from './monday';
import { GoogleCalendarAdapter } from './google-calendar';

const adapters: Record<string, IntegrationAdapter> = {
  salesforce: new SalesforceAdapter(),
  hubspot: new HubSpotAdapter(),
  pipedrive: new PipedriveAdapter(),
  quickbooks: new QuickBooksAdapter(),
  xero: new XeroAdapter(),
  slack: new SlackAdapter(),
  asana: new AsanaAdapter(),
  clickup: new ClickUpAdapter(),
  monday: new MondayAdapter(),
  'google-calendar': new GoogleCalendarAdapter(),
  // Also allow underscore variant used in some adapters
  google_calendar: new GoogleCalendarAdapter(),
};

export function getAdapter(platform: string): IntegrationAdapter | null {
  return adapters[platform] ?? null;
}

export const SUPPORTED_PLATFORMS = Object.keys(adapters);

/**
 * OAuth token endpoint URLs per platform.
 */
export const TOKEN_ENDPOINTS: Record<string, string> = {
  salesforce: 'https://login.salesforce.com/services/oauth2/token',
  hubspot: 'https://api.hubapi.com/oauth/v1/token',
  pipedrive: 'https://oauth.pipedrive.com/oauth/token',
  quickbooks: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
  xero: 'https://identity.xero.com/connect/token',
  slack: 'https://slack.com/api/oauth.v2.access',
  asana: 'https://app.asana.com/-/oauth_token',
  clickup: 'https://api.clickup.com/api/v2/oauth/token',
  monday: 'https://auth.monday.com/oauth2/token',
  'google-calendar': 'https://oauth2.googleapis.com/token',
  google_calendar: 'https://oauth2.googleapis.com/token',
};

/**
 * Return the env var name prefix for a platform.
 * e.g. "salesforce" -> "SALESFORCE", "google-calendar" -> "GOOGLE_CALENDAR"
 */
export function envPrefix(platform: string): string {
  return platform.replace(/-/g, '_').toUpperCase();
}
