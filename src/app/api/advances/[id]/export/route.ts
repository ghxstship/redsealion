import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

/**
 * GET /api/advances/[id]/export?format=csv|json — Export advance data
 *
 * Gap: H-04 — Tier limits include exportCsvPdf but no API existed
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const { id } = await params;

  const url = new URL(request.url);
  const format = url.searchParams.get('format') ?? 'csv';

  // Fetch advance and its line items
  const { data: advance } = await ctx.supabase
    .from('production_advances')
    .select('*')
    .eq('id', id)
    .single();

  if (!advance) {
    return NextResponse.json({ error: 'Advance not found' }, { status: 404 });
  }

  const a = advance as Record<string, unknown>;

  // Org ownership check
  if (a.organization_id !== ctx.organizationId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: items } = await ctx.supabase
    .from('advance_line_items')
    .select('*')
    .eq('advance_id', id)
    .order('sort_order', { ascending: true });

  const lineItems = (items ?? []) as Array<Record<string, unknown>>;

  if (format === 'json') {
    return NextResponse.json({ advance, lineItems });
  }

  // CSV export
  const csvHeaders = [
    'Line #', 'Item Name', 'Description', 'Variant', 'SKU',
    'Category', 'Quantity', 'Unit', 'Unit Price ($)', 'Total ($)',
    'Fulfillment Status', 'Approval Status',
    'Service Start', 'Service End', 'Notes',
    'Is Existing', 'Is Tentative',
  ].join(',');

  const csvRows = lineItems.map((item, idx) => [
    idx + 1,
    csvEscape(item.item_name as string ?? ''),
    csvEscape(item.item_description as string ?? ''),
    csvEscape(item.variant_name as string ?? ''),
    csvEscape(item.variant_sku as string ?? ''),
    csvEscape(item.category_group_slug as string ?? ''),
    item.quantity ?? '',
    item.unit_of_measure ?? '',
    item.unit_price_cents ? ((item.unit_price_cents as number) / 100).toFixed(2) : '',
    item.line_total_cents ? ((item.line_total_cents as number) / 100).toFixed(2) : '',
    item.fulfillment_status ?? '',
    item.approval_status ?? '',
    item.service_start_date ?? '',
    item.service_end_date ?? '',
    csvEscape(item.notes as string ?? ''),
    item.is_existing ? 'Yes' : 'No',
    item.is_tentative ? 'Yes' : 'No',
  ].join(','));

  const csv = [
    `# Advance: ${a.advance_number}`,
    `# Event: ${a.event_name ?? 'N/A'}`,
    `# Total: $${((a.total_cents as number ?? 0) / 100).toFixed(2)}`,
    `# Items: ${lineItems.length}`,
    '',
    csvHeaders,
    ...csvRows,
  ].join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${a.advance_number ?? 'advance'}_export.csv"`,
    },
  });
}

function csvEscape(val: string): string {
  if (!val) return '';
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}
