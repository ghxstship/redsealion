// Integration adapter base interface

export interface SyncResult {
  entityType: string;
  entityCount: number;
  errors: string[];
}

export interface IntegrationStatus {
  connected: boolean;
  lastSyncAt: string | null;
  error: string | null;
}

export interface IntegrationAdapter {
  readonly platform: string;
  readonly displayName: string;
  readonly description: string;
  readonly category: 'crm' | 'accounting' | 'pm' | 'calendar' | 'messaging' | 'automation';

  connect(config: Record<string, unknown>): Promise<{ authUrl: string }>;
  disconnect(integrationId: string): Promise<void>;
  sync(integrationId: string, direction: 'inbound' | 'outbound'): Promise<SyncResult>;
  getStatus(integrationId: string): Promise<IntegrationStatus>;
}

export abstract class BaseIntegrationAdapter implements IntegrationAdapter {
  abstract readonly platform: string;
  abstract readonly displayName: string;
  abstract readonly description: string;
  abstract readonly category: IntegrationAdapter['category'];

  async connect(_config: Record<string, unknown>): Promise<{ authUrl: string }> {
    // Placeholder: in production, build OAuth URL for the platform
    return { authUrl: `/api/integrations/${this.platform}/connect` };
  }

  async disconnect(_integrationId: string): Promise<void> {
    // Placeholder: revoke tokens and update status
  }

  async sync(
    _integrationId: string,
    _direction: 'inbound' | 'outbound',
  ): Promise<SyncResult> {
    return { entityType: 'unknown', entityCount: 0, errors: [] };
  }

  async getStatus(_integrationId: string): Promise<IntegrationStatus> {
    return { connected: false, lastSyncAt: null, error: null };
  }
}
