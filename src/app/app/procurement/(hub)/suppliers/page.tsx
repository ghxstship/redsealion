import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import Link from 'next/link';
import ProcurementHubTabs from '../../ProcurementHubTabs';
import StatusBadge, { SUPPLIER_STATUS_COLORS } from '@/components/ui/StatusBadge';
import MetricCard from '@/components/ui/MetricCard';

async function getSuppliers() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    const { data } = await supabase
      .from('vendors')
      .select('id, name, display_name, email, phone, status, category')
      .eq('organization_id', ctx.organizationId)
      .order('name', { ascending: true });
    return (data ?? []) as Array<{
      id: string; name: string; display_name: string | null; email: string | null;
      phone: string | null; status: string; category: string | null;
    }>;
  } catch { return []; }
}

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();
  const categories = suppliers.reduce((acc, s) => { const k = s.category ?? 'Uncategorized'; acc[k] = (acc[k] ?? 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <TierGate feature="procurement">
      <PageHeader title="Suppliers" subtitle="Manage vendor relationships for procurement." />
      <ProcurementHubTabs />

      <div className="flex justify-end mb-6">
        <Link href="/app/procurement/suppliers/new" className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90 transition-colors">
          + Add Supplier
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        <MetricCard label={"Total Suppliers"} value={suppliers.length} />
        <MetricCard label={"Active"} value={suppliers.filter((s) => s.status === 'active').length} className="[&_.text-foreground]:text-green-600" />
        <MetricCard label={"Categories"} value={Object.keys(categories).length} />
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {suppliers.length === 0 ? (
          <div className="px-8 py-16 text-center"><p className="text-sm text-text-secondary">No suppliers added. Add vendors from Finance or Procurement to start sourcing.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                    <td className="px-4 py-3 text-text-secondary">{s.display_name ?? '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{s.email ?? '—'}</td>
                    <td className="px-4 py-3 text-text-secondary capitalize">{s.category ?? '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} colorMap={SUPPLIER_STATUS_COLORS} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </TierGate>
  );
}
