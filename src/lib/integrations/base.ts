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
    throw new Error(`${this.platform}: connect() not implemented. Override in your adapter subclass.`);
  }

  async disconnect(_integrationId: string): Promise<void> {
    throw new Error(`${this.platform}: disconnect() not implemented. Override in your adapter subclass.`);
  }

  async sync(
    _integrationId: string,
    _direction: 'inbound' | 'outbound',
  ): Promise<SyncResult> {
    throw new Error(`${this.platform}: sync() not implemented. Override in your adapter subclass.`);
  }

  async getStatus(_integrationId: string): Promise<IntegrationStatus> {
    throw new Error(`${this.platform}: getStatus() not implemented. Override in your adapter subclass.`);
  }
}
