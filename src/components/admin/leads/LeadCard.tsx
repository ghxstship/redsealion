'use client';

import React from 'react';

interface Lead {
  id: string;
  contact_name: string;
  company_name: string | null;
  source: string;
  status: string;
  estimated_budget: number | null;
  created_at: string;
}

interface LeadCardProps {
  lead: Lead;
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  qualified: 'bg-green-100 text-green-800',
  proposal_sent: 'bg-purple-100 text-purple-800',
  won: 'bg-green-200 text-green-900',
  lost: 'bg-red-100 text-red-800',
  archived: 'bg-gray-100 text-gray-800',
};

const SOURCE_COLORS: Record<string, string> = {
  referral: 'bg-bg-tertiary text-foreground',
  website: 'bg-bg-tertiary text-foreground',
  cold_call: 'bg-bg-tertiary text-foreground',
  event: 'bg-bg-tertiary text-foreground',
};

export default function LeadCard({ lead }: LeadCardProps) {
  const statusClass = STATUS_COLORS[lead.status] ?? 'bg-gray-100 text-gray-800';
  const sourceClass = SOURCE_COLORS[lead.source] ?? 'bg-bg-tertiary text-foreground';

  const formatBudget = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="bg-white border border-border rounded-lg shadow-sm p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground truncate">{lead.contact_name}</h3>
          {lead.company_name && (
            <p className="text-xs text-text-secondary truncate">{lead.company_name}</p>
          )}
        </div>
        <span className={`ml-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${statusClass}`}>
          {lead.status.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-block px-2 py-0.5 rounded text-xs ${sourceClass}`}>
          {lead.source.replace(/_/g, ' ')}
        </span>
        {lead.estimated_budget != null && (
          <span className="text-xs text-text-secondary font-medium">
            {formatBudget(lead.estimated_budget)}
          </span>
        )}
      </div>

      <p className="text-xs text-text-muted">{formatDate(lead.created_at)}</p>
    </div>
  );
}
