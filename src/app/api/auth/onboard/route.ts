import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';

const log = createLogger('auth-onboard');

/**
 * POST /api/auth/onboard
 *
 * Called immediately after signup to provision:
 * 1. users row (if not already created by a trigger)
 * 2. organizations row
 * 3. The "owner" role for this org
 * 4. organization_memberships linking user → org as owner
 *
 * Body: { company_name: string, company_slug: string }
 */
export async function POST(request: Request) {
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
    const { data: existingUser } = await service
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!existingUser) {
      await service.from('users').insert({
        id: user.id,
        email: user.email ?? '',
        full_name: user.user_metadata?.full_name ?? '',
        status: 'active',
      });
    }

    // 4. Create organization
    const { data: org, error: orgError } = await service
      .from('organizations')
      .insert({
        name: company_name,
        slug,
        subscription_tier: 'free',
        owner_id: user.id,
      })
      .select('id')
      .single();

    if (orgError || !org) {
      log.error('Failed to create organization', { slug }, orgError);
      return NextResponse.json(
        { error: 'Failed to create organization.' },
        { status: 500 },
      );
    }

    // 5. Create "owner" role for this org
    const { data: ownerRole, error: roleError } = await service
      .from('roles')
      .insert({
        name: 'owner',
        display_name: 'Owner',
        description: 'Full organization control.',
        scope: 'organization',
        hierarchy_level: 100,
        is_system: true,
        is_default: false,
        organization_id: org.id,
        created_by: user.id,
      })
      .select('id')
      .single();

    if (roleError || !ownerRole) {
      log.error('Failed to create owner role', { orgId: org.id }, roleError);
      // Try to find existing global "owner" role
      const { data: globalOwner } = await service
        .from('roles')
        .select('id')
        .eq('name', 'owner')
        .eq('scope', 'organization')
        .is('organization_id', null)
        .maybeSingle();

      if (!globalOwner) {
        return NextResponse.json(
          { error: 'Failed to set up organization roles.' },
          { status: 500 },
        );
      }

      // Use global owner role
      await service.from('organization_memberships').insert({
        organization_id: org.id,
        user_id: user.id,
        role_id: globalOwner.id,
        status: 'active',
      });
    } else {
      // 6. Create membership linking user as owner
      await service.from('organization_memberships').insert({
        organization_id: org.id,
        user_id: user.id,
        role_id: ownerRole.id,
        status: 'active',
      });
    }

    return NextResponse.json({ success: true, organization_id: org.id });
  } catch (err) {
    log.error('Onboard failed', { userId: user.id }, err);
    return NextResponse.json(
      { error: 'An unexpected error occurred during setup.' },
      { status: 500 },
    );
  }
}
