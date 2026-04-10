import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteContext { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, context: RouteContext) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));

  const updates: Record<string, unknown> = {};
  if (body.read !== undefined) {
    updates.read = body.read;
    updates.read_at = body.read ? new Date().toISOString() : null;
  }
  if (body.archived !== undefined) {
    updates.archived = body.archived;
  }
  
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  const { data, error } = await supabase
    .from('notifications')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error || !data) return NextResponse.json({ error: 'Failed to update', details: error?.message }, { status: 500 });
  return NextResponse.json({ success: true, notification: data });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;

  const { error } = await supabase.from('notifications').delete().eq('id', id).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: 'Failed to delete', details: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
