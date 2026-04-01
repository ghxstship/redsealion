import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col font-[family-name:var(--font-inter)]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 lg:px-16">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900">
            <span className="text-sm font-bold text-white">X</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-zinc-900">
            XPB
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/pricing"
            className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
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

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-8 py-24 lg:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-semibold leading-tight tracking-tight text-zinc-900 sm:text-6xl">
            Interactive proposals for experiential production
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-500">
            Build stunning, interactive proposals that win clients. Streamline
            your workflow from concept to signed contract.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Value Props */}
        <div className="mx-auto mt-32 grid max-w-4xl gap-12 sm:grid-cols-3">
          <div>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100">
              <svg
                className="h-5 w-5 text-zinc-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-zinc-900">
              Beautiful Proposals
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              Create polished, interactive proposals with drag-and-drop
              components, rich media, and real-time collaboration.
            </p>
          </div>
          <div>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100">
              <svg
                className="h-5 w-5 text-zinc-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-zinc-900">
              Smart Budgeting
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              Integrated cost tracking, markup calculations, and budget
              summaries that update as you build your proposal.
            </p>
          </div>
          <div>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100">
              <svg
                className="h-5 w-5 text-zinc-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-zinc-900">
              Client Portals
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              Share branded portals where clients can review proposals, leave
              comments, and approve with a single click.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-100 px-8 py-8 lg:px-16">
        <div className="flex items-center justify-between text-sm text-zinc-400">
          <span>&copy; {new Date().getFullYear()} XPB. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="transition-colors hover:text-zinc-600">
              Pricing
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
