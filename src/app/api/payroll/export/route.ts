import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';
import { generatePayrollCSV } from '@/lib/payroll/export';

export async function GET(request: NextRequest) {
  const perm = await checkPermission('crew', 'view');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  if (!from || !to) {
    return NextResponse.json(
      { error: 'from and to query parameters are required (YYYY-MM-DD).' },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;

  // Fetch time entries for the period with user info
  const { data: timeEntries, error: timeError } = await supabase
    .from('time_entries')
    .select('*, user:users(name, email), proposal:proposals(name)')
    .eq('organization_id', orgId)
    .gte('start_time', `${from}T00:00:00`)
    .lte('start_time', `${to}T23:59:59`);

  if (timeError) {
    return NextResponse.json(
      { error: 'Failed to fetch time entries.', details: timeError.message },
      { status: 500 },
    );
  }

  // Fetch crew profiles with rates
  const { data: crewProfiles } = await supabase
    .from('crew_profiles')
    .select('user_id, hourly_rate, day_rate')
    .eq('organization_id', orgId);

  const rateMap = new Map<string, { hourly_rate: number; day_rate: number }>();
  for (const cp of crewProfiles ?? []) {
    rateMap.set(cp.user_id as string, {
      hourly_rate: (cp.hourly_rate as number) ?? 0,
      day_rate: (cp.day_rate as number) ?? 0,
    });
  }

  const entries = (timeEntries ?? []).map((te) => {
    const user = te.user as unknown as { name: string; email: string } | null;
    const proposal = te.proposal as unknown as { name: string } | null;
    const rates = rateMap.get(te.user_id as string);
    const hours = (te.duration_minutes as number | null)
      ? (te.duration_minutes as number) / 60
      : 0;
    const rate = rates?.hourly_rate ?? 0;

    return {
      userName: user?.name ?? 'Unknown',
      email: user?.email ?? '',
      hours: Math.round(hours * 100) / 100,
      rate,
      rateType: 'hourly',
      total: Math.round(hours * rate * 100) / 100,
      projectName: proposal?.name ?? undefined,
    };
  });

  const csv = generatePayrollCSV({
    orgId,
    periodStart: from,
    periodEnd: to,
    entries,
  });

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="payroll-${from}-to-${to}.csv"`,
    },
  });
}
