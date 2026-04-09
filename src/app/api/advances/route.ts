import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';
import { canAccessFeature } from '@/lib/subscription';
import { validateCreateAdvance } from '@/lib/advances/validations';
import type { AdvanceFilters } from '@/lib/advances/types';

/**
 * GET /api/advances — List advances (own org + collaborating)
 */
export async function GET(request: NextRequest) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  if (!canAccessFeature(ctx.tier, 'advancing')) {
    return NextResponse.json(
      { error: 'Plan upgrade required', message: 'Advancing requires Starter plan or above.' },
      { status: 403 },
    );
  }

  const { searchParams } = request.nextUrl;
  const tab = (searchParams.get('tab') ?? 'all') as AdvanceFilters['tab'];
  const status = searchParams.get('status');
  const mode = searchParams.get('mode');
  const type = searchParams.get('type');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '25', 10), 100);
  const offset = (page - 1) * limit;

  let query = ctx.supabase
    .from('production_advances')
    .select('*, projects(name)', { count: 'exact' })
    .is('deleted_at', null);

  // Tab-based filtering
  switch (tab) {
    case 'my_advances':
      query = query.eq('organization_id', ctx.organizationId).eq('submitted_by', ctx.userId);
      break;
    case 'pending_review':
      query = query.eq('organization_id', ctx.organizationId).in('status', ['submitted', 'under_review']);
      break;
    case 'collaborations': {
      // Advances where the user is a collaborator (not the owning org)
      const collabResult = await ctx.supabase
        .from('advance_collaborators')
        .select('advance_id')
        .eq('user_id', ctx.userId)
        .eq('invite_status', 'accepted');
      const collabIds = (collabResult.data ?? []).map(c => (c as Record<string, unknown>).advance_id as string);
      query = ctx.supabase
        .from('production_advances')
        .select('*, projects(name)', { count: 'exact' })
        .in('id', collabIds.length > 0 ? collabIds : ['__none__']);
      break;
    }
    case 'approved':
      query = query.eq('organization_id', ctx.organizationId).eq('status', 'approved');
      break;
    case 'fulfilled':
      query = query.eq('organization_id', ctx.organizationId).in('status', ['fulfilled', 'completed']);
      break;
    default:
      query = query.eq('organization_id', ctx.organizationId);
  }

  if (status) query = query.eq('status', status);
  if (mode) query = query.eq('advance_mode', mode);
  if (type) query = query.eq('advance_type', type);
  if (search) query = query.textSearch('search_vector', search, { type: 'websearch', config: 'english' });

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch advances', details: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data ?? [],
    meta: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
  });
}

/**
 * POST /api/advances — Create a new advance
 */
export async function POST(request: NextRequest) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  if (!canAccessFeature(ctx.tier, 'advancing')) {
    return NextResponse.json(
      { error: 'Plan upgrade required', message: 'Advancing requires Starter plan or above.' },
      { status: 403 },
    );
  }

  const body = await request.json();

  // Collection mode requires Professional tier
  if (body.advance_mode === 'collection' && !canAccessFeature(ctx.tier, 'advancing_collection')) {
    return NextResponse.json(
      { error: 'Plan upgrade required', message: 'Collection mode requires Professional plan or above.' },
      { status: 403 },
    );
  }

  const validation = validateCreateAdvance(body);
  if (!validation.valid) {
    return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 422 });
  }

  // M-12: Enforce advancesPerMonth tier limit
  const { TIER_LIMITS } = await import('@/lib/advances/constants');
  const limits = TIER_LIMITS[ctx.tier as keyof typeof TIER_LIMITS] ?? TIER_LIMITS.free;
  if (limits.advancesPerMonth < Infinity) {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { count } = await ctx.supabase
      .from('production_advances')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', ctx.organizationId)
      .gte('created_at', monthStart.toISOString());

    if ((count ?? 0) >= limits.advancesPerMonth) {
      return NextResponse.json(
        { error: `Monthly advance limit reached (${limits.advancesPerMonth} on ${ctx.tier} plan)` },
        { status: 403 },
      );
    }
  }

  // Generate advance number
  const { data: advNumber } = await ctx.supabase.rpc('generate_advance_number', { org_id: ctx.organizationId });

  const { data, error } = await ctx.supabase
    .from('production_advances')
    .insert({
      organization_id: ctx.organizationId,
      advance_number: advNumber ?? `ADV-${Date.now()}`,
      advance_mode: body.advance_mode,
      advance_type: body.advance_type,
      project_id: body.project_id ?? null,
      event_name: body.event_name ?? null,
      company_name: body.company_name ?? null,
      venue_name: body.venue_name ?? null,
      venue_address: body.venue_address ?? null,
      submitted_by: ctx.userId,
      created_by: ctx.userId,
      contact_name: body.contact_name ?? null,
      contact_email: body.contact_email ?? null,
      contact_phone: body.contact_phone ?? null,
      priority: body.priority ?? 'medium',
      service_start_date: body.service_start_date ?? null,
      service_end_date: body.service_end_date ?? null,
      load_in_date: body.load_in_date ?? null,
      strike_date: body.strike_date ?? null,
      submission_deadline: body.submission_deadline ?? null,
      purpose: body.purpose ?? null,
      special_considerations: body.special_considerations ?? null,
      notes: body.notes ?? null,
      submission_instructions: body.submission_instructions ?? null,
      fulfillment_type: body.fulfillment_type ?? 'delivery',
      // Collection mode settings
      is_catalog_shared: body.is_catalog_shared ?? false,
      allow_ad_hoc_items: body.allow_ad_hoc_items ?? true,
      require_approval_per_contributor: body.require_approval_per_contributor ?? true,
      allowed_advance_types: body.allowed_advance_types ?? [],
      allowed_category_groups: body.allowed_category_groups ?? [],
      max_submissions: body.max_submissions ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create advance', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
