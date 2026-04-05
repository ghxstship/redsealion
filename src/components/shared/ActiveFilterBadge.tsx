'use client';

interface ActiveFilterBadgeProps {
  count: number;
  onClearAll: () => void;
}

/**
 * Shows a badge indicating how many filters are active,
 * with a "Clear all" button to reset them.
 */
export default function ActiveFilterBadge({ count, onClearAll }: ActiveFilterBadgeProps) {
  if (count === 0) return null;

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-3 py-1">
      <span className="text-xs font-medium text-blue-800">
        {count} filter{count !== 1 ? 's' : ''} active
      </span>
      <button
        onClick={onClearAll}
        className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
      >
        Clear all
      </button>
    </div>
  );
}
