'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ShieldX } from 'lucide-react';
import { useSort } from '@/hooks/useSort';
import SortableHeader from '@/components/shared/SortableHeader';
import RowActionMenu from '@/components/shared/RowActionMenu';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import SearchInput from '@/components/ui/SearchInput';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import Tabs from '@/components/ui/Tabs';
import { Building2 } from 'lucide-react';

const VENDOR_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-50 text-green-700',
  inactive: 'bg-bg-secondary text-text-muted',
};

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

export default function VendorListClient({ vendors }: { vendors: VendorRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteVendorId, setDeleteVendorId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return vendors.filter((v) => {
      const matchesSearch =
        !search ||
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        (v.email && v.email.toLowerCase().includes(search.toLowerCase())) ||
        (v.category && v.category.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [vendors, search, statusFilter]);

  const { sorted, sort, handleSort } = useSort(filtered);

  return (
    <>
      {/* Status tabs */}
      <Tabs
        tabs={['all', 'active', 'inactive'].map((key) => ({
          key,
          label: key === 'all' ? 'All' : key.charAt(0).toUpperCase() + key.slice(1),
          count: key === 'all' ? vendors.length : vendors.filter((v) => v.status === key).length,
        }))}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
        className="mb-6"
      />

      {/* Search */}
      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search vendors..." />
      </div>

      {/* Vendor list */}
      {sorted.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-10 w-10" />}
          message={vendors.length === 0 ? 'No vendors yet' : 'No matching vendors'}
          description={
            vendors.length === 0
              ? 'Add a vendor to start tracking supplier relationships.'
              : 'No vendors match your current filters.'
          }
        />
      ) : (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-secondary">
                  <th className="px-6 py-3"><SortableHeader label="Vendor" field="name" currentSort={sort} onSort={handleSort} /></th>
                  <th className="px-6 py-3"><SortableHeader label="Category" field="category" currentSort={sort} onSort={handleSort} /></th>
                  <th className="px-6 py-3"><SortableHeader label="Contact" field="email" currentSort={sort} onSort={handleSort} /></th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-text-muted">W-9</th>
                  <th className="px-6 py-3"><SortableHeader label="POs" field="poCount" currentSort={sort} onSort={handleSort} /></th>
                  <th className="px-6 py-3"><SortableHeader label="Status" field="status" currentSort={sort} onSort={handleSort} /></th>
                  <th className="px-6 py-3 w-12"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((vendor) => (
                  <tr key={vendor.id} className="transition-colors hover:bg-bg-secondary/50">
                    <td className="px-6 py-3.5">
                      <Link
                        href={`/app/finance/vendors/${vendor.id}`}
                        className="text-sm font-medium text-foreground hover:underline"
                      >
                        {vendor.displayName || vendor.name}
                      </Link>
                      {vendor.displayName && (
                        <p className="text-xs text-text-muted">{vendor.name}</p>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-text-secondary">
                      {vendor.category ?? '—'}
                    </td>
                    <td className="px-6 py-3.5">
                      {vendor.email ? (
                        <p className="text-sm text-text-secondary">{vendor.email}</p>
                      ) : (
                        <span className="text-sm text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      {vendor.w9OnFile ? (
                        <ShieldCheck className="mx-auto h-4 w-4 text-green-600" />
                      ) : (
                        <ShieldX className="mx-auto h-4 w-4 text-text-muted" />
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="text-sm tabular-nums text-foreground">{vendor.poCount}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={vendor.status} colorMap={VENDOR_STATUS_COLORS} />
                    </td>
                    <td className="px-6 py-3.5">
                      <RowActionMenu actions={[
                        { label: 'View', onClick: () => router.push(`/app/finance/vendors/${vendor.id}`) },
                        { label: 'Edit', onClick: () => router.push(`/app/finance/vendors/${vendor.id}?edit=true`) },
                        { label: 'Delete', variant: 'danger', onClick: () => setDeleteVendorId(vendor.id) },
                      ]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {deleteVendorId && (
        <ConfirmDialog
          open
          title="Delete Vendor"
          message="Are you sure you want to delete this vendor? Associated purchase orders will not be deleted."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={async () => {
            await fetch(`/api/vendors/${deleteVendorId}`, { method: 'DELETE' });
            setDeleteVendorId(null);
            router.refresh();
          }}
          onCancel={() => setDeleteVendorId(null)}
        />
      )}
    </>
  );
}
