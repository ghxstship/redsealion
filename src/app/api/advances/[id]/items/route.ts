import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';
import { validateAddLineItem } from '@/lib/advances/validations';

/**
 * GET  /api/advances/[id]/items — List line items with filtering & pagination
 * POST /api/advances/[id]/items — Add line item
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const { id } = await params;

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') ?? '1', 10);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10), 100);
  const offset = (page - 1) * limit;
  const fulfillmentStatus = url.searchParams.get('fulfillment_status');
  const approvalStatus = url.searchParams.get('approval_status');
  const collaboratorId = url.searchParams.get('collaborator_id');

  let query = ctx.supabase
    .from('advance_line_items')
    .select('*', { count: 'exact' })
    .eq('advance_id', id)
    .is('deleted_at', null);

  if (fulfillmentStatus) query = query.eq('fulfillment_status', fulfillmentStatus);
  if (approvalStatus) query = query.eq('approval_status', approvalStatus);
  if (collaboratorId) query = query.eq('collaborator_id', collaboratorId);

  query = query
    .order('sort_order', { ascending: true })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch line items', details: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data ?? [],
    pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json();

  // Validate line item
  const validation = validateAddLineItem(body);
  if (!validation.valid) {
    return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 422 });
  }

  // Verify advance exists and is in writable state
  const { data: advance } = await ctx.supabase
    .from('production_advances')
    .select('status, advance_mode, organization_id, submission_deadline, allow_ad_hoc_items')
    .eq('id', id)
    .single();

  if (!advance) {
    return NextResponse.json({ error: 'Advance not found' }, { status: 404 });
  }

  const a = advance as Record<string, unknown>;
  const writableStatuses = ['draft', 'open_for_submissions', 'changes_requested'];
  if (!writableStatuses.includes(a.status as string)) {
    return NextResponse.json({ error: 'Advance is not accepting items in current status' }, { status: 400 });
  }

  // Check ad-hoc item permission
  if (!body.catalog_item_id && a.allow_ad_hoc_items === false) {
    return NextResponse.json({ error: 'Ad-hoc items are not allowed on this advance' }, { status: 400 });
  }

  // M-12: Enforce tier limits on line items per advance
  const { count: itemCount } = await ctx.supabase
    .from('advance_line_items')
    .select('id', { count: 'exact', head: true })
    .eq('advance_id', id);

  // Get org tier from subscription
  const { data: orgData } = await ctx.supabase
    .from('organizations')
    .select('subscription_plan')
    .eq('id', a.organization_id)
    .single();

  const tier = ((orgData as Record<string, unknown>)?.subscription_plan as string) ?? 'access';
  const { TIER_LIMITS } = await import('@/lib/advances/constants');
  const limits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS] ?? TIER_LIMITS.access;

  if ((itemCount ?? 0) >= limits.lineItemsPerAdvance) {
    return NextResponse.json(
      { error: `Line item limit reached (${limits.lineItemsPerAdvance} per advance on ${tier} plan)` },
      { status: 403 },
    );
  }

  // Check submission deadline for collaborators
  if (a.organization_id !== ctx.organizationId && a.submission_deadline) {
    if (new Date() > new Date(a.submission_deadline as string)) {
      return NextResponse.json({ error: 'Submission deadline has passed' }, { status: 400 });
    }
  }

  // Calculate line total
  const unitPriceCents = body.unit_price_cents ?? null;
  const modifierTotal = (body.selected_modifiers ?? []).reduce(
    (sum: number, m: { price_adjustment_cents: number; quantity?: number }) =>
      sum + m.price_adjustment_cents * (m.quantity || 1),
    0,
  );
  const lineTotalCents = unitPriceCents !== null ? (unitPriceCents * (body.quantity ?? 1)) + modifierTotal : null;

  // Determine collaborator_id if cross-org
  let collaboratorId = null;
  if (a.organization_id !== ctx.organizationId) {
    const { data: collab } = await ctx.supabase
      .from('advance_collaborators')
      .select('id')
      .eq('advance_id', id)
      .eq('user_id', ctx.userId)
      .eq('invite_status', 'accepted')
      .single();
    collaboratorId = collab ? (collab as Record<string, unknown>).id : null;
  }

  const { data, error } = await ctx.supabase
    .from('advance_line_items')
    .insert({
      organization_id: a.organization_id as string,
      advance_id: id,
      submitted_by_user_id: ctx.userId,
      submitted_by_org_id: ctx.organizationId,
      collaborator_id: collaboratorId,
      catalog_item_id: body.catalog_item_id ?? null,
      catalog_variant_id: body.catalog_variant_id ?? null,
      item_name: body.item_name,
      item_code: body.item_code ?? null,
      variant_name: body.variant_name ?? null,
      variant_sku: body.variant_sku ?? null,
      item_description: body.item_description ?? null,
      specifications_snapshot: body.specifications_snapshot ?? {},
      quantity: body.quantity ?? 1,
      unit_of_measure: body.unit_of_measure ?? 'day',
      make_model: body.make_model ?? null,
      selected_modifiers: body.selected_modifiers ?? [],
      service_start_date: body.service_start_date ?? null,
      service_end_date: body.service_end_date ?? null,
      load_in_date: body.load_in_date ?? null,
      strike_date: body.strike_date ?? null,
      purpose: body.purpose ?? null,
      special_considerations: body.special_considerations ?? null,
      notes: body.notes ?? null,
      special_request: body.special_request ?? null,
      unit_price_cents: unitPriceCents,
      modifier_total_cents: modifierTotal,
      line_total_cents: lineTotalCents,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to add line item', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
