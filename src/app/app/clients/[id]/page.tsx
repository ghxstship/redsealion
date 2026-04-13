import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import ClientInteractions from '@/components/admin/clients/ClientInteractions';
import ClientHealthCard from '@/components/admin/clients/ClientHealthCard';
import ClientDetailActions from './ClientDetailActions';
import ClientDetailTabs from './ClientDetailTabs';
import EmptyState from '@/components/ui/EmptyState';
import { getClient, formatDate, roleLabel } from './_data';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge, { GENERIC_STATUS_COLORS, PIPELINE_STAGE_COLORS } from '@/components/ui/StatusBadge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';



import { RoleGate } from '@/components/shared/RoleGate';
export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);

  const now = Date.now();

  /* ── Pre-render each tab panel as RSC content ── */

  const overviewContent = (
    <div className="space-y-8">
      <ClientHealthCard
        recentInteractions={client.interactions.filter((i) => {
          const d = now - new Date(i.occurred_at).getTime();
          return d < 90 * 24 * 60 * 60 * 1000;
        }).length}
        lastInteractionDate={client.interactions[0]?.occurred_at ?? null}
        activeDeals={client.deals.filter((d) => d.stage !== 'contract_signed' && d.stage !== 'lost').length}
        wonDeals={client.deals.filter((d) => d.stage === 'contract_signed').length}
        lostDeals={client.deals.filter((d) => d.stage === 'lost').length}
        totalRevenue={client.proposals.filter((p) => p.status === 'complete' || p.status === 'approved').reduce((s, p) => s + p.total_value, 0)}
        contactCount={client.contacts.length}
        hasDecisionMaker={client.contacts.some((c) => c.is_decision_maker)}
        proposalCount={client.proposals.length}
        activeProposals={client.proposals.filter((p) => ['approved', 'in_production', 'active'].includes(p.status)).length}
      />
      {(client.website || client.annual_revenue || client.employee_count) && (
        <div className="rounded-xl border border-border bg-background p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Company Info</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {client.website && (
              <div>
                <p className="text-xs text-text-muted">Website</p>
                <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate block">{client.website}</a>
              </div>
            )}
            {client.linkedin && (
              <div>
                <p className="text-xs text-text-muted">LinkedIn</p>
                <a href={client.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate block">Profile</a>
              </div>
            )}
            {client.annual_revenue != null && (
              <div>
                <p className="text-xs text-text-muted">Annual Revenue</p>
                <p className="text-sm font-medium text-foreground">{formatCurrency(client.annual_revenue)}</p>
              </div>
            )}
            {client.employee_count != null && (
              <div>
                <p className="text-xs text-text-muted">Employees</p>
                <p className="text-sm font-medium text-foreground">{client.employee_count.toLocaleString()}</p>
              </div>
            )}
          </div>
          {client.notes && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-text-muted mb-1">Notes</p>
              <p className="text-sm text-text-secondary">{client.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const contactsContent = (
    <div className="rounded-xl border border-border bg-background overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Contacts</h2>
      </div>
      <div className="overflow-x-auto">
        <Table >
          <TableHeader>
            <TableRow className="border-b border-border bg-bg-secondary">
              <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Name</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Title</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Email</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Phone</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody >
            {client.contacts.map((contact) => (
              <TableRow key={contact.id} className="transition-colors hover:bg-bg-secondary/50">
                <TableCell className="px-6 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{contact.name}</span>
                    {contact.is_decision_maker && (
                      <StatusBadge status="overdue" colorMap={{overdue: 'bg-amber-50 text-amber-700'}} />
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-3.5 text-sm text-text-secondary">{contact.title}</TableCell>
                <TableCell className="px-6 py-3.5 text-sm text-text-secondary">{contact.email}</TableCell>
                <TableCell className="px-6 py-3.5 text-sm text-text-secondary">{contact.phone}</TableCell>
                <TableCell className="px-6 py-3.5">
                  <Badge variant="muted">
                    {roleLabel(contact.role)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  const proposalsContent = (
    <div className="space-y-8">
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-4">Proposals</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {client.proposals.map((proposal) => (
            <Link
              key={proposal.id}
              href={`/app/proposals/${proposal.id}`}
              className="block rounded-xl border border-border bg-background px-6 py-5 transition-colors hover:border-foreground/20"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{proposal.name}</p>
                  <p className="mt-1 text-xs text-text-muted">Prepared {formatDate(proposal.prepared_date)}</p>
                </div>
                <StatusBadge status={proposal.status} colorMap={GENERIC_STATUS_COLORS} />
              </div>
              <p className="mt-3 text-lg font-semibold tabular-nums text-foreground">{formatCurrency(proposal.total_value)}</p>
            </Link>
          ))}
          {client.proposals.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-background px-6 py-12 text-center col-span-2">
              <p className="text-sm text-text-muted">No proposals yet.</p>
            </div>
          )}
        </div>
      </div>

      {client.deals.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-4">Deals</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {client.deals.map((deal) => (
              <Link
                key={deal.id}
                href={`/app/pipeline/${deal.id}`}
                className="block rounded-xl border border-border bg-background px-6 py-5 transition-colors hover:border-foreground/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-foreground truncate">{deal.title}</p>
                  <StatusBadge status={deal.stage} colorMap={PIPELINE_STAGE_COLORS} />
                </div>
                <p className="mt-2 text-lg font-semibold tabular-nums text-foreground">{formatCurrency(deal.value)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const interactionsContent = <ClientInteractions interactions={client.interactions} />;

  const activityContent = client.activity.length > 0 ? (
    <div className="rounded-xl border border-border bg-background px-6 py-5">
      <h2 className="text-sm font-semibold text-foreground mb-4">Activity</h2>
      <div className="space-y-0">
        {client.activity.map((event, index) => (
          <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
            {index < client.activity.length - 1 && (
              <div className="absolute left-[7px] top-5 bottom-0 w-px bg-border" />
            )}
            <div className="relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-border bg-background" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{event.action}</p>
              <p className="text-xs text-text-muted mt-0.5">{event.detail}</p>
              <p className="text-xs text-text-muted mt-1">{formatDate(event.date)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : (
    <EmptyState message="No activity recorded yet" />
  );

  return (
    <RoleGate resource="clients">
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
<PageHeader title={client.company_name} />
          <p className="mt-1 text-sm text-text-secondary">
            {client.industry} &middot; Source: {client.source ?? 'Unknown'}
            <StatusBadge
              status={client.status}
              colorMap={{ active: 'bg-green-500/10 text-green-600', churned: 'bg-red-500/10 text-red-600', inactive: 'bg-bg-secondary text-text-muted' }}
            />
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {client.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-bg-secondary px-3 py-1 text-xs font-medium text-text-secondary"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <ClientDetailActions
          clientId={id}
          clientName={client.company_name}
          clientData={{
            company_name: client.company_name,
            industry: client.industry,
            website: client.website,
            linkedin: client.linkedin,
            source: client.source,
            notes: client.notes,
            annual_revenue: client.annual_revenue,
            employee_count: client.employee_count,
            status: client.status,
          }}
        />
      </div>

      <ClientDetailTabs
        contactCount={client.contacts.length}
        proposalCount={client.proposals.length}
        dealCount={client.deals.length}
        interactionCount={client.interactions.length}
        activityCount={client.activity.length}
        overviewContent={overviewContent}
        contactsContent={contactsContent}
        proposalsContent={proposalsContent}
        interactionsContent={interactionsContent}
        activityContent={activityContent}
      />
    </>
  </RoleGate>
  );
}
