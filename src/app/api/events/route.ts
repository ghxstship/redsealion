import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET(request: NextRequest) {
  const perm = await checkPermission('events', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const type = url.searchParams.get('type');

  let query = supabase
    .from('events')
    .select('*, event_locations(location_id, is_primary, locations(id, name, type))')
    .eq('organization_id', perm.organizationId)
    .is('deleted_at', null)
    .order('starts_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (type) query = query.eq('type', type);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Failed to fetch events', details: error.message }, { status: 500 });

  return NextResponse.json({ events: data ?? [] });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('events', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { name, slug, subtitle, type, status, starts_at, ends_at, daily_hours, doors_time, general_email, presenter, event_code, notes } = body as Record<string, unknown>;

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const supabase = await createClient();

  const eventSlug = (slug as string) || (name as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const { data: event, error } = await supabase
    .from('events')
    .insert({
      organization_id: perm.organizationId,
      name: name as string,
      slug: eventSlug,
      subtitle: (subtitle as string) ?? null,
      type: (type as string) ?? 'production',
      status: (status as string) ?? 'draft',
      starts_at: (starts_at as string) ?? null,
      ends_at: (ends_at as string) ?? null,
      daily_hours: (daily_hours as string) ?? null,
      doors_time: (doors_time as string) ?? null,
      general_email: (general_email as string) ?? null,
      presenter: (presenter as string) ?? null,
      event_code: (event_code as string) ?? null,
      notes: (notes as string) ?? null,
    })
    .select()
    .single();

  if (error || !event) return NextResponse.json({ error: 'Failed to create event', details: error?.message }, { status: 500 });

  return NextResponse.json({ success: true, event }, { status: 201 });
}
