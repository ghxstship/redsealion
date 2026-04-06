'use client';

import React from 'react';
import StatusBadge, { LEAD_STATUS_COLORS_DENSE } from '@/components/ui/StatusBadge';

interface Lead {
  id: string;
  contact_first_name: string;
  contact_last_name: string;
  company_name: string | null;
  source: string;
  status: string;
  estimated_budget: number | null;
  created_at: string;
}

interface LeadCardProps {
  lead: Lead;
}



const SOURCE_COLORS: Record<string, string> = {
  referral: 'bg-bg-tertiary text-foreground',
  website: 'bg-bg-tertiary text-foreground',
  cold_call: 'bg-bg-tertiary text-foreground',
  event: 'bg-bg-tertiary text-foreground',
};

export default function LeadCard({ lead }: LeadCardProps) {

  const sourceClass = SOURCE_COLORS[lead.source] ?? 'bg-bg-tertiary text-foreground';

  const formatBudget = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="bg-white border border-border rounded-lg shadow-sm p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground truncate">{lead.contact_first_name} {lead.contact_last_name}</h3>
          {lead.company_name && (
            <p className="text-xs text-text-secondary truncate">{lead.company_name}</p>
          )}
        </div>
        <StatusBadge status={lead.status} colorMap={LEAD_STATUS_COLORS_DENSE} className="ml-2" />
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
