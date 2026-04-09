import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const perm = await checkPermission('clients', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const clientId = request.nextUrl.searchParams.get('client_id');
  const supabase = await createClient();

  let query = supabase
    .from('client_interactions')
    .select()
    .eq('organization_id', perm.organizationId)
    .order('occurred_at', { ascending: false })
    .limit(100);

  if (clientId) query = query.eq('client_id', clientId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Failed to fetch interactions', details: error.message }, { status: 500 });

  return NextResponse.json({ interactions: data ?? [] });
}

export async function POST(request: Request) {
  const perm = await checkPermission('clients', 'edit');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { client_id, type, subject, body: interactionBody, occurred_at } = body as {
    client_id?: string;
    type?: string;
    subject?: string;
    body?: string;
    occurred_at?: string;
  };

  if (!client_id) {
    return NextResponse.json(
      { error: 'client_id is required.' },
      { status: 400 },
    );
  }
  if (!type) {
    return NextResponse.json({ error: 'type is required.' }, { status: 400 });
  }
  if (!subject) {
    return NextResponse.json(
      { error: 'subject is required.' },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;

  const { data: interaction, error } = await supabase
    .from('client_interactions')
    .insert({
      client_id,
      organization_id: orgId,
      user_id: perm.userId,
      type,
      subject,
      body: interactionBody || null,
      occurred_at: occurred_at || new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !interaction) {
    return NextResponse.json(
      { error: 'Failed to log interaction.', details: error?.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, interaction });
}
