import { type ClassValue, clsx } from '@/lib/clsx';

// Lightweight clsx — we don't need the full library
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyDetailed(amount: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

/** Generate a cryptographically secure random token (48 alphanumeric characters). */
export function generateToken(): string {
  const bytes = new Uint8Array(36);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 48);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export function relativeTime(date: string | Date, locale = 'en-US'): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(locale);
}

/** Converts snake_case strings to Title Case (e.g. 'in_progress' → 'In Progress'). */
export function formatLabel(s: string): string {
  return s
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Format a date string to a human-readable short format (e.g. 'Apr 5, 2026'). */
export function formatDate(dateStr: string, locale = 'en-US'): string {
  const d = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-50 text-blue-700',
    viewed: 'bg-indigo-50 text-indigo-700',
    negotiating: 'bg-yellow-50 text-yellow-700',
    approved: 'bg-green-50 text-green-700',
    in_production: 'bg-orange-50 text-orange-700',
    active: 'bg-emerald-50 text-emerald-700',
    complete: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-50 text-red-700',
    not_started: 'bg-gray-100 text-gray-600',
    in_progress: 'bg-blue-50 text-blue-700',
    pending_approval: 'bg-amber-50 text-amber-700',
    pending: 'bg-gray-100 text-gray-600',
    skipped: 'bg-gray-50 text-gray-400',
    overdue: 'bg-red-50 text-red-700',
    paid: 'bg-green-50 text-green-700',
    void: 'bg-gray-100 text-gray-400',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}
