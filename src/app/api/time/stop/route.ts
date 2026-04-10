import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Find the active timer
  const { data: activeEntry } = await supabase
    .from('time_entries')
    .select('id, start_time')
    .eq('user_id', user.id)
    .is('end_time', null)
    .order('start_time', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!activeEntry) {
    return NextResponse.json({ error: 'No active timer found' }, { status: 404 });
  }

  const endTime = new Date();
  const startTime = new Date(activeEntry.start_time as string);
  const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

  const { data, error } = await supabase
    .from('time_entries')
    .update({
      end_time: endTime.toISOString(),
      duration_minutes: durationMinutes,
    })
    .eq('id', activeEntry.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to stop timer', details: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
