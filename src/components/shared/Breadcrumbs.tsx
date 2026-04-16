'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ChevronRight } from 'lucide-react';
import { SEGMENT_LABELS } from '@/config/route-labels';

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
        <Home size={16} className="shrink-0" />
      </Link>
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.href} className="flex items-center gap-2">
            <ChevronRight size={12} />
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
