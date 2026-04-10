import { createClient } from '@/lib/supabase/server';
import PageHeader from '@/components/shared/PageHeader';
import MyDocumentsTable, { type MyDocumentData } from '@/components/admin/my-documents/MyDocumentsTable';

async function getMyDocuments(): Promise<MyDocumentData[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: files } = await supabase
      .from('file_attachments')
      .select('id, file_name, file_size, category, mime_type, created_at, version_number')
      .eq('uploaded_by', user.id)
      .eq('is_personal', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    return files as MyDocumentData[] || [];
  } catch {
    return [];
  }
}

export default async function MyDocumentsPage() {
  const files = await getMyDocuments();

  return (
    <div>
      <PageHeader
        title="My Documents"
        subtitle="Your personal file repository."
      />
      <MyDocumentsTable initialFiles={files} />
    </div>
  );
}
