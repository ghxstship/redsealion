import Link from 'next/link';

const features = [
  {
    category: 'PROPOSALS',
    title: 'Interactive Proposals',
    headline: 'Win more work with proposals clients actually want to read',
    description:
      'Build visually rich, interactive proposals that stand out from static PDFs. Present multiple pricing scenarios, embed media, and let clients explore your creative vision on their own terms.',
    bullets: [
      'Drag-and-drop proposal builder with reusable components',
      'A/B pricing scenarios for flexible budgeting',
      'Client-facing portal with e-signatures and approvals',
      'Real-time collaboration across your team',
    ],
    visual: 'Proposal Builder Preview',
    reverse: false,
  },
  {
    category: 'CRM',
    title: 'Sales Pipeline & CRM',
    headline: 'Track every deal from first conversation to signed contract',
    description:
      'Stop losing deals in email threads. Manage your entire sales process with a visual pipeline built for production companies that juggle multiple opportunities at once.',
    bullets: [
      'Kanban pipeline with customizable deal stages',
      'Full client interaction timeline and activity log',
      'Contact and company management with tagging',
      'Deal probability tracking and revenue forecasting',
    ],
    visual: 'Pipeline Kanban View',
    reverse: true,
  },
  {
    category: 'FINANCE',
    title: 'Invoicing & Payments',
    headline: 'Bill the way production actually works',
    description:
      'Production billing is not like SaaS billing. Handle deposits, balance payments, change orders, and credit notes with invoice workflows designed for how experiential agencies actually get paid.',
    bullets: [
      'Deposit, balance, and change-order invoice types',
      'Recurring billing and credit note management',
      'Payment tracking with automated reminders',
      'Push to QuickBooks or Xero with one click',
    ],
    visual: 'Invoice Dashboard',
    reverse: false,
  },
  {
    category: 'OPERATIONS',
    title: 'Time Tracking & Timesheets',
    headline: 'Know where every hour goes',
    description:
      'Capture time across projects without disrupting your team. Whether your producers prefer timers or weekly timesheets, FlyteDeck adapts to how your team actually works.',
    bullets: [
      'One-click timer with project and task assignment',
      'Weekly timesheet view with manager approvals',
      'Billable vs non-billable hour categorization',
      'Project allocation and utilization reporting',
    ],
    visual: 'Timesheet View',
    reverse: true,
  },
  {
    category: 'OPERATIONS',
    title: 'Resource Scheduling',
    headline: "See your team's capacity at a glance",
    description:
      'Assign the right people to the right projects at the right time. Prevent overallocation and identify availability gaps before they become production bottlenecks.',
    bullets: [
      'Utilization heat maps across your entire team',
      'Drag-and-drop scheduling on a visual timeline',
      'Capacity planning for upcoming projects',
      'Availability calendar with leave and conflict detection',
    ],
    visual: 'Resource Calendar',
    reverse: false,
  },
  {
    category: 'FINANCE',
    title: 'Budgeting & Profitability',
    headline: 'Real-time margins, not month-end surprises',
    description:
      'See exactly where every project stands financially as it happens. Track planned versus actual spend, monitor burn rates, and catch margin erosion before it eats your profit.',
    bullets: [
      'Live burn charts with planned vs actual tracking',
      'Expense categorization and receipt capture',
      'Margin analysis by project, client, and team',
      'Profitability dashboards with drill-down reporting',
    ],
    visual: 'Budget Burn Chart',
    reverse: true,
  },
  {
    category: 'WORKFLOW',
    title: 'Integrations',
    headline: 'Fits into your existing stack',
    description:
      'FlyteDeck connects to the tools your team already uses. Sync data across your CRM, accounting software, project management tools, and communication platforms without manual entry.',
    bullets: [
      'Salesforce and HubSpot CRM sync',
      'QuickBooks and Xero accounting integration',
      'ClickUp, Asana, and Slack connectors',
      'Zapier-compatible webhooks for custom workflows',
    ],
    visual: 'Integration Map',
    reverse: false,
  },
  {
    category: 'AI',
    title: 'AI Assistant',
    headline: 'Your production knowledge base, on demand',
    description:
      'Get instant help drafting proposals, analyzing budgets, and surfacing insights from your project history. Powered by Claude, the AI assistant learns your organization\'s patterns and terminology.',
    bullets: [
      'Proposal drafting assistance from past winning bids',
      'Budget analysis and margin optimization suggestions',
      'Powered by Claude for accurate, contextual responses',
      "Learns your org's naming conventions and workflows",
    ],
    visual: 'AI Chat Interface',
    reverse: true,
  },
];

