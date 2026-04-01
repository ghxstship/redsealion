import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

const clients = [
  {
    id: 'client_001',
    company_name: 'Nike',
    industry: 'Sportswear & Apparel',
    tags: ['enterprise', 'repeat'],
    proposals: 2,
    total_value: 610000,
    last_activity: '2026-03-28T00:00:00Z',
  },
  {
    id: 'client_002',
    company_name: 'Spotify',
    industry: 'Music & Entertainment',
    tags: ['enterprise', 'tech'],
    proposals: 2,
    total_value: 415000,
    last_activity: '2026-03-15T00:00:00Z',
  },
  {
    id: 'client_003',
    company_name: 'Mercedes-Benz',
    industry: 'Automotive',
    tags: ['enterprise', 'luxury'],
    proposals: 1,
    total_value: 485000,
    last_activity: '2026-03-05T00:00:00Z',
  },
  {
    id: 'client_004',
    company_name: 'Apple',
    industry: 'Technology',
    tags: ['enterprise', 'tech', 'repeat'],
    proposals: 1,
    total_value: 275000,
    last_activity: '2026-03-25T00:00:00Z',
  },
  {
    id: 'client_005',
    company_name: 'Red Bull',
    industry: 'Beverages & Lifestyle',
    tags: ['mid-market', 'sports'],
    proposals: 0,
    total_value: 0,
    last_activity: '2026-02-10T00:00:00Z',
  },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ClientsPage() {
  const totalValue = clients.reduce((sum, c) => sum + c.total_value, 0);

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Clients
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {clients.length} clients &middot; {formatCurrency(totalValue)} total pipeline
          </p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-foreground/90">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="8" y1="2" x2="8" y2="14" />
            <line x1="2" y1="8" x2="14" y2="8" />
          </svg>
          Add Client
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search clients..."
          className="w-full max-w-sm rounded-lg border border-border bg-white px-4 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-secondary">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                  Industry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                  Tags
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">
                  Proposals
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">
                  Total Value
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">
                  Last Activity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clients.map((client) => (
                <tr
                  key={client.id}
                  className="transition-colors hover:bg-bg-secondary/50"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/app/clients/${client.id}`}
                      className="text-sm font-medium text-foreground hover:underline"
                    >
                      {client.company_name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {client.industry}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {client.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-bg-secondary px-2.5 py-0.5 text-xs font-medium text-text-secondary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm tabular-nums text-foreground">
                    {client.proposals}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium tabular-nums text-foreground">
                    {formatCurrency(client.total_value)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-text-muted">
                    {formatDate(client.last_activity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
