import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const perm = await checkPermission('email_campaigns', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('campaigns')
    .select()
    .eq('organization_id', perm.organizationId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Failed to fetch campaigns.', details: error.message }, { status: 500 });
  return NextResponse.json({ campaigns: data ?? [] });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('email_campaigns', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { name, subject, body_html, body_text, target_tags, target_all_clients, scheduled_at } = body;

  if (!name || !subject) return NextResponse.json({ error: 'name and subject are required.' }, { status: 400 });

  const supabase = await createClient();

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .insert({
      organization_id: perm.organizationId,
      name,
      subject,
      body_html: body_html || null,
      body_text: body_text || null,
      target_tags: target_tags || [],
      target_all_clients: target_all_clients ?? false,
      scheduled_at: scheduled_at || null,
      status: scheduled_at ? 'scheduled' : 'draft',
      created_by: perm.userId,
    })
    .select()
    .single();

  if (error || !campaign) return NextResponse.json({ error: 'Failed to create campaign.', details: error?.message }, { status: 500 });

  return NextResponse.json({ success: true, campaign });
}
