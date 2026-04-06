import type { SVGProps } from 'react';

interface IconProps extends SVGProps<SVGSVGElement> {
  /** Pixel size. Defaults to 20. */
  size?: number;
}

/** Canonical close/X icon atom. */
export function IconX({ size = 20, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...rest}>
      <line x1="5" y1="5" x2="15" y2="15" /><line x1="15" y1="5" x2="5" y2="15" />
    </svg>
  );
}

/** Canonical plus icon atom. */
export function IconPlus({ size = 16, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...rest}>
      <line x1="8" y1="3" x2="8" y2="13" /><line x1="3" y1="8" x2="13" y2="8" />
    </svg>
  );
}

/** Canonical trash/delete icon atom. */
export function IconTrash({ size = 14, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...rest}>
      <path d="M2 4h10M5 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M9 4v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4" />
    </svg>
  );
}

/** Canonical download/import icon atom. */
export function IconDownload({ size = 14, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...rest}>
      <path d="M7 2v8M4 7l3 3 3-3M2 12h10" />
    </svg>
  );
}

/** Canonical upload/export icon atom. */
export function IconUpload({ size = 14, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...rest}>
      <path d="M7 10V2M4 5l3-3 3 3M2 12h10" />
    </svg>
  );
}

/** Canonical chevron-down icon atom. */
export function IconChevronDown({ size = 14, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <path d="M3.5 5.25L7 8.75L10.5 5.25" />
    </svg>
  );
}

/** Canonical search icon atom. */
export function IconSearch({ size = 16, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...rest}>
      <circle cx="7" cy="7" r="4.5" /><line x1="10.5" y1="10.5" x2="14" y2="14" />
    </svg>
  );
}
