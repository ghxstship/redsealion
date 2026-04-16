import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';
import { withRateLimit, RATE_LIMITS } from '@/lib/middleware/rate-limit';

const log = createLogger('auth-onboard');

/**
 * Default roles seeded for every new organization.
 * Each entry defines a role with its hierarchy level.
 * Higher levels = more permissions (owner > admin > member > viewer).
 */
const DEFAULT_ROLES = [
  { name: 'owner', display_name: 'Owner', description: 'Full organization control.', hierarchy_level: 100, is_default: false },
  { name: 'admin', display_name: 'Admin', description: 'Organization administration.', hierarchy_level: 80, is_default: false },
  { name: 'member', display_name: 'Member', description: 'Standard team member.', hierarchy_level: 40, is_default: true },
  { name: 'viewer', display_name: 'Viewer', description: 'Read-only access.', hierarchy_level: 10, is_default: false },
] as const;

/**
 * POST /api/auth/onboard
 *
 * Called immediately after signup to provision:
 * 1. users row (if not already created by a trigger)
 * 2. organizations row
 * 3. Default roles (owner, admin, member, viewer)
 * 4. organization_memberships linking user → org as owner
 * 5. auth_settings with sensible defaults
 * 6. seat_allocations for the free plan
 * 7. Sets onboarding_completed_at on the user record
 *
 * Body: { company_name: string, company_slug: string, first_name?: string, last_name?: string }
 */
