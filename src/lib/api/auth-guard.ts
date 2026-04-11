import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveUserMembership } from '@/lib/api/permission-guard';
import type { OrganizationRole, SubscriptionTier } from '@/types/database';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Authenticated user context — returned by requireAuth().
 */
export interface AuthContext {
  userId: string;
  organizationId: string;
  role: OrganizationRole;
  tier: SubscriptionTier;
  /** Reusable Supabase client scoped to the authenticated user's session. */
  supabase: SupabaseClient;
}

/**
 * Centralized auth-only guard for API routes — SSOT.
 *
 * For routes that need authenticated user context but don't enforce
 * a specific resource/action permission (e.g., profile, calendar feed).
 *
 * Returns the full AuthContext (including supabase client) on success,
 * or null + NextResponse on failure.
 */
export async function requireAuth(): Promise<
  { ctx: AuthContext; denied: null } | { ctx: null; denied: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ctx: null,
      denied: NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      ),
    };
  }

  const membership = await resolveUserMembership(supabase, user.id);
  if (!membership) {
    return {
      ctx: null,
      denied: NextResponse.json(
        { error: { code: 'NO_MEMBERSHIP', message: 'No active organization membership' } },
        { status: 403 },
      ),
    };
  }

  // Fetch subscription tier from org
  const { data: org } = await supabase
    .from('organizations')
    .select('subscription_tier')
    .eq('id', membership.organizationId)
    .single();

  return {
    ctx: {
      userId: user.id,
      organizationId: membership.organizationId,
      role: membership.role,
      tier: (org?.subscription_tier as SubscriptionTier) ?? 'free',
      supabase,
    },
    denied: null,
  };
}

/**
 * Centralized admin-only guard for API routes — SSOT.
 * Builds upon requireAuth to enforce admin/owner role requirements.
 */
export async function requireAdmin(): Promise<
  { ctx: AuthContext; denied: null } | { ctx: null; denied: NextResponse }
> {
  const authMsg = await requireAuth();
  if (authMsg.denied) return authMsg;
  
  if (authMsg.ctx.role !== 'admin' && authMsg.ctx.role !== 'owner') {
    return {
      ctx: null,
      denied: NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 },
      ),
    };
  }
  
  return authMsg;
}

/**
 * Centralized webhook secret guard — SSOT.
 *
 * For external webhook endpoints (Zapier, Stripe, etc.) that authenticate
 * via a shared secret rather than user session.
 *
 * @param request - The incoming request
 * @param secretEnvVar - Environment variable name containing the secret
 * @param headerName - Header name to check (defaults to 'authorization' with Bearer)
 * @returns null if authorized, NextResponse(401) if denied
 */
export function requireWebhookSecret(
  request: Request,
  secretEnvVar: string,
  options?: {
    headerName?: string;
    queryParam?: string;
    useBearerPrefix?: boolean;
  },
): NextResponse | null {
  const secret = process.env[secretEnvVar];

  if (!secret) {
    return NextResponse.json(
      { error: { code: 'UNCONFIGURED', message: `${secretEnvVar} is not configured` } },
      { status: 500 },
    );
  }

  const headerName = options?.headerName ?? 'authorization';
  const useBearerPrefix = options?.useBearerPrefix ?? true;
  const expectedHeader = useBearerPrefix ? `Bearer ${secret}` : secret;

  const headerValue = request.headers.get(headerName);
  if (headerValue === expectedHeader) return null;

  // Optionally check query param
  if (options?.queryParam) {
    const url = new URL(request.url);
    if (url.searchParams.get(options.queryParam) === secret) return null;
  }

  return NextResponse.json(
    { error: { code: 'UNAUTHORIZED', message: 'Invalid or missing secret' } },
    { status: 401 },
  );
}
