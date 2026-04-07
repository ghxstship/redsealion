import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';

const DEFAULTS = {
  theme: 'system' as const,
  sidebar_collapsed: false,
  default_calendar_view: 'month' as const,
  density: 'comfortable',
};

export async function GET() {
  const perm = await checkPermission('settings', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const { data } = await supabase
    .from('user_preferences')
    .select('theme, sidebar_collapsed, default_calendar_view, density')
    .eq('user_id', perm.userId)
    .eq('organization_id', perm.organizationId)
    .maybeSingle();

  return NextResponse.json(data ?? DEFAULTS);
}

export async function PUT(request: NextRequest) {
  const perm = await checkPermission('settings', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { theme, sidebar_collapsed, default_calendar_view, density } = body;

  const supabase = await createClient();

  const upsertData: Record<string, unknown> = {
    user_id: perm.userId,
    organization_id: perm.organizationId,
    updated_at: new Date().toISOString(),
  };

  if (theme !== undefined) upsertData.theme = theme;
  if (sidebar_collapsed !== undefined) upsertData.sidebar_collapsed = sidebar_collapsed;
  if (default_calendar_view !== undefined) upsertData.default_calendar_view = default_calendar_view;
  if (density !== undefined) upsertData.density = density;

  const { data, error } = await supabase
    .from('user_preferences')
    .upsert(upsertData, { onConflict: 'user_id,organization_id' })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
