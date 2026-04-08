import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { requireFeature } from '@/lib/api/tier-guard';
import { castRelation } from '@/lib/supabase/cast-relation';

/**
 * Project status updates API.
 */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const tierError = await requireFeature('proposals');
  if (tierError) return tierError;

  const perm = await checkPermission('proposals', 'view');
  if (!perm) return NextResponse.json({ updates: [] });
  if (!perm.allowed) return NextResponse.json({ updates: [] });

  const { id: proposalId } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from('project_status_updates')
    .select('id, status, summary, created_at, created_by, users!project_status_updates_created_by_fkey(full_name)')
    .eq('proposal_id', proposalId)
    .order('created_at', { ascending: false })
    .limit(20);

  const updates = (data ?? []).map((row) => {
    const user = castRelation<{ full_name: string }>(row.users);
    return {
      id: row.id,
      status: row.status,
      summary: row.summary,
      author_name: user?.full_name ?? null,
      created_at: row.created_at,
    };
  });

  return NextResponse.json({ updates });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const tierError = await requireFeature('proposals');
  if (tierError) return tierError;

  const perm = await checkPermission('proposals', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id: proposalId } = await params;
  const body = await request.json().catch(() => ({}));
  const { status, summary } = body as { status?: string; summary?: string };

  if (!summary?.trim()) {
    return NextResponse.json({ error: 'summary is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('project_status_updates')
    .insert({
      proposal_id: proposalId,
      status: status ?? 'on_track',
      summary: summary.trim(),
      created_by: user?.id ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ update: data });
}
