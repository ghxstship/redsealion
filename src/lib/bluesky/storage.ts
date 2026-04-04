/**
 * Supabase-backed storage adapters for AT Protocol OAuth.
 *
 * The AT Protocol OAuth client requires two stores:
 * 1. StateStore  – short-lived CSRF state during the authorization flow
 * 2. SessionStore – longer-lived session tokens (access + refresh + DPoP)
 *
 * Both are backed by Supabase tables and accessed via the service role client
 * (these tables have no RLS policies for normal users).
 */

import type { NodeSavedState, NodeSavedSession } from '@atproto/oauth-client-node';
import { createServiceClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// State Store (CSRF tokens during OAuth flow)
// ---------------------------------------------------------------------------

export class SupabaseStateStore {
  async get(key: string): Promise<NodeSavedState | undefined> {
    const supabase = await createServiceClient();
    const { data } = await supabase
      .from('atproto_oauth_state')
      .select('value')
      .eq('key', key)
      .single();

    if (!data) return undefined;

    // Auto-expire stale state
    const record = data as { value: NodeSavedState };
    return record.value;
  }

  async set(key: string, value: NodeSavedState): Promise<void> {
    const supabase = await createServiceClient();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

    await supabase.from('atproto_oauth_state').upsert({
      key,
      value,
      expires_at: expiresAt,
    });
  }

  async del(key: string): Promise<void> {
    const supabase = await createServiceClient();
    await supabase.from('atproto_oauth_state').delete().eq('key', key);
  }
}

// ---------------------------------------------------------------------------
// Session Store (AT Protocol access/refresh tokens)
// ---------------------------------------------------------------------------

export class SupabaseSessionStore {
  async get(key: string): Promise<NodeSavedSession | undefined> {
    const supabase = await createServiceClient();
    const { data } = await supabase
      .from('atproto_oauth_sessions')
      .select('value')
      .eq('key', key)
      .single();

    if (!data) return undefined;

    const record = data as { value: NodeSavedSession };
    return record.value;
  }

  async set(key: string, value: NodeSavedSession): Promise<void> {
    const supabase = await createServiceClient();
    // Sessions are longer-lived — 90 day expiry (refresh tokens handle renewal)
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    await supabase.from('atproto_oauth_sessions').upsert({
      key,
      value,
      updated_at: new Date().toISOString(),
      expires_at: expiresAt,
    });
  }

  async del(key: string): Promise<void> {
    const supabase = await createServiceClient();
    await supabase.from('atproto_oauth_sessions').delete().eq('key', key);
  }
}
