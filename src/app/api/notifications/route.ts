import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .eq('archived', false)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch notifications', details: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { ids, read, archived } = body as { ids?: string[]; read?: boolean; archived?: boolean };

  if (!ids || ids.length === 0) {
    return NextResponse.json({ error: 'ids required' }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof read === 'boolean') {
    patch.read = read;
    patch.read_at = read ? new Date().toISOString() : null;
  }
  if (typeof archived === 'boolean') {
    patch.archived = archived;
  }

  const { error } = await supabase
    .from('notifications')
    .update(patch)
    .in('id', ids)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to update notifications', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { ids } = body as { ids?: string[] };

  if (!ids || ids.length === 0) {
    return NextResponse.json({ error: 'ids required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('notifications')
    .delete()
    .in('id', ids)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete notifications', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
