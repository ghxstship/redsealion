import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { randomUUID } from 'crypto';

// GAP-PTL-06: Helper to check project_portals permission with proposals fallback
async function checkPortalPermission(action: 'view' | 'create' | 'edit' | 'delete') {
  // Try project_portals first, fall back to proposals
  const perm = await checkPermission('project_portals', action)
    ?? await checkPermission('proposals', action);
  return perm;
}

export async function GET(request: NextRequest) {
  const perm = await checkPortalPermission('view');
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
  const perm = await checkPortalPermission('create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const {
    project_id, portal_type, is_published, description, call_time,
    route_in_instructions, parking_instructions, rideshare_instructions,
    transit_instructions, check_in_instructions, pre_arrival_checklist,
    additional_notes, radio_protocol, safety_rules, emergency_procedures,
    evacuation_info, accessibility, faqs, crew_intel, amenities, schedule,
    guest_policies, sustainability, external_links, artist_social_links,
  } = body as Record<string, unknown>;

  if (!project_id || !portal_type) {
    return NextResponse.json({ error: 'project_id and portal_type are required' }, { status: 400 });
  }

  const supabase = await createClient();

  // GAP-PTL-08: Generate access_token for portal sharing
  const accessToken = randomUUID();

  const { data: portal, error } = await supabase
    .from('project_portals')
    .insert({
      organization_id: perm.organizationId,
      project_id: project_id as string,
      portal_type: portal_type as string,
      is_published: (is_published as boolean) ?? false,
      description: (description as string) ?? null,
      call_time: (call_time as string) ?? null,
      route_in_instructions: (route_in_instructions as string) ?? null,
      parking_instructions: (parking_instructions as string) ?? null,
      rideshare_instructions: (rideshare_instructions as string) ?? null,
      transit_instructions: (transit_instructions as string) ?? null,
      check_in_instructions: (check_in_instructions as string) ?? null,
      pre_arrival_checklist: pre_arrival_checklist ?? [],
      additional_notes: additional_notes ?? [],
      radio_protocol: (radio_protocol as string) ?? null,
      safety_rules: safety_rules ?? [],
      emergency_procedures: emergency_procedures ?? [],
      evacuation_info: evacuation_info ?? null,
      accessibility: accessibility ?? [],
      faqs: faqs ?? [],
      crew_intel: crew_intel ?? [],
      amenities: amenities ?? [],
      schedule: schedule ?? [],
      guest_policies: guest_policies ?? null,
      sustainability: sustainability ?? [],
      external_links: external_links ?? [],
      artist_social_links: artist_social_links ?? [],
      access_token: accessToken,
      // GAP-PTL-07: Populate audit trail columns
      created_by: perm.userId ?? null,
      updated_by: perm.userId ?? null,
    })
    .select()
    .single();

  if (error || !portal) {
    return NextResponse.json({ error: 'Failed to create portal', details: error?.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, portal }, { status: 201 });
}
