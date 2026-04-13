import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge, { GENERIC_STATUS_COLORS } from '@/components/ui/StatusBadge';

interface DocumentsPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function ContractorDocumentsPage({ params }: DocumentsPageProps) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single();
  if (!org) redirect('/');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/portal/${orgSlug}/login`);

  const { data: profile } = await supabase
    .from('crew_profiles')
    .select('id')
    .eq('user_id', user.id)
    .eq('organization_id', org.id)
    .maybeSingle();

  let documents: Array<{
    id: string; file_name: string; file_type: string | null;
    created_at: string; status: string;
  }> = [];

  if (profile) {
    const { data } = await supabase
      .from('compliance_documents')
      .select('id, file_name, file_type, created_at, status')
      .eq('entity_id', profile.id)
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false })
      .limit(50);

    documents = (data ?? []) as typeof documents;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        subtitle="Your uploaded documents and certifications."
      />

      {documents.length === 0 ? (
        <EmptyState
          message="No documents uploaded"
          description="Upload your certifications, licenses, and other required documents."
        />
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="rounded-lg border border-border bg-background p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{doc.file_name}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {doc.file_type ?? 'Document'} • Uploaded {new Date(doc.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </p>
                </div>
                <StatusBadge status={doc.status} colorMap={GENERIC_STATUS_COLORS} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
