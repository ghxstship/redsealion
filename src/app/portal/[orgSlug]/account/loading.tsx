import Skeleton from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="space-y-6 max-w-4xl">
      <Skeleton height="h-32" />
      <Skeleton height="h-[600px]" />
    </div>
  );
}
