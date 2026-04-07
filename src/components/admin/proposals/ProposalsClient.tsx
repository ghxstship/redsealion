'use client';

import { useState, useMemo, useCallback } from 'react';
import ProposalCard from '@/components/admin/ProposalCard';
import ProposalFilters, { type FilterValues } from '@/components/admin/ProposalFilters';
import PageHeader from '@/components/shared/PageHeader';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import type { Proposal, Client, ProposalStatus } from '@/types/database';
import { IconPlus } from '@/components/ui/Icons';

type Tab = 'all' | 'active' | 'pipeline' | 'archive';

const TAB_STATUSES: Record<Tab, ProposalStatus[] | null> = {
  all: null,
  active: ['approved', 'in_production', 'active'],
  pipeline: ['draft', 'sent', 'viewed', 'negotiating'],
  archive: ['complete', 'cancelled'],
};

const tabs: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'archive', label: 'Archive' },
];

export default function ProposalsClient({
  proposals,
  clients,
}: {
  proposals: Proposal[];
  clients: Client[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [filters, setFilters] = useState<FilterValues>({
    status: 'all',
    search: '',
    sort: 'date',
  });

  const clientName = useCallback(
    (clientId: string): string =>
      clients.find((c) => c.id === clientId)?.company_name ?? 'Unknown',
    [clients],
  );

  const filtered = useMemo(() => {
    let result = [...proposals];

    const tabStatuses = TAB_STATUSES[activeTab];
    if (tabStatuses) {
      result = result.filter((p) => tabStatuses.includes(p.status));
    }

    if (filters.status !== 'all') {
      result = result.filter((p) => p.status === filters.status);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          clientName(p.client_id).toLowerCase().includes(q),
      );
    }

    switch (filters.sort) {
      case 'date':
        result.sort(
          (a, b) =>
            new Date(b.prepared_date ?? b.created_at).getTime() -
            new Date(a.prepared_date ?? a.created_at).getTime(),
        );
        break;
      case 'value':
        result.sort((a, b) => b.total_value - a.total_value);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [activeTab, filters, proposals, clientName]);

  const totalPipelineValue = useMemo(
    () => filtered.reduce((sum, p) => sum + p.total_value, 0),
    [filtered],
  );

  return (
    <>
      <PageHeader
        title="Proposals"
        subtitle={`${filtered.length} proposal${filtered.length !== 1 ? 's' : ''} \u00B7 ${formatCurrency(totalPipelineValue)} total value`}
      >
        <Button href="/app/proposals/new">
          <IconPlus size={20} />
          New Proposal
        </Button>
      </PageHeader>

      <div className="mb-6 border-b border-border">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.key
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-text-muted hover:text-text-secondary hover:border-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mb-6">
        <ProposalFilters onFilterChange={setFilters} />
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProposalCard
              key={p.id}
              id={p.id}
              name={p.name}
              subtitle={p.subtitle}
              clientName={clientName(p.client_id)}
              status={p.status}
              totalValue={p.total_value}
              preparedDate={p.prepared_date}
              probability={p.probability_percent}
              currency={p.currency}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <p className="text-sm text-text-muted">No proposals match your filters.</p>
          <button
            onClick={() => {
              setActiveTab('all');
              setFilters({ status: 'all', search: '', sort: 'date' });
            }}
            className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Clear filters
          </button>
        </div>
      )}
    </>
  );
}
