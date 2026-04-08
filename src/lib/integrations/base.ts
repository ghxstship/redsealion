// Integration adapter base interface

import { createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';

const log = createLogger('integrations');

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

  /**
   * Default disconnect: deletes the integrations row from the database.
   * Subclasses can override to also revoke OAuth tokens.
   */
  async disconnect(integrationId: string): Promise<void> {
    const supabase = await createServiceClient();
    const { error } = await supabase
      .from('integrations')
      .delete()
      .eq('id', integrationId);

    if (error) {
      log.error(`${this.platform}: Failed to disconnect`, { integrationId }, error);
      throw new Error(`Failed to disconnect ${this.displayName}.`);
    }
  }

  async sync(
    _integrationId: string,
    _direction: 'inbound' | 'outbound',
  ): Promise<SyncResult> {
    // Default sync is a no-op for adapters that haven't implemented sync yet
    return {
      entityType: this.platform,
      entityCount: 0,
      errors: [`${this.displayName} sync is not yet available.`],
    };
  }

  /**
   * Default getStatus: reads the integration row from the database.
   * Subclasses can override to also check the remote API health.
   */
  async getStatus(integrationId: string): Promise<IntegrationStatus> {
    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from('integrations')
      .select('id, status, last_sync_at')
      .eq('id', integrationId)
      .single();

    if (error || !data) {
      return { connected: false, lastSyncAt: null, error: 'Integration not found.' };
    }

    return {
      connected: (data.status as string) === 'active',
      lastSyncAt: (data.last_sync_at as string) ?? null,
      error: null,
    };
  }
}
