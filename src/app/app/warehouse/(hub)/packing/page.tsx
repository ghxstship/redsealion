import Link from 'next/link';
import { Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import WarehouseHubTabs from '../../WarehouseHubTabs';

interface Proposal {
  id: string;
  name: string;
  client_name: string;
}

interface PackingItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  packed: boolean;
}

const fallbackProposals: Proposal[] = [
  { id: 'prop_001', name: 'Nike Air Max Experience', client_name: 'Nike' },
  { id: 'prop_005', name: 'Nike SNKRS Fest 2026', client_name: 'Nike' },
  { id: 'prop_002', name: 'Samsung Galaxy Unpacked', client_name: 'Samsung' },
  { id: 'prop_003', name: 'Spotify Wrapped Live', client_name: 'Spotify' },
];

const fallbackPackingItems: PackingItem[] = [
  { id: 'pk_001', name: 'Martin MAC Aura XB', category: 'Lighting', quantity: 8, packed: true },
  { id: 'pk_002', name: 'GrandMA3 Full-Size', category: 'Lighting Control', quantity: 1, packed: true },
  { id: 'pk_003', name: 'L-Acoustics K2 Array', category: 'Audio', quantity: 4, packed: false },
  { id: 'pk_004', name: 'Shure Axient Digital', category: 'Audio', quantity: 12, packed: false },
  { id: 'pk_005', name: 'ROE Visual CB5 Panel', category: 'LED', quantity: 24, packed: false },
  { id: 'pk_006', name: 'Barco UDX-4K32', category: 'Video', quantity: 2, packed: true },
  { id: 'pk_007', name: 'Tyler GT Truss 12x12', category: 'Rigging', quantity: 6, packed: false },
  { id: 'pk_008', name: 'Chain Hoist 1-Ton', category: 'Rigging', quantity: 8, packed: false },
  { id: 'pk_009', name: 'Pelican 1650 Case', category: 'Cases', quantity: 20, packed: true },
  { id: 'pk_010', name: 'Disguise GX 2c', category: 'Media Server', quantity: 1, packed: false },
];

async function getProposals(): Promise<Proposal[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('No auth');
const { data: proposals } = await supabase
      .from('proposals')
      .select('id, name, clients(company_name)')
      .eq('organization_id', ctx.organizationId)
      .in('status', ['approved', 'in_production', 'sent'])
      .order('name');

    if (!proposals || proposals.length === 0) throw new Error('No proposals');

    return proposals.map((p: Record<string, unknown>) => ({
      id: p.id as string,
      name: p.name as string,
      client_name: (p.clients as Record<string, string>)?.company_name ?? 'Unknown',
    }));
  } catch {
    return fallbackProposals;
  }
}

export default async function PackingPage() {
  const proposals = await getProposals();

  // Show a default packing list for demo
  const packedCount = fallbackPackingItems.filter((i) => i.packed).length;
  const totalCount = fallbackPackingItems.length;

  return (
    <>
      {/* Header */}
      <PageHeader title="Packing" subtitle="Manage your equipment load-outs." />

      <WarehouseHubTabs />

      {/* Proposal selector */}
      <Card className="mb-8">
        <h2 className="text-sm font-semibold text-foreground mb-4">Select a Proposal</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {proposals.map((proposal) => (
            <button
              key={proposal.id}
              className="rounded-lg border border-border bg-white px-4 py-3 text-left transition-colors hover:border-foreground/20 hover:bg-bg-secondary/50 first:border-foreground first:bg-bg-secondary"
            >
              <p className="text-sm font-medium text-foreground truncate">{proposal.name}</p>
              <p className="text-xs text-text-muted mt-0.5">{proposal.client_name}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* Packing list */}
      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Nike SNKRS Fest 2026 &mdash; Packing List
            </h2>
            <p className="text-xs text-text-muted mt-0.5">Convention Center Hall A</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-24 rounded-full bg-bg-secondary">
                <div
                  className="h-2 rounded-full bg-green-500"
                  style={{ width: `${Math.round((packedCount / totalCount) * 100)}%` }}
                />
              </div>
              <span className="text-xs tabular-nums text-text-muted">
                {packedCount}/{totalCount} packed
              </span>
            </div>
            <Button size="sm">
              Export PDF
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-secondary">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted w-10">
                  Packed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {fallbackPackingItems.map((item) => (
                <tr
                  key={item.id}
                  className={`transition-colors hover:bg-bg-secondary/50 ${
                    item.packed ? 'opacity-60' : ''
                  }`}
                >
                  <td className="px-6 py-3.5">
                    <div
                      className={`h-4 w-4 rounded border ${
                        item.packed
                          ? 'border-green-500 bg-green-500'
                          : 'border-border bg-white'
                      } flex items-center justify-center`}
                    >
                      {item.packed && (
                        <Check size={10} className="text-white" />
                      )}
                    </div>
                  </td>
                  <td className={`px-6 py-3.5 text-sm font-medium text-foreground ${item.packed ? 'line-through' : ''}`}>
                    {item.name}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="inline-flex items-center rounded-full bg-bg-secondary px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-sm tabular-nums text-foreground">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
