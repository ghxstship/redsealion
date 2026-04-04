import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: allocations, error } = await supabase
      .from('resource_allocations')
      .select('*, users!user_id(full_name), proposals(name)')
      .eq('organization_id', userData.organization_id)
      .order('start_date');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: allocations ?? [] });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();

    if (!body.user_id || !body.start_date || !body.end_date) {
      return NextResponse.json(
        { error: 'user_id, start_date, and end_date are required' },
        { status: 400 },
      );
    }

    if (new Date(body.end_date) < new Date(body.start_date)) {
      return NextResponse.json(
        { error: 'end_date must be after start_date' },
        { status: 400 },
      );
    }

    const { data: allocation, error } = await supabase
      .from('resource_allocations')
      .insert({
        organization_id: userData.organization_id,
        user_id: body.user_id,
        proposal_id: body.proposal_id || null,
        start_date: body.start_date,
        end_date: body.end_date,
        hours_per_day: body.hours_per_day ?? 8,
        role: body.role || null,
        notes: body.notes || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: allocation }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
