'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

interface ClientRow {
  id: string;
  company_name: string;
  industry: string | null;
  tags: string[];
  proposals: number;
  total_value: number;
  last_activity: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ClientsSearch({ clients }: { clients: ClientRow[] }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.company_name.toLowerCase().includes(q) ||
        (c.industry && c.industry.toLowerCase().includes(q)) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [clients, search]);

  return (
    <>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
              {filtered.map((client) => (
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
