import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/ui/Card';
import ComplianceHubTabs from '../ComplianceHubTabs';

interface ComplianceStats {
  total: number;
  valid: number;
  expiring: number;
  expired: number;
}

async function getComplianceStats(): Promise<ComplianceStats> {
  const fallback: ComplianceStats = { total: 0, valid: 0, expiring: 0, expired: 0 };
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');

    const { data } = await supabase
      .from('compliance_documents')
      .select('id, status, expiry_date')
      .eq('organization_id', ctx.organizationId);

    if (!data) return fallback;

    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return {
      total: data.length,
      valid: data.filter((d) => d.status === 'valid').length,
      expiring: data.filter((d) => {
        if (!d.expiry_date) return false;
        const exp = new Date(d.expiry_date);
        return exp > now && exp <= thirtyDays;
      }).length,
      expired: data.filter((d) => d.status === 'expired').length,
    };
  } catch {
    return fallback;
  }
}

export default async function CompliancePage() {
  const stats = await getComplianceStats();

  const cards = [
    { label: 'Total Documents', value: String(stats.total), detail: 'All tracked documents' },
    { label: 'Valid', value: String(stats.valid), detail: 'Current and compliant', color: 'text-green-600' },
    { label: 'Expiring Soon', value: String(stats.expiring), detail: 'Within 30 days', color: 'text-yellow-600' },
    { label: 'Expired', value: String(stats.expired), detail: 'Requires renewal', color: 'text-red-600' },
  ];

  return (
    <TierGate feature="crew">
      <PageHeader
        title="Compliance"
        subtitle="Track COIs, W-9s, licenses, and certifications across your crew."
      />

      <ComplianceHubTabs />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-white px-5 py-5">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">{card.label}</p>
            <p className={`mt-2 text-3xl font-semibold tracking-tight ${card.color ?? 'text-foreground'}`}>{card.value}</p>
            <p className="mt-1 text-xs text-text-secondary">{card.detail}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-white px-8 py-16 text-center">
        <p className="text-sm text-text-secondary">
          Compliance documents will appear here. Add documents from individual crew member profiles.
        </p>
      </div>
    </TierGate>
  );
}
