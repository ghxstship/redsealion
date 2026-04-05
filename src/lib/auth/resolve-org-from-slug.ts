import { createClient } from '@/lib/supabase/server';

/**
 * Resolves an organization from its public slug.
 * Used by the portal demo shell to scope data without requiring user auth.
 *
 * @returns Organization context or null if slug is invalid
 */
export async function resolveOrgFromSlug(
  orgSlug: string,
): Promise<{ organizationId: string; orgName: string; logoUrl: string | null } | null> {
  try {
    const supabase = await createClient();

    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, logo_url')
      .eq('slug', orgSlug)
      .single();

    if (!org) return null;

    return {
      organizationId: org.id,
      orgName: org.name,
      logoUrl: org.logo_url,
    };
  } catch {
    return null;
  }
}
