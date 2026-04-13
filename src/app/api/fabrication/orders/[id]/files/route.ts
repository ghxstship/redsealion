import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

interface RouteContext { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, context: RouteContext) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const perm = await checkPermission('warehouse', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const { file_url, file_type, version, is_approved } = body as Record<string, unknown>;

  if (!file_url) return NextResponse.json({ error: 'file_url is required' }, { status: 400 });

  const { data: file, error } = await supabase
    .from('fabrication_files')
    .insert({
      fabrication_order_id: id,
      file_url: file_url as string,
      file_type: (file_type as string) ?? 'document',
      version: (version as number) ?? 1,
      is_approved: (is_approved as boolean) ?? false,
    })
    .eq('organization_id', perm!.organizationId)
    .select()
    .single();

  if (error || !file) return NextResponse.json({ error: 'Failed to add file', details: error?.message }, { status: 500 });

  return NextResponse.json({ success: true, file }, { status: 201 });
}
