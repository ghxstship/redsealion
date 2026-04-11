'use client';
import HubTabs from '@/components/shared/HubTabs';

export default function EquipmentHubTabs() {
  return (
    <HubTabs
      basePath="/app/equipment"
      tabs={[
        { key: '', label: 'Assets' },
        { key: 'inventory', label: 'Inventory' },
        { key: 'check-in-out', label: 'Check In/Out' },
        { key: 'bundles', label: 'Bundles' },
        { key: 'maintenance', label: 'Maintenance' }
      ]}
    />
  );
}
