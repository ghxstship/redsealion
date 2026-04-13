import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireFeature } from '@/lib/api/tier-guard';
import { requirePermission } from '@/lib/api/permission-guard';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';

export async function GET(request: NextRequest) {
  const tierError = await requireFeature('integrations');
  if (tierError) return tierError;

  const permError = await requirePermission('integrations', 'view');
  if (permError) return permError;

  const supabase = await createClient();
  const ctx = await resolveCurrentOrg();

  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: endpoints } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    return NextResponse.json(endpoints || []);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch webhook endpoints' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const tierError = await requireFeature('integrations');
  if (tierError) return tierError;

  const permError = await requirePermission('integrations', 'edit');
  if (permError) return permError;

  const supabase = await createClient();
  const ctx = await resolveCurrentOrg();

  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { url, name, description, events, secret } = body;

    if (!url || !secret) {
      return NextResponse.json(
        { error: 'URL and secret are required' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('webhook_endpoints')
      .insert({
        organization_id: ctx.organizationId,
        url,
        name: name || null,
        description: description || null,
        events: events || [],
        secret,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create webhook endpoint' },
      { status: 500 },
    );
  }
}
