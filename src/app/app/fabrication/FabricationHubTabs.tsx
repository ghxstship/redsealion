import HubTabs from '@/components/shared/HubTabs';

const TABS = [
  { key: '', label: 'Orders' },
  { key: 'bom', label: 'Bill of Materials' },
  { key: 'shop-floor', label: 'Shop Floor' },
  { key: 'print', label: 'Print' },
  { key: 'quality', label: 'Quality' },
];

export default function FabricationHubTabs() {
  return <HubTabs basePath="/app/fabrication" tabs={TABS} />;
}
