import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 min-w-0 md:ml-0">
        <div className="px-6 py-8 md:px-10 md:py-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
