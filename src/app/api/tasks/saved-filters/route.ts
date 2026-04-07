import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';

/**
 * Saved task filters — user-scoped filter presets.
 */

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ filters: [] });

  const { data } = await supabase
    .from('saved_filters')
    .select('id, name, filters')
    .eq('user_id', user.id)
    .eq('entity_type', 'tasks')
    .order('created_at', { ascending: false });

  return NextResponse.json({ filters: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await resolveCurrentOrg();
  if (!ctx) return NextResponse.json({ error: 'No org' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { name, filters } = body as { name?: string; filters?: Record<string, string> };

  if (!name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('saved_filters')
    .insert({
      user_id: user.id,
      organization_id: ctx.organizationId,
      entity_type: 'tasks',
      name: name.trim(),
      filters: filters ?? {},
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ filter: data });
}
