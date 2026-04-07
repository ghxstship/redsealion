import InvoiceHubTabs from '../InvoiceHubTabs';

export default function InvoiceHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="mb-2">
        <InvoiceHubTabs />
      </div>
      <div>
        {children}
      </div>
    </>
  );
}
