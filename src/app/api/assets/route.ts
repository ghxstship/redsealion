import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET(request: NextRequest) {
  const perm = await checkPermission('assets', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const proposalId = url.searchParams.get('proposal_id');
  const category = url.searchParams.get('category');

  let query = supabase
    .from('assets')
    .select('*')
    .eq('organization_id', perm.organizationId)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (proposalId) query = query.eq('proposal_id', proposalId);
  if (category) query = query.eq('category', category);

  const { data: assets, error } = await query;
  if (error) return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });

  return NextResponse.json({ assets: assets ?? [] });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('assets', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { name, type, category, proposal_id, trackable, reusable, barcode, serial_number, purchase_cost, current_location, notes } = body as Record<string, unknown>;

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const supabase = await createClient();

  const { data: asset, error } = await supabase
    .from('assets')
    .insert({
      organization_id: perm.organizationId,
      proposal_id: (proposal_id as string) ?? null,
      name: name as string,
      type: (type as string) ?? 'equipment',
      category: (category as string) ?? '',
      trackable: (trackable as boolean) ?? false,
      status: 'planned',
      condition: 'new',
      deployment_count: 0,
      reusable: (reusable as boolean) ?? false,
      barcode: (barcode as string) ?? null,
      serial_number: (serial_number as string) ?? null,
      purchase_cost: (purchase_cost as number) ?? null,
      current_location: (current_location as Record<string, unknown>) ?? null,
      notes: (notes as string) ?? null,
    })
    .select()
    .single();

  if (error || !asset) return NextResponse.json({ error: 'Failed to create asset', details: error?.message }, { status: 500 });

  return NextResponse.json({ success: true, asset }, { status: 201 });
}
