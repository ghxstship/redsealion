import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createLogger } from '@/lib/logger';

const log = createLogger('api:crew:documents:upload');

interface RouteContext { params: Promise<{ id: string; docId: string }> }

/**
 * POST /api/crew/[id]/documents/[docId]/upload
 * Upload a file for an onboarding document.
 */
export async function POST(request: Request, context: RouteContext) {
  const perm = await checkPermission('crew', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, docId } = await context.params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('crew_profiles')
    .select('user_id, organization_id')
    .eq('id', id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Crew profile not found' }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const filePath = `onboarding/${profile.organization_id}/${id}/${docId}/${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase
      .storage
      .from('documents')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      log.error('Failed to upload file', { docId, filePath }, uploadError);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    const { data: urlData } = supabase
      .storage
      .from('documents')
      .getPublicUrl(filePath);

    const { data, error } = await supabase
      .from('onboarding_documents')
      .update({
        file_url: urlData.publicUrl,
        status: 'uploaded',
      })
      .eq('id', docId)
      .select()
      .single();

    if (error) {
      log.error('Failed to update document record', { docId }, error);
      return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    log.error('Document upload error', { docId }, err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
