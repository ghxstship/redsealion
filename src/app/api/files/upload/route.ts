import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';

const log = createLogger('api-file-upload');

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const ctx = await resolveCurrentOrg();
    if (!ctx) {
      return NextResponse.json({ error: 'Organization context missing.' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const proposalId = formData.get('proposal_id') as string | null;
    const projectId = formData.get('project_id') as string | null;
    const clientId = formData.get('client_id') as string | null;
    const category = formData.get('category') as string || 'other';
    const isPersonal = formData.get('is_personal') === 'true';

    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const path = `${ctx.organizationId}/${Date.now()}_${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      log.error('Failed to upload file to storage', { path }, uploadError);
      return NextResponse.json({ error: 'Failed to upload file.' }, { status: 500 });
    }

    const { data: attachmentRecord, error: dbError } = await supabase
      .from('file_attachments')
      .insert({
        organization_id: ctx.organizationId,
        uploaded_by: user.id,
        file_name: file.name,
        file_path: path,
        mime_type: file.type || 'application/octet-stream',
        file_size: file.size,
        category,
        proposal_id: proposalId || null,
        project_id: projectId || null,
        client_id: clientId || null,
        is_personal: isPersonal,
      })
      .select()
      .single();

    if (dbError || !attachmentRecord) {
      log.error('Database insert error for file_attachments', {}, dbError);
      return NextResponse.json({ error: 'Failed to save file metadata.' }, { status: 500 });
    }

    // Log the upload efficiently without blocking the response
    supabase.from('activity_log').insert({
      organization_id: ctx.organizationId,
      entity_type: 'file_attachment',
      entity_id: attachmentRecord.id,
      actor_id: user.id,
      action: 'FILE_UPLOADED',
      metadata: { file_name: attachmentRecord.file_name, category }
    }).then(({ error }) => {
      if (error) log.error('Failed to log file upload', { fileId: attachmentRecord.id }, error);
    });

    return NextResponse.json({ data: attachmentRecord }, { status: 201 });
  } catch (err) {
    log.error('Error executing file upload workflow', {}, err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
