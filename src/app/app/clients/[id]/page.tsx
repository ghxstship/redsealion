import Link from 'next/link';
import { formatCurrency, statusColor } from '@/lib/utils';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import ClientInteractions from '@/components/admin/clients/ClientInteractions';
import { getClient, formatStatus, formatDate, roleLabel } from './_data';


export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);

  return (
    <>
      <Breadcrumbs currentLabel={client.company_name} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {client.company_name}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {client.industry} &middot; Source: {client.source ?? 'Unknown'}
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
        <div className="flex items-center gap-3 shrink-0">
          <button className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary">
            Edit Client
          </button>
          <Link
            href="/app/proposals/new"
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-foreground/90"
          >
            New Proposal
          </Link>
        </div>
      </div>

      <div className="space-y-8">
        {/* CRM Info */}
        {(client.website || client.annual_revenue || client.employee_count) && (
          <div className="rounded-xl border border-border bg-white p-6">
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

        {/* Contacts */}
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Contacts</h2>
            <button className="text-xs font-medium text-text-muted hover:text-foreground transition-colors">
              + Add Contact
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-secondary">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {client.contacts.map((contact) => (
                  <tr key={contact.id} className="transition-colors hover:bg-bg-secondary/50">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{contact.name}</span>
                        {contact.is_decision_maker && (
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                            Decision Maker
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-text-secondary">{contact.title}</td>
                    <td className="px-6 py-3.5 text-sm text-text-secondary">{contact.email}</td>
                    <td className="px-6 py-3.5 text-sm text-text-secondary">{contact.phone}</td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center rounded-full bg-bg-secondary px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                        {roleLabel(contact.role)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Proposals */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-4">Proposals</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {client.proposals.map((proposal) => (
              <Link
                key={proposal.id}
                href={`/app/proposals/${proposal.id}`}
                className="block rounded-xl border border-border bg-white px-6 py-5 transition-colors hover:border-foreground/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {proposal.name}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      Prepared {formatDate(proposal.prepared_date)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(proposal.status)}`}
                  >
                    {formatStatus(proposal.status)}
                  </span>
                </div>
                <p className="mt-3 text-lg font-semibold tabular-nums text-foreground">
                  {formatCurrency(proposal.total_value)}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Deals */}
        {client.deals.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-4">Deals</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {client.deals.map((deal) => (
                <Link
                  key={deal.id}
                  href={`/app/pipeline/${deal.id}`}
                  className="block rounded-xl border border-border bg-white px-6 py-5 transition-colors hover:border-foreground/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-foreground truncate">
                      {deal.title}
                    </p>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(deal.stage)}`}
                    >
                      {formatStatus(deal.stage)}
                    </span>
                  </div>
                  <p className="mt-2 text-lg font-semibold tabular-nums text-foreground">
                    {formatCurrency(deal.value)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Interactions */}
        <ClientInteractions interactions={client.interactions} />

        {/* Activity Timeline */}
        {client.activity.length > 0 && (
          <div className="rounded-xl border border-border bg-white px-6 py-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Activity</h2>
            <div className="space-y-0">
              {client.activity.map((event, index) => (
                <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {index < client.activity.length - 1 && (
                    <div className="absolute left-[7px] top-5 bottom-0 w-px bg-border" />
                  )}
                  <div className="relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-border bg-white" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{event.action}</p>
                    <p className="text-xs text-text-muted mt-0.5">{event.detail}</p>
                    <p className="text-xs text-text-muted mt-1">{formatDate(event.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
