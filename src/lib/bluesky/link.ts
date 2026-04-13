/**
 * Bluesky account link/unlink operations.
 *
 * Uses the service role client for writing to bluesky_accounts since the
 * RLS policies require auth.uid() = user_id, and we need to set the
 * user_id explicitly from server context.
 */

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';

const logger = createLogger('bluesky');

interface LinkBlueskyParams {
  userId: string;
  did: string;
  handle: string;
}

/**
 * Link a Bluesky identity (DID) to a FlyteDeck user.
 *
 * Idempotent — if the DID is already linked to this user, it updates the handle.
 * Throws if the DID is linked to a different user.
 */
export async function linkBlueskyAccount({ userId, did, handle }: LinkBlueskyParams) {
  const supabase = await createServiceClient();

  // Check if this DID is already linked
  const { data: existing } = await supabase
    .from('bluesky_accounts')
    .select('id, user_id')
    .eq('did', did)
    .single();

  if (existing) {
    if (existing.user_id !== userId) {
      throw new Error('This Bluesky account is already linked to another FlyteDeck user.');
    }

    // Update handle if it changed
    await supabase
      .from('bluesky_accounts')
      .update({ handle, updated_at: new Date().toISOString() })
      .eq('id', existing.id);

    logger.info('Updated linked Bluesky account', { userId, did, handle });
    return existing.id;
  }

  // Create new link
  const { data, error } = await supabase
    .from('bluesky_accounts')
    .insert({ user_id: userId, did, handle })
    .select('id')
    .single();

  if (error) {
    logger.error('Failed to link Bluesky account', { userId, did }, error);
    throw new Error('Failed to link Bluesky account.');
  }

  logger.info('Linked Bluesky account', { userId, did, handle });
  return data.id;
}

/**
 * Unlink a Bluesky identity from a FlyteDeck user.
 */
async function unlinkBlueskyAccount(userId: string) {
  const supabase = await createServiceClient();

  const { error } = await supabase
    .from('bluesky_accounts')
    .delete()
    .eq('user_id', userId);

  if (error) {
    logger.error('Failed to unlink Bluesky account', { userId }, error);
    throw new Error('Failed to unlink Bluesky account.');
  }

  logger.info('Unlinked Bluesky account', { userId });
}

/**
 * Get the linked Bluesky account for a user, if any.
 */
async function getLinkedBlueskyAccount(userId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from('bluesky_accounts')
    .select('id, did, handle, created_at')
    .eq('user_id', userId)
    .single();

  return data;
}
