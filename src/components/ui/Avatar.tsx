/**
 * Canonical avatar/initials component — M-11 remediation.
 * Extracts the repeating initials-circle pattern into a shared component.
 */
interface AvatarProps {
  /** Full name to extract initials from. */
  name: string;
  /** Size variant. */
  size?: 'sm' | 'default' | 'lg';
  /** Additional className. */
  className?: string;
}

const SIZE_MAP = {
  sm: 'h-7 w-7 text-[10px]',
  default: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
} as const;

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Avatar({ name, size = 'default', className = '' }: AvatarProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-bg-secondary font-semibold text-text-secondary ${SIZE_MAP[size]} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
