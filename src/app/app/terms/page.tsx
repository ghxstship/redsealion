import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PageHeader from '@/components/shared/PageHeader';
import TermsDocumentView from './TermsDocumentView';

interface TermsDocument {
  id: string;
  title: string;
  version: number;
  status: string;
  is_active: boolean;
  sections: Array<{ number: string; title: string; body: string }>;
  created_at: string;
  updated_at: string;
}

async function getTermsDocuments(): Promise<TermsDocument[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];

    const { data } = await supabase
      .from('terms_documents')
      .select('id, title, version, status, is_active, sections, created_at, updated_at')
      .eq('organization_id', ctx.organizationId)
      .order('created_at', { ascending: false });

    return (data ?? []) as TermsDocument[];
  } catch {
    return [];
  }
}

export default async function TermsPage() {
  const documents = await getTermsDocuments();
  const activeDoc = documents.find((d) => d.is_active) ?? documents[0] ?? null;

  return (
    <>
      <PageHeader
        title="Terms & Conditions"
        subtitle="Manage your standard terms documents."
      />

      <TermsDocumentView
        activeDocument={activeDoc}
        allDocuments={documents}
      />
    </>
  );
}
