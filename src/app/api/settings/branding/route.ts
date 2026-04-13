import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const perm = await checkPermission('settings', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { brand_config } = body;

  if (!brand_config) {
    return NextResponse.json({ error: 'brand_config is required' }, { status: 400 });
  }

  // Merge with existing brand_config
  const { data: existing } = await supabase
    .from('organizations')
    .select('brand_config')
    .eq('id', perm.organizationId)
    .single();

  const merged = {
    ...((existing?.brand_config as Record<string, unknown>) ?? {}),
    ...brand_config,
  };

  const { data, error } = await supabase
    .from('organizations')
    .update({ brand_config: merged, updated_at: new Date().toISOString() })
    .eq('id', perm.organizationId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ organization: data });
}
