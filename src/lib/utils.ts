import { type ClassValue, clsx } from '@/lib/clsx';

// Lightweight clsx — we don't need the full library
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyDetailed(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
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

export function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 48; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export function relativeTime(date: string | Date): string {
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
  return d.toLocaleDateString();
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
