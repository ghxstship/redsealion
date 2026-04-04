import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET() {
  const perm = await checkPermission('equipment', 'view');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;

  const { data: bundles, error } = await supabase
    .from('equipment_bundles')
    .select()
    .eq('organization_id', orgId)
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch bundles.', details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ bundles });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('equipment', 'create');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { name, description, items } = body as {
    name?: string;
    description?: string;
    items?: Array<{ asset_id: string; quantity: number }>;
  };

  if (!name) {
    return NextResponse.json({ error: 'name is required.' }, { status: 400 });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: 'items array is required and must not be empty.' },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;

  const { data: bundle, error: insertError } = await supabase
    .from('equipment_bundles')
    .insert({
      organization_id: orgId,
      name,
      description: description || null,
      items,
    })
    .select()
    .single();

  if (insertError || !bundle) {
    return NextResponse.json(
      { error: 'Failed to create bundle.', details: insertError?.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, bundle });
}