const useCases = [
  {
    title: 'Brand Activations & Experiential Marketing',
    description:
      'Plan and produce brand activations with tools built for multi-venue, multi-vendor complexity.',
    href: '/use-cases/brand-activations',
    icon: (
      <svg className="h-6 w-6 text-zinc-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
      </svg>
    ),
  },
  {
    title: 'Live Event Production',
    description:
      'Manage budgets, crews, and timelines for concerts, festivals, and live broadcasts.',
    href: '/use-cases/live-events',
    icon: (
      <svg className="h-6 w-6 text-zinc-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
      </svg>
    ),
  },
  {
    title: 'Trade Shows & Exhibitions',
    description:
      'Coordinate booth builds, AV setups, and exhibitor logistics from a single platform.',
    href: '/use-cases/trade-shows',
    icon: (
      <svg className="h-6 w-6 text-zinc-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
      </svg>
    ),
  },
  {
    title: 'Pop-Up Retail & Immersive Experiences',
    description:
      'Build proposals and manage production for pop-ups, installations, and immersive activations.',
    href: '/use-cases/pop-up-experiences',
    icon: (
      <svg className="h-6 w-6 text-zinc-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
      </svg>
    ),
  },
  {
    title: 'Corporate Events & Conferences',
    description:
      'Streamline planning for conferences, galas, and corporate gatherings with end-to-end tooling.',
    href: '/use-cases/corporate-events',
    icon: (
      <svg className="h-6 w-6 text-zinc-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
      </svg>
    ),
  },
];

const testimonials = [
  {
    quote:
      'We were running our entire production company on spreadsheets and email chains. FlyteDeck replaced all of it in a single platform. Our proposal win rate went up 35% in the first quarter.',
    name: 'Sarah Chen',
    title: 'Head of Production',
    company: 'Amplitude Creative',
  },
  {
    quote:
      'The client portal changed how we work with brands. Clients can explore proposals on their own, leave comments inline, and approve with one click. It cut our revision cycles in half.',
    name: 'Marcus Rivera',
    title: 'Executive Producer',
    company: 'Fieldwork Agency',
  },
  {
    quote:
      'For the first time, I can see real-time profitability across every project. The time tracking feeds directly into margin reports. No more waiting until month-end to find out we lost money on a show.',
    name: 'Priya Patel',
    title: 'Operations Director',
    company: 'Nexus Productions',
  },
];

const comparisonRows = [
  'Interactive Proposals',
  'Production Billing',
  'Client Portal',
  'Time Tracking',
  'Resource Scheduling',
  'CRM & Pipeline',
  'Integrations',
];

const comparisonData: Record<string, [boolean, boolean, boolean]> = {
  'Interactive Proposals': [true, false, false],
  'Production Billing': [true, false, false],
  'Client Portal': [true, false, false],
  'Time Tracking': [true, false, true],
  'Resource Scheduling': [true, false, true],
  'CRM & Pipeline': [true, false, false],
  Integrations: [true, false, true],
};

