import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';

const log = createLogger('api-file-delete');

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id: fileId } = await context.params;

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    // Fetch the file to ensure the user has RLS access and retrieve metadata
    const { data: file, error: fetchError } = await supabase
      .from('file_attachments')
      .select('id, file_path, file_name, organization_id, deleted_at')
      .eq('id', fileId)
      .single();

    if (fetchError || !file) {
      return NextResponse.json({ error: 'File not found or access denied.' }, { status: 404 });
    }

    if (file.deleted_at) {
      return NextResponse.json({ error: 'File ALREADY deleted.' }, { status: 400 });
    }

    // Update the deleted_at flag to implement soft delete
    const { error: updateError } = await supabase
      .from('file_attachments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', fileId);

    if (updateError) {
      log.error('Failed to soft delete file record', { fileId }, updateError);
      return NextResponse.json({ error: 'Failed to delete file.' }, { status: 500 });
    }

    // Log the deletion asynchronously
    if (file.organization_id) {
      supabase.from('activity_log').insert({
        organization_id: file.organization_id,
        entity_type: 'file_attachment',
        entity_id: fileId,
        actor_id: user.id,
        action: 'FILE_DELETED',
        metadata: { file_name: file.file_name }
      }).then(({ error }) => {
        if (error) log.error('Failed to log file deletion', { fileId }, error);
      });
    }

    return NextResponse.json({ success: true, message: 'File deleted.' });
  } catch (err) {
    log.error('Error executing file delete workflow', { fileId }, err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
