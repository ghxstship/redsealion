import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await resolveCurrentOrg();
  if (!ctx) return NextResponse.json({ error: 'Org not found' }, { status: 403 });

  // Stop any existing running timers first
  await supabase
    .from('time_entries')
    .update({ end_time: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('end_time', null);

  const body = await request.json().catch(() => ({}));
  const { proposal_id, task_id, description, billable } = body as {
    proposal_id?: string;
    task_id?: string;
    description?: string;
    billable?: boolean;
  };

  const { data, error } = await supabase
    .from('time_entries')
    .insert({
      organization_id: ctx.organizationId,
      user_id: user.id,
      proposal_id: proposal_id ?? null,
      task_id: task_id ?? null,
      description: description ?? null,
      start_time: new Date().toISOString(),
      end_time: null,
      duration_minutes: null,
      billable: billable ?? false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to start timer', details: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
