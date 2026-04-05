import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET() {
  const perm = await checkPermission('proposals', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('portfolio_library')
    .select()
    .eq('organization_id', perm.organizationId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('proposals', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { project_name, client_name, description, category, image_url, tags, project_year } = body as {
    project_name?: string;
    client_name?: string;
    description?: string;
    category?: string;
    image_url?: string;
    tags?: string[];
    project_year?: number;
  };

  if (!project_name || !category) {
    return NextResponse.json({ error: 'project_name and category are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('portfolio_library')
    .insert({
      organization_id: perm.organizationId,
      project_name,
      client_name: client_name || null,
      description: description || null,
      category,
      image_url: image_url || '',
      tags: tags || [],
      project_year: project_year || new Date().getFullYear(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
