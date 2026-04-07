import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

/**
 * GET /api/assets/templates — List asset templates
 * POST /api/assets/templates — Create a new template
 */
export async function GET() {
  const perm = await checkPermission('assets', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();

  // Templates are stored as assets with status = 'template' (a convention, not a DB value)
  // Using a separate metadata table — but since the schema doesn't have one, we use JSON storage
  // in organization settings. For v1, we use a simple KV approach via the existing settings pattern.
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('id', perm.organizationId)
    .single();

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  // Fetch templates from dedicated storage
  const { data: templates } = await supabase
    .from('asset_templates')
    .select('*')
    .eq('organization_id', perm.organizationId)
    .order('name', { ascending: true });

  // Fallback if table doesn't exist yet — just return empty
  return NextResponse.json({ templates: templates ?? [] });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('assets', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const {
    name,
    type,
    category,
    default_depreciation_method,
    default_useful_life_months,
    default_fields,
  } = body as {
    name?: string;
    type?: string;
    category?: string;
    default_depreciation_method?: string;
    default_useful_life_months?: number;
    default_fields?: Record<string, unknown>;
  };

  if (!name) {
    return NextResponse.json({ error: 'name is required.' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: template, error } = await supabase
    .from('asset_templates')
    .insert({
      organization_id: perm.organizationId,
      name,
      type: type || 'equipment',
      category: category || 'Other',
      default_depreciation_method: default_depreciation_method || null,
      default_useful_life_months: default_useful_life_months || null,
      default_fields: default_fields || {},
      created_by: perm.userId,
    })
    .select()
    .single();

  if (error || !template) {
    // If asset_templates table doesn't exist yet, provide friendly error
    if (error?.message?.includes('relation') || error?.message?.includes('does not exist')) {
      return NextResponse.json({
        error: 'Asset templates table not yet migrated. Run the lifecycle enrichment migration first.',
        details: error?.message,
      }, { status: 501 });
    }
    return NextResponse.json({ error: 'Failed to create template.', details: error?.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, template }, { status: 201 });
}
