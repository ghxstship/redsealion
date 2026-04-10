import ScanPageClient from './ScanPageClient';
import LogisticsHubTabs from "../../LogisticsHubTabs";
import PageHeader from '@/components/shared/PageHeader';

export const metadata = {
  title: 'Scan Equipment',
};

export default function ScanPage() {
  return (
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
  );
}
