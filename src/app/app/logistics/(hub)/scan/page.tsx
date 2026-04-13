import ScanPageClient from './ScanPageClient';
import LogisticsHubTabs from "../../LogisticsHubTabs";
import PageHeader from '@/components/shared/PageHeader';

import { RoleGate } from '@/components/shared/RoleGate';
export const metadata = {
  title: 'Scan Equipment',
};

export default function ScanPage() {
  return (
    <RoleGate>
    <>
      <PageHeader
        title="Scan Equipment"
        subtitle="Scan a barcode or QR code to look up equipment and manage check in/out."
      />

      <LogisticsHubTabs />

      <div className="max-w-2xl mt-8">
        <ScanPageClient />
      </div>
    </>
  </RoleGate>
  );
}
