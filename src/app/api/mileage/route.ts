import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET() {
  const perm = await checkPermission('expenses', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();

  const { data: mileage, error } = await supabase
    .from('mileage_entries')
    .select()
    .eq('organization_id', perm.organizationId)
    .is('deleted_at', null)
    .order('trip_date', { ascending: false });

  if (error) return NextResponse.json({ error: 'Failed to fetch mileage' }, { status: 500 });

  return NextResponse.json({ mileage: mileage ?? [] });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('expenses', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { origin, destination, distance_miles, trip_date, notes, proposal_id, is_billable } = body as {
    origin?: string;
    destination?: string;
    distance_miles?: number;
    trip_date?: string;
    notes?: string;
    proposal_id?: string;
    is_billable?: boolean;
  };

  if (!origin || !destination || distance_miles == null || distance_miles <= 0) {
    return NextResponse.json({ error: 'Origin, destination, and distance are required.' }, { status: 400 });
  }

  const supabase = await createClient();

  // Get current rate
  const { data: org } = await supabase
    .from('organizations')
    .select('mileage_rate')
    .eq('id', perm.organizationId)
    .single();

  const rate = (org?.mileage_rate as number) ?? 0.70;
  const amount = distance_miles * rate;

  const { data: mileage, error } = await supabase
    .from('mileage_entries')
    .insert({
      organization_id: perm.organizationId,
      user_id: perm.userId,
      origin,
      destination,
      distance_miles,
      rate_per_mile: rate,
      amount,
      notes: notes ?? null,
      trip_date: trip_date ?? new Date().toISOString().split('T')[0],
      proposal_id: proposal_id ?? null,
      is_billable: is_billable ?? false,
      status: 'pending',
    })
    .select()
    .single();

  if (error || !mileage) {
    return NextResponse.json({ error: 'Failed to create mileage entry', details: error?.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, mileage }, { status: 201 });
}
