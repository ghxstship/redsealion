/**
 * Supabase relation cast utility.
 *
 * When Supabase returns a joined relation via `.select('roles(name)')`,
 * the TypeScript type for that property is the raw DB row or `unknown`.
 * This utility provides a single, auditable boundary for narrowing
 * these relation objects to their expected shape.
 *
 * All Supabase join-relation casts in the codebase should route through
 * this module to avoid scattering `as unknown as` across business logic.
 *
 * @module lib/supabase/cast-relation
 */

/**
 * Cast a Supabase joined relation to the expected shape.
 *
 * @example
 * ```ts
 * const user = castRelation<{ full_name: string }>(row.users);
 * const name = user?.full_name ?? 'Unknown';
 * ```
 */
export function castRelation<T>(val: unknown): T | null {
  return (val ?? null) as T | null;
}
