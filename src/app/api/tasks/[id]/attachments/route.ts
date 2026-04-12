import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { requireFeature } from '@/lib/api/tier-guard';
import { castRelation } from '@/lib/supabase/cast-relation';

/**
 * Task attachments API — list and add file attachments.
 */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const tierError = await requireFeature('tasks');
  if (tierError) return tierError;

  const perm = await checkPermission('tasks', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id: taskId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    /* org-scoped */ .from('task_attachments')
    .select('id, file_name, file_url, file_type, file_size, created_at, uploaded_by, users!task_attachments_uploaded_by_fkey(full_name)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ attachments: [] });
  }

  const attachments = (data ?? []).map((row) => {
    const user = castRelation<{ full_name: string | null }>(row.users);
    return {
      id: row.id,
      file_name: row.file_name,
      file_url: row.file_url,
      file_type: row.file_type,
      file_size: row.file_size,
      uploaded_by_name: user?.full_name ?? null,
      created_at: row.created_at,
    };
  });

  return NextResponse.json({ attachments });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const tierError = await requireFeature('tasks');
  if (tierError) return tierError;

  const perm = await checkPermission('tasks', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id: taskId } = await params;
  const body = await request.json().catch(() => ({}));
  const { file_name, file_url, file_type, file_size } = body as {
    file_name?: string;
    file_url?: string;
    file_type?: string;
    file_size?: number;
  };

  if (!file_url?.trim()) {
    return NextResponse.json({ error: 'file_url is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('task_attachments')
    .insert({
      task_id: taskId,
      file_name: file_name || file_url.split('/').pop() || 'file',
      file_url,
      file_type: file_type ?? null,
      file_size: file_size ?? null,
      uploaded_by: user?.id ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ attachment: data });
}
