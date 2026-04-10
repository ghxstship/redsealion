import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

/** GET /api/holidays — List holiday calendar entries for the org */
export async function GET(request: NextRequest) {
  const perm = await checkPermission('team', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const { searchParams } = request.nextUrl;
  const year = searchParams.get('year');

  let query = supabase
    .from('holiday_calendars')
    .select('*')
    .eq('organization_id', perm.organizationId)
    .order('date', { ascending: true });

  if (year) {
    query = query
      .gte('date', `${year}-01-01`)
      .lte('date', `${year}-12-31`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch holidays', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ holidays: data ?? [] });
}

/** POST /api/holidays — Create a holiday entry */
export async function POST(request: NextRequest) {
  const perm = await checkPermission('team', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { name, date, recurring } = body as {
    name?: string;
    date?: string;
    recurring?: boolean;
  };

  if (!name || !date) {
    return NextResponse.json({ error: 'name and date are required' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('holiday_calendars')
    .insert({
      organization_id: perm.organizationId,
      name,
      date,
      recurring: recurring ?? false,
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to create holiday', details: error?.message }, { status: 500 });
  }

  return NextResponse.json({ holiday: data }, { status: 201 });
}
