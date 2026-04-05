import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from('users')
    .select('id, email, full_name, first_name, last_name, phone, title, avatar_url, created_at')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return NextResponse.json({ user: profile });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { full_name, phone, title } = body;

  if (!full_name || typeof full_name !== 'string' || full_name.trim().length === 0) {
    return NextResponse.json(
      { error: 'Full name is required' },
      { status: 400 },
    );
  }

  if (phone !== undefined && phone !== null && typeof phone !== 'string') {
    return NextResponse.json(
      { error: 'Phone must be a string' },
      { status: 400 },
    );
  }

  if (title !== undefined && title !== null && typeof title !== 'string') {
    return NextResponse.json(
      { error: 'Title must be a string' },
      { status: 400 },
    );
  }

  const { data: updated, error } = await supabase
    .from('users')
    .update({
      full_name: full_name.trim(),
      phone: phone?.trim() || null,
      title: title?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select('id, email, full_name, first_name, last_name, phone, title, avatar_url')
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 },
    );
  }

  return NextResponse.json({ user: updated });
}
