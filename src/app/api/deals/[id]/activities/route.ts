import { NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('pipeline', 'edit');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { type, description } = body as {
    type?: string;
    description?: string;
  };

  if (!type) {
    return NextResponse.json({ error: 'type is required.' }, { status: 400 });
  }
  if (!description) {
    return NextResponse.json(
      { error: 'description is required.' },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;

  // Verify the deal exists and belongs to this org
  const { data: deal } = await supabase
    .from('deals')
    .select('id')
    .eq('id', id)
    .eq('organization_id', orgId)
    .single();

  if (!deal) {
    return NextResponse.json({ error: 'Deal not found.' }, { status: 404 });
  }

  const { data: activity, error } = await supabase
    .from('deal_activities')
    .insert({
      deal_id: id,
      organization_id: orgId,
      actor_id: perm.userId,
      type,
      description,
    })
    .select()
    .single();

  if (error || !activity) {
    return NextResponse.json(
      { error: 'Failed to log activity.', details: error?.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, activity });
}
