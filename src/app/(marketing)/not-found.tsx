import Link from 'next/link';

export default function MarketingNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
      <p className="text-6xl font-bold text-zinc-200">404</p>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          Back to Home
        </Link>
        <Link
          href="/features"
          className="rounded-lg border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
        >
          Explore Features
        </Link>
      </div>
    </div>
  );
}