const faqs = [
  {
    question: 'What is experiential proposal software?',
    answer:
      'Experiential proposal software is a specialized tool for creating interactive, visually rich proposals tailored to the production industry. Unlike generic document tools, FlyteDeck lets you build proposals with drag-and-drop components, embed media, present multiple pricing scenarios, and share them through a branded client portal with built-in approvals and e-signatures.',
  },
  {
    question: 'How does FlyteDeck handle production billing?',
    answer:
      'FlyteDeck supports the billing workflows that production companies actually use, including deposit invoices, balance payments, change orders, and credit notes. You can set up recurring billing for retainer clients, track payment status in real time, and push finalized invoices directly to QuickBooks or Xero.',
  },
  {
    question: 'Can I track profitability on brand activations?',
    answer:
      'Yes. FlyteDeck gives you real-time profitability tracking at the project, client, and team level. You can monitor planned versus actual spend with live burn charts, categorize expenses, and drill into margin analysis to understand exactly where your profit is going on every activation.',
  },
  {
    question: 'Does FlyteDeck integrate with QuickBooks and Salesforce?',
    answer:
      'FlyteDeck integrates natively with QuickBooks, Xero, Salesforce, and HubSpot. You can also connect to project management tools like ClickUp and Asana, communication platforms like Slack, and build custom workflows using Zapier-compatible webhooks.',
  },
  {
    question: 'Is FlyteDeck suitable for small production teams?',
    answer:
      'Absolutely. FlyteDeck is designed to scale from small boutique agencies to large production houses. Small teams benefit from having proposals, billing, time tracking, and client management in one place instead of juggling multiple disconnected tools.',
  },
  {
    question: 'How does the client portal work?',
    answer:
      'Each proposal you create in FlyteDeck can be shared via a branded client portal. Clients receive a secure link where they can explore the proposal interactively, leave inline comments, compare pricing scenarios, and approve or request changes. All activity is tracked so your team always knows where things stand.',
  },
  {
    question: 'What makes FlyteDeck different from generic project management tools?',
    answer:
      'Generic PM tools are built for software teams, not production companies. FlyteDeck is purpose-built for experiential production with features like interactive proposals, production-specific billing, client portals, resource scheduling with utilization heat maps, and an AI assistant that understands production terminology and workflows.',
  },
];

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className || 'h-5 w-5 text-zinc-700'}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className || 'h-5 w-5 text-zinc-300'}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col font-[family-name:var(--font-inter)]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-6 sm:px-8 lg:px-16">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900">
            <span className="text-sm font-bold text-white">X</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-zinc-900">
            FlyteDeck
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/features"
            className="hidden text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 sm:inline"
          >
            Features
          </Link>
          <span className="hidden text-sm font-medium text-zinc-500 sm:inline">
            Use Cases
          </span>
          <Link
            href="/pricing"
            className="hidden text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 sm:inline"
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

      <main>
        {/* Hero */}
        <section className="px-6 py-20 sm:px-8 sm:py-28 lg:px-16 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl">
              The operating system for experiential production
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-500">
              From pitch to wrap — build interactive proposals, manage clients,
              track budgets, schedule resources, and run your entire operation in
              one platform built for creative teams.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
              >
                Start Free Trial
              </Link>
              <a
                href="#features"
                className="rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                See It In Action
              </a>
            </div>
            <p className="mt-8 text-sm text-zinc-400">
              Trusted by production teams managing brand activations, live
              events, and immersive experiences worldwide
            </p>
          </div>
        </section>

        {/* Logo Bar */}
        <section className="border-y border-zinc-100 px-6 py-12 sm:px-8 lg:px-16">
          <p className="mb-8 text-center text-xs font-medium uppercase tracking-wider text-zinc-400">
            Trusted by leading brands and agencies
          </p>
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-12 gap-y-6 sm:gap-x-16">
            {['Red Bull', 'Nike', 'Samsung', 'Spotify', 'Coca-Cola', 'Adobe'].map(
              (brand) => (
                <span
                  key={brand}
                  className="text-lg font-semibold tracking-wider text-zinc-300"
                >
                  {brand}
                </span>
              )
            )}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="px-6 py-20 sm:px-8 sm:py-28 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
                Everything your production company needs
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-500">
                Purpose-built tools for experiential agencies, event producers,
                and creative production teams.
              </p>
            </div>

            <div className="space-y-20 lg:space-y-28">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className={`grid items-center gap-12 lg:grid-cols-2 ${
                    feature.reverse ? 'lg:direction-rtl' : ''
                  }`}
                >
                  <div
                    className={`${feature.reverse ? 'lg:order-2' : 'lg:order-1'}`}
                  >
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      {feature.category}
                    </span>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
                      {feature.headline}
                    </h3>
                    <p className="mt-4 leading-relaxed text-zinc-500">
                      {feature.description}
                    </p>
                    <ul className="mt-6 space-y-3">
                      {feature.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-3">
                          <CheckIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-zinc-700" />
                          <span className="text-sm text-zinc-600">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div
                    className={`${feature.reverse ? 'lg:order-1' : 'lg:order-2'}`}
                  >
                    <div className="flex h-64 items-center justify-center rounded-xl bg-zinc-100 sm:h-80">
                      <span className="text-sm font-medium text-zinc-400">
                        {feature.visual}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="bg-zinc-50 px-6 py-20 sm:px-8 sm:py-28 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
                Built for every type of experiential production
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {useCases.map((useCase, index) => (
                <div
                  key={useCase.title}
                  className={`rounded-xl border border-zinc-200 bg-white p-6 transition-colors hover:border-zinc-300 ${
                    index >= 3 ? 'lg:col-span-1 lg:mx-auto lg:w-full' : ''
                  }`}
                  style={
                    index === 3
                      ? { gridColumn: 'auto' }
                      : undefined
                  }
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100">
                    {useCase.icon}
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-900">
                    {useCase.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                    {useCase.description}
                  </p>
                  <Link
                    href={useCase.href}
                    className="mt-4 inline-block text-sm font-medium text-zinc-900 transition-colors hover:text-zinc-600"
                  >
                    Learn more &rarr;
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="px-6 py-20 sm:px-8 sm:py-28 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
                What production teams are saying
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.name}
                  className="rounded-xl border border-zinc-200 p-6"
                >
                  <p className="text-sm italic leading-relaxed text-zinc-600">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <div className="mt-6">
                    <p className="text-sm font-semibold text-zinc-900">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-zinc-400">
                      {testimonial.title}, {testimonial.company}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="bg-zinc-50 px-6 py-20 sm:px-8 sm:py-28 lg:px-16">
          <div className="mx-auto max-w-4xl">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
                Why teams switch to FlyteDeck
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="pb-4 text-left text-sm font-medium text-zinc-400">
                      Feature
                    </th>
                    <th className="pb-4 text-center text-sm font-semibold text-zinc-900">
                      <span className="rounded-lg bg-zinc-900 px-3 py-1 text-white">
                        FlyteDeck
                      </span>
                    </th>
                    <th className="pb-4 text-center text-sm font-medium text-zinc-400">
                      Spreadsheets & Email
                    </th>
                    <th className="pb-4 text-center text-sm font-medium text-zinc-400">
                      Generic PM Tools
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => {
                    const [flyteDeck, spreadsheets, generic] = comparisonData[row];
                    return (
                      <tr key={row} className="border-b border-zinc-100">
                        <td className="py-4 text-sm text-zinc-600">{row}</td>
                        <td className="py-4 text-center">
                          {flyteDeck ? (
                            <CheckIcon className="mx-auto h-5 w-5 text-zinc-900" />
                          ) : (
                            <XIcon className="mx-auto h-5 w-5 text-zinc-300" />
                          )}
                        </td>
                        <td className="py-4 text-center">
                          {spreadsheets ? (
                            <CheckIcon className="mx-auto h-5 w-5 text-zinc-400" />
                          ) : (
                            <XIcon className="mx-auto h-5 w-5 text-zinc-300" />
                          )}
                        </td>
                        <td className="py-4 text-center">
                          {generic ? (
                            <CheckIcon className="mx-auto h-5 w-5 text-zinc-400" />
                          ) : (
                            <XIcon className="mx-auto h-5 w-5 text-zinc-300" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-6 py-20 sm:px-8 sm:py-28 lg:px-16">
          <div className="mx-auto max-w-3xl">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
                Frequently asked questions
              </h2>
            </div>

            <div className="divide-y divide-zinc-200">
              {faqs.map((faq) => (
                <details key={faq.question} className="group py-6" open>
                  <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-zinc-900">
                    {faq.question}
                    <svg
                      className="h-5 w-5 flex-shrink-0 text-zinc-400 transition-transform group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m19.5 8.25-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </summary>
                  <p className="mt-4 text-sm leading-relaxed text-zinc-500">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-zinc-900 px-6 py-20 sm:px-8 sm:py-28 lg:px-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Ready to run your production company from one platform?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-400">
              Join the production teams already using FlyteDeck to win more work,
              deliver on budget, and grow profitably.
            </p>
            <div className="mt-10">
              <Link
                href="/signup"
                className="rounded-lg bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
              >
                Start Free Trial
              </Link>
              <p className="mt-4 text-sm text-zinc-500">
                No credit card required
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-100 px-6 py-8 sm:px-8 lg:px-16">
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-zinc-400 sm:flex-row">
          <span>&copy; {new Date().getFullYear()} FlyteDeck. All rights reserved.</span>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link
              href="/features"
              className="transition-colors hover:text-zinc-600"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="transition-colors hover:text-zinc-600"
            >
              Pricing
            </Link>
            <Link
              href="/use-cases/brand-activations"
              className="transition-colors hover:text-zinc-600"
            >
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
