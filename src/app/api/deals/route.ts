import { NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';
import { dispatchWebhookEvent } from '@/lib/webhooks/outbound';

export async function GET() {
  const perm = await checkPermission('pipeline', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('deals')
    .select('*, clients(id, name)')
    .eq('organization_id', perm.organizationId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Failed to fetch deals', details: error.message }, { status: 500 });

  return NextResponse.json({ deals: data ?? [] });
}

export async function POST(request: Request) {
  const perm = await checkPermission('pipeline', 'create');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const {
    name,
    client_id,
    pipeline_id,
    value,
    probability,
    expected_close_date,
    stage,
    owner_id,
  } = body as {
    name?: string;
    client_id?: string;
    pipeline_id?: string;
    value?: number;
    probability?: number;
    expected_close_date?: string;
    stage?: string;
    owner_id?: string;
  };

  if (!name) {
    return NextResponse.json({ error: 'name is required.' }, { status: 400 });
  }

  if (!client_id) {
    return NextResponse.json(
      { error: 'client_id is required.' },
      { status: 400 },
    );
  }

  if (value == null || value < 0) {
    return NextResponse.json(
      { error: 'value is required and must be >= 0.' },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;

  const { data: deal, error: insertError } = await supabase
    .from('deals')
    .insert({
      organization_id: orgId,
      title: name,
      client_id,
      pipeline_id: pipeline_id || null,
      value,
      probability: probability ?? 50,
      expected_close_date: expected_close_date || null,
      stage: stage || 'lead',
      owner_id: owner_id || perm.userId,
    })
    .select()
    .single();

  if (insertError || !deal) {
    return NextResponse.json(
      { error: 'Failed to create deal.', details: insertError?.message },
      { status: 500 },
    );
  }

  // Log deal creation activity
  await supabase.from('deal_activities').insert({
    deal_id: deal.id,
    organization_id: orgId,
    actor_id: perm.userId,
    type: 'created',
    description: 'Deal created',
  });

  // Dispatch webhook event
  dispatchWebhookEvent(orgId, 'deal.created', { deal }).catch(() => {});

  return NextResponse.json({ success: true, deal });
}
