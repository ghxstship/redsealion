import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

/**
 * GET /api/equipment/assets
 *
 * Returns equipment assets for the current organization.
 * Supports optional `?search=` query for autocomplete filtering.
 * Returns `[{ id, name }]` for dropdowns and search results.
 */
export async function GET(request: NextRequest) {
  const perm = await checkPermission('equipment', 'view');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.trim();

  const supabase = await createClient();
  const orgId = perm.organizationId;

  let query = supabase
    .from('assets')
    .select('id, name')
    .eq('organization_id', orgId)
    .order('name', { ascending: true });

  if (search && search.length >= 2) {
    query = query.ilike('name', `%${search}%`);
  }

  // Limit results for performance
  query = query.limit(100);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch assets.' },
      { status: 500 },
    );
  }

  return NextResponse.json(data ?? []);
}
