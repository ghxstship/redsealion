import Button from '@/components/ui/Button';
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FacilityFormModal from '@/components/admin/settings/FacilityFormModal';

const facilities = [
  { id: 'fac_001', name: 'Meridian HQ', city: 'Los Angeles', state: 'CA', type: 'headquarters', isHQ: true },
  { id: 'fac_002', name: 'Meridian Fabrication', city: 'Long Beach', state: 'CA', type: 'warehouse', isHQ: false },
];

export default function FacilitiesSettingsPage() {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Facilities</h2>
          <p className="mt-1 text-sm text-text-secondary">Manage warehouses, offices, and production spaces.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-foreground/90">
          Add Facility
        </Button>
        <FacilityFormModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => router.refresh()} />
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="divide-y divide-border">
          {facilities.map((facility) => (
            <div key={facility.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{facility.name}</p>
                  {facility.isHQ && (
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      HQ
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-text-muted">
                  {facility.city}, {facility.state} &middot; {facility.type}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-bg-secondary">
                  Edit
                </Button>
                <Button className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50">
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
