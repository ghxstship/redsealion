import CrewHubTabs from '../CrewHubTabs';

export default function CrewHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CrewHubTabs />
      {children}
    </>
  );
}
