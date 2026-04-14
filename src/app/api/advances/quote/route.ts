import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';
import { validateQuickQuoteList } from '@/lib/advances/validations';

export async function POST(request: NextRequest) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const body = await request.json();
  const { items, project_id, days = 1 } = body;

  const validation = validateQuickQuoteList(items);
  if (!validation.valid) {
    return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 });
  }

  // Fetch prices for all items in a single query
  const itemIds = items.map((i: any) => i.catalog_item_id);
  const { data: catalogItems, error } = await ctx.supabase
    .from('advance_catalog_items')
    .select('id, name, msrp_usd, rental_rate_daily, product_type')
    .in('id', itemIds);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch catalog pricing', details: error.message }, { status: 500 });
  }

  const lookup = new Map(catalogItems?.map(ci => [ci.id, ci]));

  let total_cents = 0;
  const quote_lines = items.map((reqItem: any) => {
    const ci = lookup.get(reqItem.catalog_item_id);
    if (!ci) {
      return { ...reqItem, status: 'not_found', line_total: 0 };
    }

    // Determine price (Rental rate defaults if available, else MSRP / 100)
    // Prices are stored in dollars for MSRP, but standard Advance System uses cents. We convert to standard rate
    const daily_rate = reqItem.override_rate_cents 
                      ? reqItem.override_rate_cents 
                      : (ci.rental_rate_daily ? ci.rental_rate_daily * 100 : (ci.msrp_usd || 0) * 100 * 0.05);
    
    // Apply quantity and days multiplier
    const line_total = daily_rate * reqItem.quantity * days;
    total_cents += line_total;

    return {
      catalog_item_id: ci.id,
      item_name: ci.name,
      quantity: reqItem.quantity,
      days_applied: days,
      daily_rate_cents: daily_rate,
      override_applied: !!reqItem.override_rate_cents,
      line_total_cents: line_total
    };
  });

  return NextResponse.json({
    data: {
      project_id,
      days,
      lines: quote_lines,
      total_cents
    }
  });
}
