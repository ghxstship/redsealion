import EquipmentHubTabs from '../EquipmentHubTabs';

export default function EquipmentHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="mb-2">
        <EquipmentHubTabs />
      </div>
      <div>
        {children}
      </div>
    </>
  );
}
