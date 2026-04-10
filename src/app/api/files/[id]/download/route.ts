import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';

const log = createLogger('api-file-download');

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/files/[id]/download
 *
 * Generates a signed download URL for a file attachment.
 * Requires the user to have access to the proposal the file belongs to.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { id: fileId } = await context.params;

  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    // Fetch the file attachment — RLS will enforce access control
    const { data: file, error: fetchError } = await supabase
      .from('file_attachments')
      .select('id, file_name, file_path, mime_type, organization_id')
      .eq('id', fileId)
      .single();

    if (fetchError || !file) {
      return NextResponse.json({ error: 'File not found.' }, { status: 404 });
    }

    // Generate a signed URL (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('attachments')
      .createSignedUrl(file.file_path, 3600);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      log.error('Failed to generate signed URL', { fileId, filePath: file.file_path }, signedUrlError);
      return NextResponse.json({ error: 'Failed to generate download URL.' }, { status: 500 });
    }

    // Log the download asynchronously
    if (file.organization_id) {
      supabase.from('activity_log').insert({
        organization_id: file.organization_id,
        entity_type: 'file_attachment',
        entity_id: file.id,
        actor_id: user.id,
        action: 'FILE_DOWNLOADED',
        metadata: { file_name: file.file_name }
      }).then(({ error }) => {
        if (error) log.error('Failed to log file download', { fileId }, error);
      });
    }

    return NextResponse.json({
      url: signedUrlData.signedUrl,
      file_name: file.file_name,
      mime_type: file.mime_type,
    });
  } catch (err) {
    log.error('Error generating file download URL', { fileId }, err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
