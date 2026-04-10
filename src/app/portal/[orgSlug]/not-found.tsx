import Link from 'next/link';

export default function PortalNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-2xl border border-border bg-background p-10 max-w-md">
        <h2 className="text-4xl font-bold text-foreground">404</h2>
        <p className="mt-3 text-base text-text-secondary">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="./"
            className="rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--org-primary, var(--color-foreground))' }}
          >
            Go to Portal Home
          </Link>
        </div>
      </div>
    </div>
  );
}
