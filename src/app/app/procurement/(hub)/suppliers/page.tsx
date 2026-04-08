import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import ProcurementHubTabs from '../../ProcurementHubTabs';

async function getSuppliers() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    const { data } = await supabase
      .from('vendors')
      .select('id, name, contact_name, email, phone, status, category')
      .eq('organization_id', ctx.organizationId)
      .order('name', { ascending: true });
    return (data ?? []) as Array<{
      id: string; name: string; contact_name: string | null; email: string | null;
      phone: string | null; status: string; category: string | null;
    }>;
  } catch { return []; }
}

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();
  const categories = suppliers.reduce((acc, s) => { const k = s.category ?? 'Uncategorized'; acc[k] = (acc[k] ?? 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <TierGate feature="equipment">
      <PageHeader title="Suppliers" subtitle="Manage vendor relationships for procurement." />
      <ProcurementHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Total Suppliers</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{suppliers.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Active</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-green-600">{suppliers.filter((s) => s.status === 'active').length}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Categories</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{Object.keys(categories).length}</p>
        </div>
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
                    <td className="px-4 py-3 text-text-secondary">{s.contact_name ?? '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{s.email ?? '—'}</td>
                    <td className="px-4 py-3 text-text-secondary capitalize">{s.category ?? '—'}</td>
                    <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${s.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-bg-secondary text-gray-700'}`}>{s.status}</span></td>
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
