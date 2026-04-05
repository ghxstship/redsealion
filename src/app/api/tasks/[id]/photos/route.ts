import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('tasks', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id: taskId } = await context.params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('job_site_photos')
    .select()
    .eq('task_id', taskId)
    .eq('organization_id', perm.organizationId)
    .order('taken_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Failed to fetch photos.', details: error.message }, { status: 500 });
  return NextResponse.json({ photos: data ?? [] });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('tasks', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id: taskId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const { file_url, file_name, file_size_bytes, mime_type, latitude, longitude, caption, photo_type } = body;

  if (!file_url) return NextResponse.json({ error: 'file_url is required.' }, { status: 400 });

  const supabase = await createClient();

  const { data: photo, error } = await supabase
    .from('job_site_photos')
    .insert({
      organization_id: perm.organizationId,
      task_id: taskId,
      file_url,
      file_name: file_name || null,
      file_size_bytes: file_size_bytes || null,
      mime_type: mime_type || null,
      latitude: latitude || null,
      longitude: longitude || null,
      caption: caption || null,
      photo_type: photo_type || 'progress',
      uploaded_by: perm.userId,
    })
    .select()
    .single();

  if (error || !photo) return NextResponse.json({ error: 'Failed to upload photo.', details: error?.message }, { status: 500 });
  return NextResponse.json({ success: true, photo });
}
