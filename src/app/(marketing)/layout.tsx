import Link from 'next/link';
import JsonLd from '@/components/marketing/JsonLd';

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'FlyteDeck',
  url: 'https://flytedeck.io',
  description:
    'FlyteDeck is the all-in-one platform for experiential production companies. Build interactive proposals, manage clients, track budgets, schedule resources, and run your entire operation — from pitch to wrap.',
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col font-[family-name:var(--font-inter)]">
      <JsonLd data={organizationJsonLd} />

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 lg:px-16">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900">
            <span className="text-xs font-bold text-white">FD</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-zinc-900">
            FlyteDeck
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/features"
            className="hidden text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 sm:block"
          >
            Features
          </Link>
          <Link
            href="/use-cases"
            className="hidden text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 sm:block"
          >
            Use Cases
          </Link>
          <Link
            href="/pricing"
            className="hidden text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 sm:block"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-100 px-8 py-8 lg:px-16">
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
            <a href="#" className="transition-colors hover:text-zinc-600">
              Privacy
            </a>
            <a href="#" className="transition-colors hover:text-zinc-600">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
