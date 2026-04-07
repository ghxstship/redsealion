import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

/**
 * GET /api/warehouse/counts — List inventory counts
 * POST /api/warehouse/counts — Create a new count
 */
export async function GET() {
  const perm = await checkPermission('warehouse', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();

  const { data: counts, error } = await supabase
    .from('inventory_counts')
    .select('*, inventory_count_lines(count)')
    .eq('organization_id', perm.organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch counts.', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ counts: counts ?? [] });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('warehouse', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const {
    count_type,
    location,
    notes,
  } = body as {
    count_type?: string;
    location?: string;
    notes?: string;
  };

  if (!count_type) {
    return NextResponse.json({ error: 'count_type is required (full, cycle, spot).' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: count, error: insertError } = await supabase
    .from('inventory_counts')
    .insert({
      organization_id: perm.organizationId,
      count_type,
      status: 'planned',
      location: location || null,
      notes: notes || null,
      counted_by: perm.userId,
    })
    .select()
    .single();

  if (insertError || !count) {
    return NextResponse.json({ error: 'Failed to create count.', details: insertError?.message }, { status: 500 });
  }

  // If starting immediately, pre-populate count lines with assets at that location
  if (location) {
    const { data: assets } = await supabase
      .from('assets')
      .select('id')
      .eq('organization_id', perm.organizationId)
      .not('status', 'in', '("disposed")');

    if (assets && assets.length > 0) {
      const lines = assets.map((a) => ({
        count_id: count.id,
        asset_id: a.id,
        expected_quantity: 1,
      }));

      await supabase.from('inventory_count_lines').insert(lines);
    }
  }

  return NextResponse.json({ success: true, count }, { status: 201 });
}
