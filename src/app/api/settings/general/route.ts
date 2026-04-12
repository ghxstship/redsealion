import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const perm = await checkPermission('settings', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const { data } = await supabase
    .from('organizations')
    .select('name, slug, settings')
    .eq('id', perm.organizationId)
    .single();

  return NextResponse.json({ organization: data ?? { name: '', slug: '', settings: {} } });
}

export async function PUT(request: NextRequest) {
  const perm = await checkPermission('settings', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { name, slug, settings } = body;

  const supabase = await createClient();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (name !== undefined) updateData.name = name;
  if (slug !== undefined) updateData.slug = slug;

  if (settings) {
    // Merge with existing settings
    const { data: existing } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', perm.organizationId)
      .single();

    const existingSettings = (existing?.settings as Record<string, unknown>) ?? {};
    updateData.settings = { ...existingSettings, ...settings };
  }

  const { data, error } = await supabase
    .from('organizations')
    .update(updateData)
    .eq('id', perm.organizationId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ organization: data });
}
