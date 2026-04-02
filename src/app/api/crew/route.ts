import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';
import type { CrewProfile, User } from '@/types/database';

export async function GET(request: NextRequest) {
  const perm = await checkPermission('crew', 'view');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const skills = url.searchParams.get('skills');
  const status = url.searchParams.get('status');

  const supabase = await createClient();
  const orgId = perm.organizationId;

  let query = supabase
    .from('crew_profiles')
    .select('*, user:users(*)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (skills) {
    query = query.contains('skills', [skills]);
  }
  if (status) {
    query = query.eq('status', status);
  }

  const { data: profiles, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch crew profiles.', details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ profiles: profiles ?? [] });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('crew', 'create');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const {
    user_id,
    skills,
    certifications,
    hourly_rate,
    day_rate,
    ot_rate,
    per_diem_rate,
    travel_rate,
    availability_default,
    emergency_contact_name,
    emergency_contact_phone,
    notes,
  } = body as {
    user_id?: string;
    skills?: string[];
    certifications?: string[];
    hourly_rate?: number;
    day_rate?: number;
    ot_rate?: number;
    per_diem_rate?: number;
    travel_rate?: number;
    availability_default?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    notes?: string;
  };

  if (!user_id) {
    return NextResponse.json(
      { error: 'user_id is required.' },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;

  const { data: profile, error } = await supabase
    .from('crew_profiles')
    .insert({
      organization_id: orgId,
      user_id,
      skills: skills ?? [],
      certifications: certifications ?? [],
      hourly_rate: hourly_rate ?? null,
      day_rate: day_rate ?? null,
      ot_rate: ot_rate ?? null,
      per_diem_rate: per_diem_rate ?? null,
      travel_rate: travel_rate ?? null,
      availability_default: availability_default ?? 'available',
      emergency_contact_name: emergency_contact_name ?? null,
      emergency_contact_phone: emergency_contact_phone ?? null,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (error || !profile) {
    return NextResponse.json(
      { error: 'Failed to create crew profile.', details: error?.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, profile });
}
