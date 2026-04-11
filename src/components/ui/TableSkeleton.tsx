import Skeleton from '@/components/ui/Skeleton';

interface TableSkeletonProps {
  /** Number of rows to render. Default: 6. */
  rows?: number;
  /** Extra className. */
  className?: string;
}

/**
 * Canonical TableSkeleton atom.
 * Replaces 5+ identical loading.tsx skeletons across hub modules.
 */
export default function TableSkeleton({
  rows = 6,
  className = '',
}: TableSkeletonProps) {
  return (
    <div className={`space-y-6 max-w-4xl ${className}`}>
      <Skeleton height="h-32" />
      <Skeleton height="h-[600px]" />
    </div>
  );
}
