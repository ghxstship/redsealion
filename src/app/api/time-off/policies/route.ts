import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

/** GET /api/time-off/policies — List all time-off policies for the org */
export async function GET() {
  const perm = await checkPermission('team', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('time_off_policies')
    .select('*')
    .eq('organization_id', perm.organizationId)
    .order('name');

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch policies', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ policies: data ?? [] });
}

/** POST /api/time-off/policies — Create a new time-off policy */
export async function POST(request: NextRequest) {
  const perm = await checkPermission('team', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { name, type, days_per_year, carry_over_max, requires_approval } = body as {
    name?: string;
    type?: string;
    days_per_year?: number;
    carry_over_max?: number;
    requires_approval?: boolean;
  };

  if (!name || !type) {
    return NextResponse.json({ error: 'name and type are required' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('time_off_policies')
    .insert({
      organization_id: perm.organizationId,
      name,
      type,
      days_per_year: days_per_year ?? 0,
      carry_over_max: carry_over_max ?? 0,
      requires_approval: requires_approval ?? true,
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to create policy', details: error?.message }, { status: 500 });
  }

  return NextResponse.json({ policy: data }, { status: 201 });
}
