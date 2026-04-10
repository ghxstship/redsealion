import PageHeader from '@/components/shared/PageHeader';
import Skeleton from '@/components/ui/Skeleton';

export default function LocationsLoading() {
  return (
    <>
      <PageHeader title="Loading location..." subtitle="Fetching details">
        <Skeleton className="h-9 w-32" />
      </PageHeader>
      
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="rounded-xl border border-border bg-background p-6 space-y-4">
          <Skeleton className="h-5 w-1/4" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-1/5" />
                <Skeleton className="h-4 w-2/5" />
              </div>
            ))}
          </div>
        </div>
        
        <div className="rounded-xl border border-border bg-background p-6 space-y-4">
          <Skeleton className="h-5 w-1/3" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
