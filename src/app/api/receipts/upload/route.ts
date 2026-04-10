import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createLogger } from '@/lib/logger';

const log = createLogger('receipts:upload');

const BUCKET = 'receipts';
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export async function POST(request: NextRequest) {
  const perm = await checkPermission('expenses', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const expenseId = formData.get('expense_id') as string | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type. Use JPEG, PNG, WebP, or PDF.' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File exceeds 10MB limit.' }, { status: 400 });
    }

    const supabase = await createClient();

    // Generate a unique filename
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const uniqueName = `${perm.organizationId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

    // Upload to Supabase storage
    const buffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(uniqueName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      log.error('Upload failed', { name: file.name }, uploadError);
      return NextResponse.json({ error: 'Upload failed', details: uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(uploadData.path);

    const publicUrl = urlData?.publicUrl ?? '';

    // If expense_id provided, update the expense with the receipt URL by adding to expense_receipts
    if (expenseId) {
      await supabase
        .from('expense_receipts')
        .insert({ 
          file_url: publicUrl,
          expense_id: expenseId,
          organization_id: perm.organizationId,
          file_name: file.name
        });
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: uploadData.path,
      filename: file.name,
    }, { status: 201 });
  } catch (err) {
    log.error('Receipt upload error', {}, err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
