'use client';

/**
 * Global error boundary — catches errors in the root layout itself.
 * This is the last-resort catch-all when even the layout-level error.tsx
 * boundaries cannot render (e.g., Supabase connection failure during SSR).
 *
 * Must be a Client Component. Must accept error + reset props.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          background: '#0a0a0a',
          color: '#fafafa',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 480, padding: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#a1a1aa', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            An unexpected error occurred. Please try refreshing the page.
            {error.digest && (
              <span style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.75rem', color: '#71717a' }}>
                Error ID: {error.digest}
              </span>
            )}
          </p>
          <button
            onClick={reset}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '0.375rem',
              border: '1px solid #27272a',
              background: '#18181b',
              color: '#fafafa',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'background 150ms',
            }}
            onMouseOver={(e) => ((e.target as HTMLElement).style.background = '#27272a')}
            onMouseOut={(e) => ((e.target as HTMLElement).style.background = '#18181b')}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
