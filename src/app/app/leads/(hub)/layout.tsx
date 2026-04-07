import LeadsHubTabs from '../LeadsHubTabs';

export default function LeadsHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="mb-2">
        <LeadsHubTabs />
      </div>
      <div>
        {children}
      </div>
    </>
  );
}
