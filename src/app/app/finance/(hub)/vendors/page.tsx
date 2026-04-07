import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PageHeader from '@/components/shared/PageHeader';
import FinanceHubTabs from '../../FinanceHubTabs';
import Button from '@/components/ui/Button';
import VendorListClient from '@/components/admin/vendors/VendorListClient';
import { Plus } from 'lucide-react';

interface VendorRow {
  id: string;
  name: string;
  displayName: string | null;
  email: string | null;
  phone: string | null;
  category: string | null;
  status: string;
  w9OnFile: boolean;
  poCount: number;
}

async function getVendors(): Promise<VendorRow[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');

    const { data: vendors } = await supabase
      .from('vendors')
      .select('id, name, display_name, email, phone, category, status, w9_on_file')
      .eq('organization_id', ctx.organizationId)
      .order('name');

    if (!vendors || vendors.length === 0) return [];

    // Get PO counts per vendor
    const vendorIds = vendors.map((v) => v.id);
    const { data: poCounts } = await supabase
      .from('purchase_orders')
      .select('vendor_id')
      .in('vendor_id', vendorIds);

    const countMap = new Map<string, number>();
    for (const po of poCounts ?? []) {
      if (po.vendor_id) {
        countMap.set(po.vendor_id as string, (countMap.get(po.vendor_id as string) ?? 0) + 1);
      }
    }

    return vendors.map((v) => ({
      id: v.id,
      name: v.name,
      displayName: v.display_name,
      email: v.email,
      phone: v.phone,
      category: v.category,
      status: v.status,
      w9OnFile: v.w9_on_file,
      poCount: countMap.get(v.id) ?? 0,
    }));
  } catch {
    return [];
  }
}

export default async function VendorsPage() {
  const vendors = await getVendors();
  const activeCount = vendors.filter((v) => v.status === 'active').length;

  return (
    <TierGate feature="profitability">
      <PageHeader
        title="Vendors"
        subtitle={`${vendors.length} vendors · ${activeCount} active`}
      >
        <Button href="/app/finance/vendors/new">
          <Plus className="h-4 w-4" />
          Add Vendor
        </Button>
      </PageHeader>

      <FinanceHubTabs />

      <VendorListClient vendors={vendors} />
    </TierGate>
  );
}
