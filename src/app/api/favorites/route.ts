import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';

/**
 * Favorites API — star/unstar any entity.
 *
 * GET    /api/favorites?entity_type=X&entity_id=Y — check if favorited
 * POST   /api/favorites — add favorite
 * DELETE /api/favorites — remove favorite
 */

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ favorited: false });

  const ctx = await resolveCurrentOrg();
  if (!ctx) return NextResponse.json({ favorited: false });

  const { searchParams } = request.nextUrl;
  const entityType = searchParams.get('entity_type');
  const entityId = searchParams.get('entity_id');

  if (!entityType || !entityId) {
    return NextResponse.json({ favorited: false });
  }

  const { data } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('organization_id', ctx.organizationId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .limit(1);

  return NextResponse.json({ favorited: (data?.length ?? 0) > 0 });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await resolveCurrentOrg();
  if (!ctx) return NextResponse.json({ error: 'Organization required' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { entity_type, entity_id } = body as { entity_type?: string; entity_id?: string };

  if (!entity_type || !entity_id) {
    return NextResponse.json({ error: 'entity_type and entity_id required' }, { status: 400 });
  }

  await supabase.from('favorites').upsert(
    { user_id: user.id, organization_id: ctx.organizationId, entity_type, entity_id },
    { onConflict: 'user_id,organization_id,entity_type,entity_id' },
  );

  return NextResponse.json({ favorited: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await resolveCurrentOrg();
  if (!ctx) return NextResponse.json({ error: 'Organization required' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { entity_type, entity_id } = body as { entity_type?: string; entity_id?: string };

  if (!entity_type || !entity_id) {
    return NextResponse.json({ error: 'entity_type and entity_id required' }, { status: 400 });
  }

  await supabase
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('organization_id', ctx.organizationId)
    .eq('entity_type', entity_type)
    .eq('entity_id', entity_id);

  return NextResponse.json({ favorited: false });
}
