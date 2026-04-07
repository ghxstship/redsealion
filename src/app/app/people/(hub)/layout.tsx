import PeopleHubTabs from '../PeopleHubTabs';

export default function PeopleHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="mb-2">
        <PeopleHubTabs />
      </div>
      <div>
        {children}
      </div>
    </>
  );
}
