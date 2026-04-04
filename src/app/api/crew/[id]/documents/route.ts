import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('crew', 'view');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = await createClient();
  const orgId = perm.organizationId;

  const { data: documents, error } = await supabase
    .from('onboarding_documents')
    .select()
    .eq('user_id', id)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch documents.', details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ documents: documents ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('crew', 'edit');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { type, name, file_url } = body as {
    type?: string;
    name?: string;
    file_url?: string;
  };

  if (!type) {
    return NextResponse.json(
      { error: 'type is required.' },
      { status: 400 },
    );
  }

  if (!name) {
    return NextResponse.json(
      { error: 'name is required.' },
      { status: 400 },
    );
  }

  if (!file_url) {
    return NextResponse.json(
      { error: 'file_url is required.' },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;

  const { data: document, error } = await supabase
    .from('onboarding_documents')
    .insert({
      organization_id: orgId,
      user_id: id,
      type,
      name,
      file_url,
      status: 'uploaded',
    })
    .select()
    .single();

  if (error || !document) {
    return NextResponse.json(
      { error: 'Failed to create document.', details: error?.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, document });
}
