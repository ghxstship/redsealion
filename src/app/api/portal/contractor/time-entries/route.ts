import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/portal/contractor/time-entries?crew_profile_id=...
 * POST /api/portal/contractor/time-entries
 *
 * Time entry management for contractor portal users.
 */

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const crewProfileId = searchParams.get('crew_profile_id');
    if (!crewProfileId) {
      return NextResponse.json({ error: 'crew_profile_id required' }, { status: 400 });
    }

    // Verify the profile belongs to this user
    const { data: profile } = await supabase
      .from('crew_profiles')
      .select('id, user_id, organization_id')
      .eq('id', crewProfileId)
      .single();

    if (!profile || profile.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: entries, error } = await supabase
      .from('time_entries')
      .select('id, date, hours, description, status')
      .eq('user_id', user.id)
      .eq('organization_id', profile.organization_id)
      .order('date', { ascending: false })
      .limit(100);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ entries: entries ?? [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { crew_profile_id, date, hours, description } = body;

    if (!crew_profile_id || !date || !hours) {
      return NextResponse.json({ error: 'crew_profile_id, date, and hours are required' }, { status: 400 });
    }

    // Verify the profile belongs to this user
    const { data: profile } = await supabase
      .from('crew_profiles')
      .select('id, user_id, organization_id')
      .eq('id', crew_profile_id)
      .single();

    if (!profile || profile.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: entry, error } = await supabase
      .from('time_entries')
      .insert({
        user_id: user.id,
        organization_id: profile.organization_id,
        date,
        hours: parseFloat(hours),
        description: description || null,
        status: 'submitted',
      })
      .select('id')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ entry }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
