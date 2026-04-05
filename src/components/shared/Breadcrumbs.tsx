'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/* ─────────────────────────────────────────────────────────
   Route label registry — human-readable names for path
   segments that aren't self-explanatory.
   ───────────────────────────────────────────────────────── */

const SEGMENT_LABELS: Record<string, string> = {
  app: 'Home',
  ai: 'AI Assistant',
  'api-keys': 'API Keys & Webhooks',
  'automations-config': 'Automations Config',
  'calendar-sync': 'Calendar Sync',
  'credit-notes': 'Credit Notes',
  'custom-fields': 'Custom Fields',
  'data-privacy': 'Data & Privacy',
  'document-defaults': 'Document Defaults',
  'email-templates': 'Email Templates',
  'org-chart': 'Org Chart',
  'payment-terms': 'Payment Terms',
  'revenue-recognition': 'Revenue Recognition',
  'time-off': 'Time Off',
  'win-rate': 'Win Rate',
  builder: 'Builder',
  board: 'Board',
  gantt: 'Gantt',
  capacity: 'Capacity',
  schedule: 'Schedule',
  availability: 'Availability',
  onboarding: 'Onboarding',
  maintenance: 'Maintenance',
  bundles: 'Bundles',
  packing: 'Packing',
  scan: 'Scan',
  transfers: 'Transfers',
  timer: 'Timer',
  timesheets: 'Timesheets',
  pipeline: 'Pipeline',
  recurring: 'Recurring',
  new: 'New',
  export: 'Export',
  scenarios: 'Scenarios',
  forms: 'Lead Forms',
  revenue: 'Revenue',
  profitability: 'Profitability',
};

/* ─────────────────────────────────────────────────────────
   Breadcrumb Component
   ───────────────────────────────────────────────────────── */

interface BreadcrumbSegment {
  label: string;
  href: string;
}

function humanize(segment: string): string {
  // Check registry first
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  // Fallback: capitalize and convert hyphens to spaces
  return segment
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

function isIdLike(s: string): boolean {
  // UUIDs, or prefixed IDs like crew_001, deal_abc123, etc.
  return isUuid(s) || /^[a-z]+_[a-z0-9]+$/i.test(s);
}

interface BreadcrumbsProps {
  /** Optional override for the final label (e.g., entity name like "Acme Corp") */
  currentLabel?: string;
}

export default function Breadcrumbs({ currentLabel }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Split pathname into segments, filter empties
  const segments = pathname.split('/').filter(Boolean);

  // Build breadcrumb chain — skip the first segment if it's "app" (becomes "Home" root)
  const crumbs: BreadcrumbSegment[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const href = '/' + segments.slice(0, i + 1).join('/');

    // First segment (app) is always "Home" linking to dashboard
    if (i === 0 && segment === 'app') {
      continue; // skip — we don't show "Home" unless we're deeper than the dashboard
    }

    let label = humanize(segment);

    // If this is an ID-like segment, use generic "Detail" or the override
    if (isIdLike(segment)) {
      label = i === segments.length - 1 && currentLabel ? currentLabel : 'Detail';
    }

    // If this is the last segment and we have a custom label, use it
    if (i === segments.length - 1 && currentLabel && !isIdLike(segment)) {
      label = currentLabel;
    }

    crumbs.push({ label, href });
  }

  // If no crumbs (dashboard root), show a single "Dashboard" label
  if (crumbs.length === 0) {
    crumbs.push({ label: 'Dashboard', href: '/app' });
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
      <Link
        href="/app"
        className="text-text-muted hover:text-foreground transition-colors duration-fast"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
        >
          <path d="M2 6l6-4.5L14 6v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6Z" />
          <path d="M6 14V9h4v5" />
        </svg>
      </Link>
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.href} className="flex items-center gap-2">
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M4.5 2.5l3 3.5-3 3.5" />
            </svg>
            {isLast ? (
              <span className="text-foreground font-medium truncate max-w-[200px]">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-text-muted hover:text-foreground transition-colors duration-fast truncate max-w-[160px]"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
