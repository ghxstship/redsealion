import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PageHeader from '@/components/shared/PageHeader';
import LogisticsHubTabs from "../../LogisticsHubTabs";
import GoodsReceiptsHeader from '@/components/admin/warehouse/GoodsReceiptsHeader';

interface GoodsReceipt {
  id: string;
  receipt_number: string;
  received_date: string;
  notes: string | null;
  purchase_orders: { po_number: string; vendors: { name: string } | null } | null;
  users: { full_name: string } | null;
}

async function getGoodsReceipts(): Promise<GoodsReceipt[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    
    const { data } = await supabase
      .from('goods_receipts')
      .select('id, receipt_number, received_date, notes, purchase_orders(po_number, vendors(name)), users!received_by(full_name)')
      .eq('organization_id', ctx.organizationId)
      .order('received_date', { ascending: false });
      
    // Simplifying mapping
    return (data as any) ?? [];
  } catch {
    return [];
  }
}

export default async function GoodsReceiptsPage() {
  const receipts = await getGoodsReceipts();

  return (
    <>
      <PageHeader
        title="Goods Receipts"
        subtitle="Track incoming deliveries against purchase orders."
      >
        <div className="relative z-50">
          <GoodsReceiptsHeader />
        </div>
      </PageHeader>
      
      <LogisticsHubTabs />

      <div className="rounded-xl border border-border bg-background overflow-hidden mt-6">
        {receipts.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-text-muted">
            No goods receipts found. Create one from an inbound shipment or PO.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider border-b border-border">
              <tr>
                <th className="px-6 py-3">Receipt #</th>
                <th className="px-6 py-3">PO Number</th>
                <th className="px-6 py-3">Vendor</th>
                <th className="px-6 py-3">Received By</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {receipts.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-bg-secondary/50">
                  <td className="px-6 py-3.5 font-medium text-foreground">
                    <Link href={`/app/logistics/goods-receipts/${r.id}`} className="hover:underline">
                      {r.receipt_number}
                    </Link>
                  </td>
                  <td className="px-6 py-3.5 text-text-secondary">
                    {r.purchase_orders?.po_number ?? '—'}
                  </td>
                  <td className="px-6 py-3.5 text-text-secondary">
                    {r.purchase_orders?.vendors?.name ?? '—'}
                  </td>
                  <td className="px-6 py-3.5 text-text-secondary">
                    {r.users?.full_name ?? '—'}
                  </td>
                  <td className="px-6 py-3.5 text-text-secondary">
                    {r.received_date ? new Date(r.received_date).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
