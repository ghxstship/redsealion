'use client';

interface SortableHeaderProps {
  label: string;
  field: string;
  currentSort: { field: string; direction: 'asc' | 'desc' } | null;
  onSort: (field: string) => void;
  className?: string;
}

/**
 * Clickable table header with sort direction indicator.
 * Click toggles: none → asc → desc → none
 */
export default function SortableHeader({ label, field, currentSort, onSort, className = '' }: SortableHeaderProps) {
  const isActive = currentSort?.field === field;
  const direction = isActive ? currentSort.direction : null;

  return (
    <button
      onClick={() => onSort(field)}
      className={`group flex items-center gap-1 text-left text-xs font-medium uppercase tracking-wider transition-colors ${
        isActive ? 'text-foreground' : 'text-text-muted hover:text-text-secondary'
      } ${className}`}
    >
      {label}
      <span className={`transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
        {direction === 'asc' ? '↑' : direction === 'desc' ? '↓' : '↕'}
      </span>
    </button>
  );
}
