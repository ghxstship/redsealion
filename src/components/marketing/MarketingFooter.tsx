import Link from 'next/link';

/**
 * MarketingFooter — Shared footer used by both the root landing page
 * and the (marketing) layout to ensure a single source of truth for footer links.
 */
export default function MarketingFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-100 px-6 py-8 sm:px-8 lg:px-16">
      <div className="flex flex-col items-center gap-4 text-sm text-zinc-400 sm:flex-row sm:justify-between">
        <span>&copy; {new Date().getFullYear()} FlyteDeck. All rights reserved.</span>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link href="/features" className="transition-colors hover:text-zinc-600">
            Features
          </Link>
          <Link href="/pricing" className="transition-colors hover:text-zinc-600">
            Pricing
          </Link>
          <Link href="/use-cases" className="transition-colors hover:text-zinc-600">
            Use Cases
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-zinc-600">
            Privacy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-zinc-600">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
