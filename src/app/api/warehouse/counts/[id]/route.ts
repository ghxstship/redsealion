import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

/**
 * GET /api/warehouse/counts/[id] — Get count with lines
 * PATCH /api/warehouse/counts/[id] — Update count status or lines
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('warehouse', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  const { data: count } = await supabase
    .from('inventory_counts')
    .select('*')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (!count) return NextResponse.json({ error: 'Count not found.' }, { status: 404 });

  const { data: lines } = await supabase
    .from('inventory_count_lines')
    .select('*, asset:assets(id, name, barcode, serial_number, category)')
    .eq('count_id', id);

  return NextResponse.json({ count, lines: lines ?? [] });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('warehouse', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const {
    status,
    lines,
  } = body as {
    status?: string;
    lines?: Array<{ id: string; counted_quantity: number; condition_observed?: string; notes?: string }>;
  };

  const supabase = await createClient();

  // Update count status
  if (status) {
    const updates: Record<string, unknown> = { status };
    if (status === 'in_progress' && !body.started_at) {
      updates.started_at = new Date().toISOString();
    }
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    await supabase
      .from('inventory_counts')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', perm.organizationId);
  }

  // Update individual count lines
  if (lines && lines.length > 0) {
    for (const line of lines) {
      await supabase
        .from('inventory_count_lines')
        .update({
          counted_quantity: line.counted_quantity,
          condition_observed: line.condition_observed || null,
          notes: line.notes || null,
        })
        .eq('id', line.id);
    }
  }

  // Re-fetch
  const { data: count } = await supabase
    .from('inventory_counts')
    .select('*')
    .eq('id', id)
    .single();

  return NextResponse.json({ success: true, count });
}
