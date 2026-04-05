import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET() {
  const perm = await checkPermission('leads', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('lead_forms')
    .select()
    .eq('organization_id', perm.organizationId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('leads', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { name, fields, redirect_url, is_active } = body as {
    name?: string;
    fields?: Record<string, unknown>[];
    redirect_url?: string;
    is_active?: boolean;
  };

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('lead_forms')
    .insert({
      organization_id: perm.organizationId,
      name,
      fields: fields || [],
      redirect_url: redirect_url || null,
      is_active: is_active ?? true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
