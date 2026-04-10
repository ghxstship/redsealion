import { formatDate } from '@/lib/utils';

interface RowDateProps {
  /** ISO date string or Date object. */
  date?: string | Date | null;
  /** Optional fallback text when date is missing. */
  fallback?: string;
  /** Additional className. */
  className?: string;
}

/**
 * Canonical RowDate atom.
 * Renders a formatted date string for use in table cells and list rows.
 */
export default function RowDate({ date, fallback = '—', className = '' }: RowDateProps) {
  if (!date) return <span className={`text-text-muted ${className}`}>{fallback}</span>;
  const dateStr = typeof date === 'string' ? date : date.toISOString();
  return <span className={`text-sm tabular-nums ${className}`}>{formatDate(dateStr)}</span>;
}
