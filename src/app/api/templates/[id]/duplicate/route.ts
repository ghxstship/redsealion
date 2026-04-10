import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

interface RouteContext { params: Promise<{ id: string }> }

/**
 * POST /api/templates/[id]/duplicate — clone a phase template.
 *
 * Creates a copy of the template with " (Copy)" appended to the name.
 * The duplicated template is never marked as default.
 */
export async function POST(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('proposals', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  // Fetch the original template
  const { data: original, error: fetchError } = await supabase
    .from('phase_templates')
    .select('name, description, phases')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (fetchError || !original) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  // Create the duplicate
  const { data, error } = await supabase
    .from('phase_templates')
    .insert({
      organization_id: perm.organizationId,
      name: `${original.name} (Copy)`,
      description: original.description,
      phases: original.phases,
      is_default: false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to duplicate', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