export const POST = withRateLimit(RATE_LIMITS.auth, async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { company_name, company_slug } = body;

  if (!company_name || !company_slug) {
    return NextResponse.json(
      { error: 'company_name and company_slug are required.' },
      { status: 400 },
    );
  }

  // Normalize slug
  const slug = company_slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/^-|-$/g, '');

  if (slug.length < 2) {
    return NextResponse.json({ error: 'slug must be at least 2 characters.' }, { status: 400 });
  }

  // Use service client for privileged operations
  const service = await createServiceClient();

  try {
    // 1. Check if user already has an org membership
    const { data: existingMembership } = await service
      .from('organization_memberships')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (existingMembership) {
      // Already onboarded — idempotent success
      return NextResponse.json({ success: true, already_onboarded: true });
    }

    // 2. Check slug availability
    const { data: existingOrg } = await service
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existingOrg) {
      return NextResponse.json(
        { error: 'This URL slug is already taken. Please choose another.' },
        { status: 409 },
      );
    }

    // 3. Ensure user record exists
    // M-08: Use explicit first_name/last_name from body, or extract from Google metadata
    const { data: existingUser } = await service
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!existingUser) {
      // Prefer explicit names from request body, then Google metadata, then full_name split
      const givenName = body.first_name
        ?? user.user_metadata?.given_name
        ?? '';
      const familyName = body.last_name
        ?? user.user_metadata?.family_name
        ?? '';
      const fullName = body.first_name && body.last_name
        ? `${body.first_name} ${body.last_name}`.trim()
        : user.user_metadata?.full_name ?? `${givenName} ${familyName}`.trim();

      // Fallback: split full_name if given/family are empty
      let firstName = givenName;
      let lastName = familyName;
      if (!firstName && !lastName && fullName) {
        const nameParts = fullName.trim().split(/\s+/);
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }

      const { error: userError } = await service.from('users').insert({
        id: user.id,
        email: user.email ?? '',
        first_name: firstName,
        last_name: lastName,
        full_name: fullName || firstName,
        status: 'active',
      });
      if (userError) {
        log.error('Failed to create user record', { userId: user.id, userError: userError.message });
        return NextResponse.json(
          { error: 'Failed to set up user profile.', detail: userError.message },
          { status: 500 },
        );
      }
    }

    // 4. Create organization
    const { data: org, error: orgError } = await service
      .from('organizations')
      .insert({
        name: company_name,
        slug,
        subscription_tier: 'access',
        subscription_status: 'active',
        owner_id: user.id,
        currency: 'USD',
        timezone: 'America/New_York',
        language: 'en',
        invoice_prefix: 'INV',
        proposal_prefix: 'PROP',
        date_format: 'MM/DD/YYYY',
        time_format: '12h',
        first_day_of_week: 0,
        number_format: 'en-US',
      })
      .select('id')
      .single();

    if (orgError || !org) {
      log.error('Failed to create organization', { slug, orgError: orgError?.message, orgCode: orgError?.code, orgDetails: orgError?.details });
      return NextResponse.json(
        { error: 'Failed to create organization.', detail: orgError?.message },
        { status: 500 },
      );
    }

    // 5. C-10: Create default roles for this org
    const roleInserts = DEFAULT_ROLES.map((r) => ({
      name: r.name,
      display_name: r.display_name,
      description: r.description,
      scope: 'organization' as const,
      hierarchy_level: r.hierarchy_level,
      is_system: true,
      is_default: r.is_default,
      organization_id: org.id,
      created_by: user.id,
    }));

    const { data: createdRoles, error: rolesError } = await service
      .from('roles')
      .insert(roleInserts)
      .select('id, name');

    if (rolesError || !createdRoles?.length) {
      log.error('Failed to create default roles', { orgId: org.id }, rolesError);
      return NextResponse.json(
        { error: 'Failed to set up organization roles.' },
        { status: 500 },
      );
    }

    // Find the owner role from the created roles
    const ownerRole = createdRoles.find((r) => r.name === 'owner');
    if (!ownerRole) {
      log.error('Owner role not found in created roles', { orgId: org.id, createdRoles });
      return NextResponse.json(
        { error: 'Failed to set up organization roles.' },
        { status: 500 },
      );
    }

    // 6. C-01: Create membership linking user as owner (with joined_via)
    const { error: memError } = await service.from('organization_memberships').insert({
      organization_id: org.id,
      user_id: user.id,
      role_id: ownerRole.id,
      status: 'active',
      joined_via: 'org_creation',
    });

    if (memError) {
      log.error('Failed to create membership', { orgId: org.id, userId: user.id }, memError);
      return NextResponse.json(
        { error: 'Failed to set up organization membership.', detail: memError.message },
        { status: 500 },
      );
    }

    // 7. C-06: Create default auth_settings for this org
    const { error: authSettingsError } = await service.from('auth_settings').insert({
      organization_id: org.id,
      allowed_auth_methods: ['email_password', 'magic_link'],
      require_mfa: false,
      mfa_grace_period_days: 7,
      password_min_length: 12,
      password_require_uppercase: true,
      password_require_number: true,
      password_require_symbol: true,
      session_max_age_hours: 720,
      session_idle_timeout_minutes: 60,
      max_concurrent_sessions: 5,
    });

    if (authSettingsError) {
      log.warn('Failed to create auth_settings (non-fatal)', { orgId: org.id }, authSettingsError);
    }

    // 8. C-07: Create seat_allocations for the free plan
    // First, find or create the free plan
    const { data: freePlan } = await service
      .from('subscription_plans')
      .select('id, internal_seats_included, external_seats_included')
      .eq('name', 'Access')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (freePlan) {
      const { error: seatError } = await service.from('seat_allocations').insert({
        organization_id: org.id,
        plan_id: freePlan.id,
        internal_seats_included: freePlan.internal_seats_included,
        external_seats_included: freePlan.external_seats_included,
      });
      if (seatError) {
        log.warn('Failed to create seat_allocations (non-fatal)', { orgId: org.id }, seatError);
      }
    } else {
      log.warn('No free plan found in subscription_plans — skipping seat_allocations', { orgId: org.id });
    }

    // 9. C-09: Mark onboarding as completed
    const { error: onboardingError } = await service
      .from('users')
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq('id', user.id);

    if (onboardingError) {
      log.warn('Failed to set onboarding_completed_at (non-fatal)', { userId: user.id }, onboardingError);
    }

    // 10. H-02: Log the org creation event
    try {
      await service.from('auth_events').insert({
        user_id: user.id,
        organization_id: org.id,
        event_type: 'org_created',
        metadata: { company_name, slug },
      });
    } catch { /* non-fatal */ }

    return NextResponse.json({ success: true, organization_id: org.id });
  } catch (err) {
    log.error('Onboard failed', { userId: user.id }, err);
    return NextResponse.json(
      { error: 'An unexpected error occurred during setup.' },
      { status: 500 },
    );
  }
});
