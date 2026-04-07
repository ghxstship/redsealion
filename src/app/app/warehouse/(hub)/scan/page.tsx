import ScanPageClient from './ScanPageClient';
import WarehouseHubTabs from '../../WarehouseHubTabs';

export const metadata = {
  title: 'Scan Equipment',
};

export default function ScanPage() {
  return (
    <div className="max-w-2xl mx-auto px-2 sm:px-4 py-4">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Scan Equipment
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Scan a barcode or QR code to look up equipment and manage check in/out.
        </p>
      </div>

      <WarehouseHubTabs />

      <ScanPageClient />
    </div>
  );
}
