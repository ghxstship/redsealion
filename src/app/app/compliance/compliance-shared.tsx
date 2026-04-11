import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import CanonicalStatusBadge, { COMPLIANCE_STATUS_COLORS } from '@/components/ui/StatusBadge';
import ComplianceHubTabs from './ComplianceHubTabs';

async function getDocsByType(docType: string) {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    const { data } = await supabase
      .from('compliance_documents')
      .select('id, document_name, status, expiry_date, issued_to, notes, created_at')
      .eq('organization_id', ctx.organizationId)
      .eq('document_type', docType)
      .is('deleted_at', null)
      .order('expiry_date', { ascending: true });
    return (data ?? []) as Array<{
      id: string; document_name: string; status: string;
      expiry_date: string | null; issued_to: string | null; notes: string | null; created_at: string;
    }>;
  } catch { return []; }
}

/** Compliance-scoped StatusBadge — thin wrapper over canonical component. */
function ComplianceStatusBadge({ status }: { status: string }) {
  return <CanonicalStatusBadge status={status} colorMap={COMPLIANCE_STATUS_COLORS} />;
}

function ComplianceTable({ docs, emptyMsg }: { docs: Awaited<ReturnType<typeof getDocsByType>>; emptyMsg: string }) {
  if (docs.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-background px-8 py-16 text-center">
        <p className="text-sm text-text-secondary">{emptyMsg}</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden">
      <div className="overflow-x-auto">
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
                <td className="px-4 py-3"><ComplianceStatusBadge status={doc.status} /></td>
                <td className="px-4 py-3 text-text-secondary">{doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { getDocsByType, ComplianceStatusBadge as StatusBadge, ComplianceTable };
