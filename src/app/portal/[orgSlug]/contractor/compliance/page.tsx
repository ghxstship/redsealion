import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import Card from '@/components/ui/Card';

interface CompliancePageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function ContractorCompliancePage({ params }: CompliancePageProps) {
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

  let complianceDocs: Array<{
    id: string; doc_type: string; file_name: string;
    status: string; expiry_date: string | null;
  }> = [];

  if (profile) {
    const { data } = await supabase
      .from('compliance_documents')
      .select('id, doc_type, file_name, status, expiry_date')
      .eq('entity_id', profile.id)
      .eq('organization_id', org.id)
      .order('expiry_date', { ascending: true, nullsFirst: false });

    complianceDocs = (data ?? []) as typeof complianceDocs;
  }

  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const active = complianceDocs.filter(d => d.status === 'approved' || d.status === 'active');
  const expiring = complianceDocs.filter(d => {
    if (!d.expiry_date) return false;
    const exp = new Date(d.expiry_date);
    return exp > now && exp <= thirtyDays;
  });
  const expired = complianceDocs.filter(d => {
    if (!d.expiry_date) return false;
    return new Date(d.expiry_date) < now;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance"
        subtitle="Track your certifications, licenses, and compliance status."
      />

      {/* Status cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Active</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{active.length}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Expiring Soon</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">{expiring.length}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Expired</p>
          <p className="mt-2 text-2xl font-bold text-red-600">{expired.length}</p>
        </Card>
      </div>

      {/* Documents */}
      {complianceDocs.length === 0 ? (
        <EmptyState
          message="No compliance documents"
          description="Upload your certifications and licenses to get started."
        />
      ) : (
        <div className="space-y-2">
          {complianceDocs.map((doc) => {
            const isExpired = doc.expiry_date && new Date(doc.expiry_date) < now;
            const isExpiring = doc.expiry_date && !isExpired && new Date(doc.expiry_date) <= thirtyDays;

            return (
              <div
                key={doc.id}
                className={`rounded-lg border p-4 ${
                  isExpired
                    ? 'border-red-200 bg-red-50/50'
                    : isExpiring
                      ? 'border-amber-200 bg-amber-50/50'
                      : 'border-border bg-background'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{doc.file_name}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {doc.doc_type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </p>
                  </div>
                  <div className="text-right">
                    {doc.expiry_date ? (
                      <p className={`text-xs font-medium ${
                        isExpired ? 'text-red-600' : isExpiring ? 'text-amber-600' : 'text-text-secondary'
                      }`}>
                        {isExpired ? 'Expired' : isExpiring ? 'Expiring' : 'Valid'}{' '}
                        {new Date(doc.expiry_date).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </p>
                    ) : (
                      <p className="text-xs text-text-muted">No expiry</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
