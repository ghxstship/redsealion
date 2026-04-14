import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

/**
 * GET  /api/advances/[id]/vendor-quotes — List quotes for an advance
 * POST /api/advances/[id]/vendor-quotes — Add a vendor quote
 *
 * Gap: T-06 — Vendor quotes table was in the migration but no API existed
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const { id: _id } = await params;

  const url = new URL(request.url);
  const lineItemId = url.searchParams.get('line_item_id');

  let query = ctx.supabase
    .from('advance_vendor_quotes')
    .select('*, advance_line_items(item_name)')
    .eq('organization_id', ctx.organizationId);

  // Filter by line items belonging to this advance
  if (lineItemId) {
    query = query.eq('line_item_id', lineItemId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch quotes', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const { id } = await params;
  const body = await request.json();
  const b = body as Record<string, unknown>;

  if (!b.line_item_id || !b.vendor_name) {
    return NextResponse.json({ error: 'line_item_id and vendor_name are required' }, { status: 422 });
  }

  // Verify line item belongs to this advance
  const { data: item } = await ctx.supabase
    .from('advance_line_items')
    .select('id')
    .eq('id', b.line_item_id)
    .eq('advance_id', id)
    .single();

  if (!item) {
    return NextResponse.json({ error: 'Line item not found on this advance' }, { status: 404 });
  }

  const { data, error } = await ctx.supabase
    .from('advance_vendor_quotes')
    .insert({
      organization_id: ctx.organizationId,
      line_item_id: b.line_item_id,
      vendor_name: b.vendor_name,
      vendor_contact_email: b.vendor_contact_email ?? null,
      vendor_contact_phone: b.vendor_contact_phone ?? null,
      quote_number: b.quote_number ?? null,
      quoted_unit_price_cents: b.quoted_unit_price_cents ?? null,
      quoted_total_cents: b.quoted_total_cents ?? null,
      quote_valid_until: b.quote_valid_until ?? null,
      quote_document_url: b.quote_document_url ?? null,
      status: b.status ?? 'received',
      notes: b.notes ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create quote', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
