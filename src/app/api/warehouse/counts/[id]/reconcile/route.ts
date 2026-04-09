import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

interface RouteContext { params: Promise<{ id: string }> }

export async function POST(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('warehouse', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  // Fetch the count and its lines
  const { data: count, error: countError } = await supabase
    .from('inventory_counts')
    .select('*, inventory_count_lines(*)')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (countError || !count) return NextResponse.json({ error: 'Count not found' }, { status: 404 });
  if (count.status !== 'completed') return NextResponse.json({ error: 'Count must be completed before reconciliation' }, { status: 400 });

  const lines = (count.inventory_count_lines ?? []) as Array<{
    asset_id: string;
    counted_qty: number;
    expected_qty: number;
  }>;

  const reconciled: string[] = [];

  for (const line of lines) {
    if (line.counted_qty !== line.expected_qty) {
      // Update asset quantity
      const { error: updateError } = await supabase
        .from('assets')
        .update({ quantity: line.counted_qty })
        .eq('id', line.asset_id);

      if (!updateError) reconciled.push(line.asset_id);
    }
  }

  // Mark count as reconciled
  await supabase
    .from('inventory_counts')
    .update({ status: 'reconciled' })
    .eq('id', id);

  return NextResponse.json({ success: true, reconciled_count: reconciled.length });
}
