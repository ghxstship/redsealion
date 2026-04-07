interface SkeletonProps {
  /** Height class. Default: 'h-48'. */
  height?: string;
  /** Additional className overrides. */
  className?: string;
}

/**
 * Canonical skeleton loader atom.
 * Replaces ad-hoc `animate-pulse` loading placeholders across settings and detail pages.
 */
export default function Skeleton({
  height = 'h-48',
  className = '',
}: SkeletonProps) {
  return (
    <div
      className={`rounded-xl border border-border bg-white animate-pulse ${height} ${className}`}
      aria-hidden="true"
    />
  );
}
