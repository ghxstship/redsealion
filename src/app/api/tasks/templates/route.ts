import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { requireFeature } from '@/lib/api/tier-guard';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';

/**
 * Task templates API — CRUD for reusable task lists.
 *
 * GET  /api/tasks/templates — list org templates
 * POST /api/tasks/templates — create template
 */

export async function GET() {
  const tierError = await requireFeature('tasks');
  if (tierError) return tierError;

  const perm = await checkPermission('tasks', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const ctx = await resolveCurrentOrg();
  if (!ctx) return NextResponse.json({ error: 'No org' }, { status: 401 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('task_templates')
    .select('*')
    .eq('organization_id', ctx.organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ templates: [] });
  }

  return NextResponse.json({ templates: data ?? [] });
}

export async function POST(request: NextRequest) {
  const tierError = await requireFeature('tasks');
  if (tierError) return tierError;

  const perm = await checkPermission('tasks', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const ctx = await resolveCurrentOrg();
  if (!ctx) return NextResponse.json({ error: 'No org' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { name, description, items } = body as {
    name?: string;
    description?: string | null;
    items?: Array<{ title: string; priority: string; estimated_hours: number | null }>;
  };

  if (!name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('task_templates')
    .insert({
      organization_id: ctx.organizationId,
      name: name.trim(),
      description: description ?? null,
      items: items ?? [],
      created_by: user?.id ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ template: data });
}
