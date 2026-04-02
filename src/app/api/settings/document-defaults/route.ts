import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

const VALID_DOCUMENT_TYPES = ['proposal', 'invoice', 'contract', 'sow', 'crew_call_sheet'] as const;
const VALID_SECTIONS = [
  'terms_and_conditions', 'disclaimer', 'notes',
  'scope_header', 'scope_footer', 'payment_instructions',
] as const;

export async function GET() {
  const perm = await checkPermission('settings', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const orgId = perm.organizationId;

  const { data: defaults, error } = await supabase
    .from('document_defaults')
    .select('id, document_type, section, content, created_at, updated_at')
    .eq('organization_id', orgId)
    .order('document_type')
    .order('section');

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch document defaults.', details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ defaults });
}

export async function PUT(request: NextRequest) {
  const perm = await checkPermission('settings', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { document_type, section, content } = body as {
    document_type?: string;
    section?: string;
    content?: string;
  };

  if (!document_type || !section) {
    return NextResponse.json(
      { error: 'document_type and section are required.' },
      { status: 400 },
    );
  }

  if (!VALID_DOCUMENT_TYPES.includes(document_type as (typeof VALID_DOCUMENT_TYPES)[number])) {
    return NextResponse.json(
      { error: `Invalid document_type. Must be one of: ${VALID_DOCUMENT_TYPES.join(', ')}` },
      { status: 400 },
    );
  }

  if (!VALID_SECTIONS.includes(section as (typeof VALID_SECTIONS)[number])) {
    return NextResponse.json(
      { error: `Invalid section. Must be one of: ${VALID_SECTIONS.join(', ')}` },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;

  // Upsert: check if record exists
  const { data: existing } = await supabase
    .from('document_defaults')
    .select('id')
    .eq('organization_id', orgId)
    .eq('document_type', document_type)
    .eq('section', section)
    .single();

  if (existing) {
    const { data: updated, error } = await supabase
      .from('document_defaults')
      .update({ content: content ?? '', updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update document default.', details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, default: updated });
  }

  const { data: created, error } = await supabase
    .from('document_defaults')
    .insert({
      organization_id: orgId,
      document_type,
      section,
      content: content ?? '',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Failed to create document default.', details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, default: created });
}
