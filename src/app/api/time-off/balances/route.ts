import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

/** GET /api/time-off/balances — List balances for current user or all (admin) */
export async function GET(request: NextRequest) {
  const perm = await checkPermission('team', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const { searchParams } = request.nextUrl;
  const userId = searchParams.get('user_id');
  const year = searchParams.get('year') ?? new Date().getFullYear().toString();

  let query = supabase
    .from('time_off_balances')
    .select('*, policy:time_off_policies!time_off_balances_policy_id_fkey(id, name, type)')
    .eq('organization_id', perm.organizationId)
    .eq('year', parseInt(year, 10));

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch balances', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ balances: data ?? [] });
}

/** POST /api/time-off/balances — Initialize/create a balance record */
export async function POST(request: NextRequest) {
  const perm = await checkPermission('team', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { user_id, policy_id, year, entitled_days, carried_over } = body as {
    user_id?: string;
    policy_id?: string;
    year?: number;
    entitled_days?: number;
    carried_over?: number;
  };

  if (!user_id || !policy_id) {
    return NextResponse.json({ error: 'user_id and policy_id are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const balanceYear = year ?? new Date().getFullYear();

  const { data, error } = await supabase
    .from('time_off_balances')
    .upsert(
      {
        user_id,
        organization_id: perm.organizationId,
        policy_id,
        year: balanceYear,
        entitled_days: entitled_days ?? 0,
        carried_over: carried_over ?? 0,
        used_days: 0,
      },
      { onConflict: 'user_id,policy_id,year' }
    )
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to create balance', details: error?.message }, { status: 500 });
  }

  return NextResponse.json({ balance: data }, { status: 201 });
}
