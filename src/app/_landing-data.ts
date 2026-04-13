/**
 * Marketing page content data.
 *
 * Extracted from page.tsx to maintain the 300-line component limit.
 * Contains features, use cases, testimonials, comparisons, and FAQs.
 *
 * @module app/(marketing)/_data
 */

export const features = [
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
    title: 'Workload Management',
    headline: "See your team's workloads at a glance",
    description:
      'Assign the right people to the right projects at the right time. Prevent overallocation and identify availability gaps before they become production bottlenecks.',
    bullets: [
      'Utilization heat maps across your entire team',
      'Drag-and-drop scheduling on a visual timeline',
      'Workload planning for upcoming projects',
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

export const useCases = [
  { title: 'Brand Activations & Experiential Marketing', description: 'Plan and produce brand activations with tools built for multi-venue, multi-vendor complexity.', href: '/use-cases/brand-activations', iconPath: 'M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z' },
  { title: 'Live Event Production', description: 'Manage budgets, crews, and timelines for concerts, festivals, and live broadcasts.', href: '/use-cases/live-events', iconPath: 'M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6' },
  { title: 'Trade Shows & Exhibitions', description: 'Coordinate booth builds, AV setups, and exhibitor logistics from a single platform.', href: '/use-cases/trade-shows', iconPath: 'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21' },
  { title: 'Pop-Up Retail & Immersive Experiences', description: 'Build proposals and manage production for pop-ups, installations, and immersive activations.', href: '/use-cases/pop-up-experiences', iconPath: 'M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z' },
  { title: 'Corporate Events & Conferences', description: 'Streamline planning for conferences, galas, and corporate gatherings with end-to-end tooling.', href: '/use-cases/corporate-events', iconPath: 'M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z' },
  { title: 'Immersive Experiences', description: 'Produce immersive installations, AR/VR activations, and multi-sensory environments at any scale.', href: '/use-cases/immersive-experiences', iconPath: 'M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25' },
  { title: 'Concerts & Festivals', description: 'Coordinate stages, crew, and vendors for concerts, music festivals, and touring shows.', href: '/use-cases/concerts-festivals', iconPath: 'm9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z' },
  { title: 'Film, TV & Broadcast', description: 'Manage set builds, location logistics, and production budgets for film, television, and broadcast.', href: '/use-cases/film-tv-broadcast', iconPath: 'm15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z' },
  { title: 'Theatrical Productions', description: 'Plan set fabrication, rehearsal schedules, and multi-city touring logistics for stage productions.', href: '/use-cases/theatrical-productions', iconPath: 'M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z' },
];

const testimonials = [
  {
    quote: 'We were running our entire production company on spreadsheets and email chains. FlyteDeck replaced all of it in a single platform. Our proposal win rate went up 35% in the first quarter.',
    name: 'Sarah Chen',
    title: 'Head of Production',
    company: 'Amplitude Creative',
  },
  {
    quote: 'The client portal changed how we work with brands. Clients can explore proposals on their own, leave comments inline, and approve with one click. It cut our revision cycles in half.',
    name: 'Marcus Rivera',
    title: 'Executive Producer',
    company: 'Fieldwork Agency',
  },
  {
    quote: 'For the first time, I can see real-time profitability across every project. The time tracking feeds directly into margin reports. No more waiting until month-end to find out we lost money on a show.',
    name: 'Priya Patel',
    title: 'Operations Director',
    company: 'Nexus Productions',
  },
];

export const comparisonRows = [
  'Interactive Proposals',
  'Production Billing',
  'Client Portal',
  'Time Tracking',
  'Workload Management',
  'CRM & Pipeline',
  'Integrations',
];

export const comparisonData: Record<string, [boolean, boolean, boolean]> = {
  'Interactive Proposals': [true, false, false],
  'Production Billing': [true, false, false],
  'Client Portal': [true, false, false],
  'Time Tracking': [true, false, true],
  'Workload Management': [true, false, true],
  'CRM & Pipeline': [true, false, false],
  Integrations: [true, false, true],
};

export const faqs = [
  {
    question: 'What is experiential proposal software?',
    answer: 'Experiential proposal software is a specialized tool for creating interactive, visually rich proposals tailored to the production industry. Unlike generic document tools, FlyteDeck lets you build proposals with drag-and-drop components, embed media, present multiple pricing scenarios, and share them through a branded client portal with built-in approvals and e-signatures.',
  },
  {
    question: 'How does FlyteDeck handle production billing?',
    answer: 'FlyteDeck supports the billing workflows that production companies actually use, including deposit invoices, balance payments, change orders, and credit notes. You can set up recurring billing for retainer clients, track payment status in real time, and push finalized invoices directly to QuickBooks or Xero.',
  },
  {
    question: 'Can I track profitability on brand activations?',
    answer: 'Yes. FlyteDeck gives you real-time profitability tracking at the project, client, and team level. You can monitor planned versus actual spend with live burn charts, categorize expenses, and drill into margin analysis to understand exactly where your profit is going on every activation.',
  },
  {
    question: 'Does FlyteDeck integrate with QuickBooks and Salesforce?',
    answer: 'FlyteDeck integrates natively with QuickBooks, Xero, Salesforce, and HubSpot. You can also connect to project management tools like ClickUp and Asana, communication platforms like Slack, and build custom workflows using Zapier-compatible webhooks.',
  },
  {
    question: 'Is FlyteDeck suitable for small production teams?',
    answer: 'Absolutely. FlyteDeck is designed to scale from small boutique agencies to large production houses. Small teams benefit from having proposals, billing, time tracking, and client management in one place instead of juggling multiple disconnected tools.',
  },
  {
    question: 'How does the client portal work?',
    answer: 'Each proposal you create in FlyteDeck can be shared via a branded client portal. Clients receive a secure link where they can explore the proposal interactively, leave inline comments, compare pricing scenarios, and approve or request changes. All activity is tracked so your team always knows where things stand.',
  },
  {
    question: 'What makes FlyteDeck different from generic project management tools?',
    answer: 'Generic PM tools are built for software teams, not production companies. FlyteDeck is purpose-built for experiential production with features like interactive proposals, production-specific billing, client portals, workload management with utilization heat maps, and an AI assistant that understands production terminology and workflows.',
  },
];
