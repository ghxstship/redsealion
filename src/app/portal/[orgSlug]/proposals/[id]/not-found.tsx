import Link from 'next/link';

/**
 * GAP-PTL-22: Portal-branded not-found page for proposal sub-pages.
 * Renders a branded message instead of the raw Next.js 404.
 */
export default function ProposalNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-full bg-amber-100 p-4 mb-6">
        <svg
          className="h-8 w-8 text-amber-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>

      <h2 className="text-lg font-semibold text-foreground mb-2">
        Page Not Found
      </h2>
      <p className="text-sm text-text-secondary max-w-sm mb-6">
        This proposal page doesn't exist or you don't have access.
        It may have been removed or your access may have expired.
      </p>

      <Link
        href=".."
        className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-bg-secondary transition-colors"
      >
        &larr; Back to proposals
      </Link>
    </div>
  );
}
