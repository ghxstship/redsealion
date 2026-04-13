import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/hierarchy/budget — Get budget rollup for a hierarchy node
 * Query params: entity_type, entity_id
 * entity_type: 'project' | 'event' | 'zone' | 'activation' | 'component'
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get('entity_type');
  const entityId = searchParams.get('entity_id');

  if (!entityType || !entityId) {
    return NextResponse.json({ error: 'entity_type and entity_id required' }, { status: 400 });
  }

  const validTypes = ['project', 'event', 'zone', 'activation', 'component'];
  if (!validTypes.includes(entityType)) {
    return NextResponse.json({
      error: `entity_type must be one of: ${validTypes.join(', ')}`
    }, { status: 400 });
  }

  const { data, error } = await supabase.rpc('hierarchy_budget_rollup', {
    p_entity_type: entityType,
    p_entity_id: entityId,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
