import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET(request: NextRequest) {
  const perm = await checkPermission('proposals', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();

  const projectId = request.nextUrl.searchParams.get('project_id');
  const portalType = request.nextUrl.searchParams.get('portal_type');

  let query = supabase
    .from('project_portals')
    .select('*, projects(name, slug)')
    .eq('organization_id', perm.organizationId)
    .order('created_at', { ascending: false });

  if (projectId) {
    query = query.eq('project_id', projectId);
  }
  if (portalType) {
    query = query.eq('portal_type', portalType);
  }

  const { data: portals, error } = await query;

  if (error) return NextResponse.json({ error: 'Failed to fetch portals' }, { status: 500 });

  return NextResponse.json({ portals: portals ?? [] });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('proposals', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const {
    project_id, portal_type, is_published, call_time,
    parking_instructions, rideshare_instructions, transit_instructions,
    check_in_instructions, pre_arrival_checklist, faqs, amenities,
  } = body as {
    project_id?: string;
    portal_type?: string;
    is_published?: boolean;
    call_time?: string;
    parking_instructions?: string;
    rideshare_instructions?: string;
    transit_instructions?: string;
    check_in_instructions?: string;
    pre_arrival_checklist?: unknown[];
    faqs?: unknown[];
    amenities?: Record<string, boolean>;
  };

  if (!project_id || !portal_type) {
    return NextResponse.json({ error: 'project_id and portal_type are required' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: portal, error } = await supabase
    .from('project_portals')
    .insert({
      organization_id: perm.organizationId,
      project_id,
      portal_type,
      is_published: is_published ?? false,
      call_time: call_time ?? null,
      parking_instructions: parking_instructions ?? null,
      rideshare_instructions: rideshare_instructions ?? null,
      transit_instructions: transit_instructions ?? null,
      check_in_instructions: check_in_instructions ?? null,
      pre_arrival_checklist: pre_arrival_checklist ?? [],
      faqs: faqs ?? [],
      amenities: amenities ?? {},
    })
    .select()
    .single();

  if (error || !portal) {
    return NextResponse.json({ error: 'Failed to create portal', details: error?.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, portal }, { status: 201 });
}
