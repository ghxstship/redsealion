import Link from 'next/link';

const tiers = [
  {
    name: 'Starter',
    price: '$49',
    period: '/mo',
    description: 'For freelancers and small teams getting started.',
    features: [
      'Up to 10 proposals per month',
      '2 team members',
      'Basic templates',
      'Client portal',
      'Email support',
    ],
    cta: 'Get Started',
    href: '/signup',
    featured: false,
  },
  {
    name: 'Professional',
    price: '$149',
    period: '/mo',
    description: 'For growing production companies.',
    features: [
      'Unlimited proposals',
      '10 team members',
      'Custom templates & branding',
      'Advanced budgeting tools',
      'Client portal with comments',
      'Analytics & tracking',
      'Priority support',
    ],
    cta: 'Get Started',
    href: '/signup',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations with complex needs.',
    features: [
      'Everything in Professional',
      'Unlimited team members',
      'SSO & advanced security',
      'Custom integrations',
      'Dedicated account manager',
      'SLA & uptime guarantees',
      'On-boarding & training',
    ],
    cta: 'Contact Sales',
    href: '#',
    featured: false,
  },
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col font-[family-name:var(--font-inter)]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 lg:px-16">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900">
            <span className="text-sm font-bold text-white">X</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-zinc-900">
            XPB
          </span>
        </Link>
        <div className="flex items-center gap-4">
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

      {/* Header */}
      <div className="px-8 py-20 text-center lg:px-16">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-lg text-zinc-500">
          Choose the plan that fits your team. Upgrade or downgrade at any time.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto grid w-full max-w-5xl gap-6 px-8 pb-24 lg:grid-cols-3 lg:px-16">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`flex flex-col rounded-2xl border p-8 ${
              tier.featured
                ? 'border-zinc-900 bg-zinc-900 text-white shadow-xl'
                : 'border-zinc-200 bg-white'
            }`}
          >
            <div className="mb-6">
              <h3
                className={`text-sm font-semibold uppercase tracking-wider ${
                  tier.featured ? 'text-zinc-300' : 'text-zinc-500'
                }`}
              >
                {tier.name}
              </h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span
                  className={`text-4xl font-semibold tracking-tight ${
                    tier.featured ? 'text-white' : 'text-zinc-900'
                  }`}
                >
                  {tier.price}
                </span>
                {tier.period && (
                  <span
                    className={`text-sm ${tier.featured ? 'text-zinc-400' : 'text-zinc-500'}`}
                  >
                    {tier.period}
                  </span>
                )}
              </div>
              <p
                className={`mt-3 text-sm ${tier.featured ? 'text-zinc-400' : 'text-zinc-500'}`}
              >
                {tier.description}
              </p>
            </div>

            <ul className="mb-8 flex-1 space-y-3">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <svg
                    className={`mt-0.5 h-4 w-4 shrink-0 ${
                      tier.featured ? 'text-zinc-400' : 'text-zinc-400'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                  <span
                    className={`text-sm ${tier.featured ? 'text-zinc-300' : 'text-zinc-600'}`}
                  >
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href={tier.href}
              className={`block rounded-lg px-4 py-2.5 text-center text-sm font-medium transition-colors ${
                tier.featured
                  ? 'bg-white text-zinc-900 hover:bg-zinc-100'
                  : 'bg-zinc-900 text-white hover:bg-zinc-800'
              }`}
            >
              {tier.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-100 px-8 py-8 lg:px-16">
        <div className="flex items-center justify-between text-sm text-zinc-400">
          <span>&copy; {new Date().getFullYear()} XPB. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <Link href="/" className="transition-colors hover:text-zinc-600">
              Home
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
