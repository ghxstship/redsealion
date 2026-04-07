import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET(request: NextRequest) {
  const perm = await checkPermission('activations', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const type = url.searchParams.get('type');
  const event_id = url.searchParams.get('event_id');
  const location_id = url.searchParams.get('location_id');

  let query = supabase
    .from('activations')
    .select('*, events(id, name, slug), locations(id, name, type)')
    .eq('organization_id', perm.organizationId)
    .order('starts_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (type) query = query.eq('type', type);
  if (event_id) query = query.eq('event_id', event_id);
  if (location_id) query = query.eq('location_id', location_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Failed to fetch activations', details: error.message }, { status: 500 });

  return NextResponse.json({ activations: data ?? [] });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('activations', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { name, type, event_id, location_id, status, starts_at, ends_at, load_in, strike, notes } = body as Record<string, unknown>;

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
  if (!event_id) return NextResponse.json({ error: 'event_id is required' }, { status: 400 });
  if (!location_id) return NextResponse.json({ error: 'location_id is required' }, { status: 400 });

  const supabase = await createClient();

  const { data: activation, error } = await supabase
    .from('activations')
    .insert({
      organization_id: perm.organizationId,
      name: name as string,
      type: (type as string) ?? 'general',
      event_id: event_id as string,
      location_id: location_id as string,
      status: (status as string) ?? 'draft',
      starts_at: (starts_at as string) ?? null,
      ends_at: (ends_at as string) ?? null,
      load_in: (load_in as Record<string, unknown>) ?? null,
      strike: (strike as Record<string, unknown>) ?? null,
      notes: (notes as string) ?? null,
    })
    .select()
    .single();

  if (error || !activation) return NextResponse.json({ error: 'Failed to create activation', details: error?.message }, { status: 500 });

  return NextResponse.json({ success: true, activation }, { status: 201 });
}
