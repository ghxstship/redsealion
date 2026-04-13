/**
 * RBAC — Feature Flag Evaluation
 *
 * Implements the feature flag resolution algorithm.
 * Server-side only. Client receives Record<string, boolean>.
 */
import { createClient } from '@/lib/supabase/server';

/**
 * Evaluate a single feature flag for the given org/user context.
 */
async function evaluateFlag(
  key: string,
  orgId: string | null,
  userId: string | null,
): Promise<boolean> {
  const supabase = await createClient();

  // Delegate to Postgres function for consistency
  const { data: result } = await supabase.rpc('evaluate_feature_flag', {
    p_key: key,
    p_org_id: orgId,
    p_user_id: userId,
  });

  return result === true;
}

/**
 * Evaluate all feature flags for the given context.
 * Returns a map of flag key → boolean.
 */
export async function evaluateAllFlags(
  orgId: string | null,
  userId: string | null,
): Promise<Record<string, boolean>> {
  const supabase = await createClient();

  const { data: flags } = await supabase
    .from('feature_flags')
    .select('key');

  if (!flags) return {};

  const results: Record<string, boolean> = {};
  for (const flag of flags) {
    const flagKey = flag.key as string;
    results[flagKey] = await evaluateFlag(flagKey, orgId, userId);
  }

  return results;
}

/**
 * Check if a specific feature is enabled. Convenience wrapper.
 */
export async function isFeatureEnabled(
  key: string,
  orgId: string,
  userId: string | null = null,
): Promise<boolean> {
  return evaluateFlag(key, orgId, userId);
}
