import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';
import type { CrewAvailabilityStatus } from '@/types/database';

export async function GET(
  request: NextRequest,
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
  const url = new URL(request.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  const supabase = await createClient();
  const orgId = perm.organizationId;

  let query = supabase
    .from('crew_availability')
    .select()
    .eq('crew_profile_id', id)
    .eq('organization_id', orgId)
    .order('date', { ascending: true });

  if (from) {
    query = query.gte('date', from);
  }
  if (to) {
    query = query.lte('date', to);
  }

  const { data: availability, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch availability.', details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ availability: availability ?? [] });
}

export async function PUT(
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
  const { entries } = body as {
    entries?: Array<{
      date: string;
      status: CrewAvailabilityStatus;
      note?: string;
    }>;
  };

  if (!entries || entries.length === 0) {
    return NextResponse.json(
      { error: 'entries array is required and must not be empty.' },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;

  // Delete existing entries for the specified dates
  const dates = entries.map((e) => e.date);

  const { error: deleteError } = await supabase
    .from('crew_availability')
    .delete()
    .eq('crew_profile_id', id)
    .eq('organization_id', orgId)
    .in('date', dates);

  if (deleteError) {
    return NextResponse.json(
      { error: 'Failed to clear existing availability.', details: deleteError.message },
      { status: 500 },
    );
  }

  // Insert new entries
  const rows = entries.map((e) => ({
    crew_profile_id: id,
    organization_id: orgId,
    date: e.date,
    status: e.status,
    note: e.note ?? null,
  }));

  const { data: availability, error: insertError } = await supabase
    .from('crew_availability')
    .insert(rows)
    .select();

  if (insertError) {
    return NextResponse.json(
      { error: 'Failed to set availability.', details: insertError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, availability: availability ?? [] });
}
