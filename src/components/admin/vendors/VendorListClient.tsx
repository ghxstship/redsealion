'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Building2, ShieldCheck, ShieldX } from 'lucide-react';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';

const VENDOR_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-50 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = vendors.filter((v) => {
    const matchesSearch =
      !search ||
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.email && v.email.toLowerCase().includes(search.toLowerCase())) ||
      (v.category && v.category.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <FormInput
            type="text"
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'inactive'].map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Vendor list */}
      {filtered.length === 0 ? (
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
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-secondary">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-text-muted">
                    W-9
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">
                    POs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((vendor) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
