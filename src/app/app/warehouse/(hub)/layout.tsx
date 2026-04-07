import WarehouseHubTabs from '../WarehouseHubTabs';

export default function WarehouseHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="mb-2">
        <WarehouseHubTabs />
      </div>
      <div>
        {children}
      </div>
    </>
  );
}
