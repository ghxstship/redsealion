import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 font-[family-name:var(--font-inter)]">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-foreground/10">404</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">Page not found</h1>
        <p className="mt-2 text-sm text-text-secondary">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/app"
            className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
