import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import ComplianceHubTabs from './ComplianceHubTabs';

async function getDocsByType(docType: string) {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    const { data } = await supabase
      .from('compliance_documents')
      .select('id, document_name, status, expiry_date, issued_to, created_at')
      .eq('organization_id', ctx.organizationId)
      .eq('document_type', docType)
      .order('expiry_date', { ascending: true });
    return (data ?? []) as Array<{
      id: string; document_name: string; status: string;
      expiry_date: string | null; issued_to: string | null; created_at: string;
    }>;
  } catch { return []; }
}

function StatusBadge({ status }: { status: string }) {
  const colors = status === 'valid' ? 'bg-green-50 text-green-700'
    : status === 'expired' ? 'bg-red-50 text-red-700'
    : 'bg-yellow-50 text-yellow-700';
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors}`}>{status}</span>;
}

function ComplianceTable({ docs, emptyMsg }: { docs: Awaited<ReturnType<typeof getDocsByType>>; emptyMsg: string }) {
  if (docs.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white px-8 py-16 text-center">
        <p className="text-sm text-text-secondary">{emptyMsg}</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
          <tr>
            <th className="px-4 py-3">Document</th>
            <th className="px-4 py-3">Issued To</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Expiry</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {docs.map((doc) => (
            <tr key={doc.id} className="hover:bg-bg-secondary/50 transition-colors">
              <td className="px-4 py-3 font-medium text-foreground">{doc.document_name}</td>
              <td className="px-4 py-3 text-text-secondary">{doc.issued_to ?? '—'}</td>
              <td className="px-4 py-3"><StatusBadge status={doc.status} /></td>
              <td className="px-4 py-3 text-text-secondary">{doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString() : 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { getDocsByType, StatusBadge, ComplianceTable };
