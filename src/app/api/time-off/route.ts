import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET(request: NextRequest) {
  const perm = await checkPermission('tasks', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const { searchParams } = request.nextUrl;
  const status = searchParams.get('status');

  let query = supabase
    .from('time_off_requests')
    .select('*, user:users!time_off_requests_user_id_fkey(id, full_name), policy:time_off_policies!time_off_requests_policy_id_fkey(id, name, type)')
    .eq('organization_id', perm.organizationId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: 'Failed to fetch time-off requests.', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ requests: data ?? [] });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('tasks', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { policy_id, start_date, end_date, days_requested, reason } = body as {
    policy_id?: string;
    start_date?: string;
    end_date?: string;
    days_requested?: number;
    reason?: string;
  };

  if (!policy_id || !start_date || !end_date || !days_requested) {
    return NextResponse.json({ error: 'policy_id, start_date, end_date, and days_requested are required.' }, { status: 400 });
  }

  const supabase = await createClient();

  // Validate balance
  const { data: balance } = await supabase
    .from('time_off_balances')
    .select('entitled_days, used_days, carried_over')
    .eq('user_id', perm.userId)
    .eq('policy_id', policy_id)
    .eq('year', new Date().getFullYear())
    .single();

  if (balance) {
    const available = balance.entitled_days + balance.carried_over - balance.used_days;
    if (days_requested > available) {
      return NextResponse.json({ error: `Insufficient balance. Available: ${available} days.` }, { status: 400 });
    }
  }

  const { data, error: insertError } = await supabase
    .from('time_off_requests')
    .insert({
      user_id: perm.userId,
      organization_id: perm.organizationId,
      policy_id,
      start_date,
      end_date,
      days_requested,
      reason: reason || null,
      status: 'pending',
    })
    .select()
    .single();

  if (insertError || !data) {
    return NextResponse.json({ error: 'Failed to create time-off request.', details: insertError?.message }, { status: 500 });
  }

  return NextResponse.json({ request: data });
}
