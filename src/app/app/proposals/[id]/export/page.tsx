'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import ExportCard from '@/components/admin/export/ExportCard';
import ExportPreview from '@/components/admin/export/ExportPreview';

type ExportTab =
  | 'document'
  | 'crm'
  | 'finance'
  | 'pm'
  | 'assets'
  | 'resources'
  | 'csv';

const tabs: { key: ExportTab; label: string }[] = [
  { key: 'document', label: 'Document' },
  { key: 'crm', label: 'CRM' },
  { key: 'finance', label: 'Finance' },
  { key: 'pm', label: 'PM' },
  { key: 'assets', label: 'Assets' },
  { key: 'resources', label: 'Resources' },
  { key: 'csv', label: 'CSV Pack' },
];

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_PROPOSAL = {
  name: 'Meridian Summer Activation 2026',
  client: 'Lumen Athletics',
  totalValue: 184500,
  currency: 'USD',
};

const salesforcePreview = {
  Opportunity: {
    Name: MOCK_PROPOSAL.name,
    AccountId: '001Dn00000Hk4qLIAR',
    Amount: MOCK_PROPOSAL.totalValue,
    StageName: 'Proposal/Price Quote',
    CloseDate: '2026-05-15',
    Type: 'New Business',
    Description: 'Multi-venue experiential activation',
    CurrencyIsoCode: 'USD',
  },
  OpportunityLineItems: [
    { Name: 'Phase 1 — Discovery & Design', UnitPrice: 28500, Quantity: 1 },
    { Name: 'Phase 2 — Fabrication', UnitPrice: 72000, Quantity: 1 },
    { Name: 'Phase 3 — Activation', UnitPrice: 54000, Quantity: 1 },
    { Name: 'Phase 4 — Strike & Wrap', UnitPrice: 30000, Quantity: 1 },
  ],
};

const hubspotPreview = {
  deal: {
    dealname: MOCK_PROPOSAL.name,
    amount: MOCK_PROPOSAL.totalValue,
    pipeline: 'default',
    dealstage: 'presentationscheduled',
    closedate: '2026-05-15T00:00:00.000Z',
    deal_currency_code: 'USD',
  },
  associations: {
    company: { id: '14872903' },
    contact: { id: '22948012' },
  },
};

const pipedrivePreview = {
  deal: {
    title: MOCK_PROPOSAL.name,
    value: MOCK_PROPOSAL.totalValue,
    currency: 'USD',
    stage_id: 3,
    org_id: 1284,
    person_id: 5723,
    expected_close_date: '2026-05-15',
    visible_to: 3,
  },
};

const quickbooksPreview = {
  Invoice: {
    CustomerRef: { name: 'Lumen Athletics', value: '142' },
    TxnDate: '2026-04-01',
    DueDate: '2026-04-30',
    Line: [
      {
        Description: 'Deposit — Phase 1 Discovery & Design',
        Amount: 14250,
        DetailType: 'SalesItemLineDetail',
      },
      {
        Description: 'Deposit — Phase 2 Fabrication',
        Amount: 36000,
        DetailType: 'SalesItemLineDetail',
      },
    ],
    TotalAmt: 50250,
    CurrencyRef: { value: 'USD' },
  },
};

const xeroPreview = {
  Type: 'ACCREC',
  Contact: { Name: 'Lumen Athletics' },
  Date: '2026-04-01',
  DueDate: '2026-04-30',
  LineItems: [
    { Description: 'Phase 1 — Discovery & Design (50% deposit)', Quantity: 1, UnitAmount: 14250 },
    { Description: 'Phase 2 — Fabrication (50% deposit)', Quantity: 1, UnitAmount: 36000 },
  ],
  CurrencyCode: 'USD',
  Status: 'DRAFT',
};

const freshbooksPreview = {
  invoice: {
    customerid: 94812,
    create_date: '2026-04-01',
    due_date: '2026-04-30',
    lines: [
      { name: 'Phase 1 — Discovery & Design (Deposit)', amount: { amount: '14250.00', code: 'USD' }, qty: 1 },
      { name: 'Phase 2 — Fabrication (Deposit)', amount: { amount: '36000.00', code: 'USD' }, qty: 1 },
    ],
    currency_code: 'USD',
  },
};

const clickupPreview = {
  list: { name: 'Meridian Summer Activation 2026' },
  tasks: [
    {
      name: 'Phase 1 — Discovery & Design',
      subtasks: [
        'Site survey — Venue A',
        'Site survey — Venue B',
        'Creative brief development',
        'Design concepts x3',
        'Client review & revisions',
      ],
    },
    {
      name: 'Phase 2 — Fabrication',
      subtasks: [
        'Material procurement',
        'CNC routing — structural panels',
        'LED integration',
        'QA & testing',
        'Crating & logistics',
      ],
    },
    {
      name: 'Phase 3 — Activation',
      subtasks: [
        'Load-in — Venue A',
        'Load-in — Venue B',
        'Tech rehearsal',
        'Live activation support',
        'Daily status reports',
      ],
    },
    {
      name: 'Phase 4 — Strike & Wrap',
      subtasks: [
        'Strike — Venue B',
        'Strike — Venue A',
        'Asset return & inventory',
        'Post-event report',
        'Final invoicing',
      ],
    },
  ],
};

const asanaPreview = {
  project: { name: 'Meridian Summer Activation 2026' },
  sections: clickupPreview.tasks.map((t) => ({
    name: t.name,
    tasks: t.subtasks.map((s) => ({ name: s })),
  })),
};

const mondayPreview = {
  board: { name: 'Meridian Summer Activation 2026' },
  groups: clickupPreview.tasks.map((t) => ({
    title: t.name,
    items: t.subtasks.map((s) => ({ name: s, status: 'Not Started' })),
  })),
};

const invoiceSchedule = [
  {
    type: 'Deposit',
    description: 'Phase 1 & 2 — 50% deposit',
    date: '2026-04-01',
    amount: 50250,
    status: 'Draft',
  },
  {
    type: 'Balance',
    description: 'Phase 1 — balance due on milestone approval',
    date: '2026-04-20',
    amount: 14250,
    status: 'Scheduled',
  },
  {
    type: 'Balance',
    description: 'Phase 2 — balance due on fabrication complete',
    date: '2026-05-10',
    amount: 36000,
    status: 'Scheduled',
  },
  {
    type: 'Deposit',
    description: 'Phase 3 & 4 — 50% deposit',
    date: '2026-05-01',
    amount: 42000,
    status: 'Scheduled',
  },
  {
    type: 'Balance',
    description: 'Phase 3 — balance due post-activation',
    date: '2026-06-01',
    amount: 27000,
    status: 'Scheduled',
  },
  {
    type: 'Balance',
    description: 'Phase 4 — balance due on project close',
    date: '2026-06-15',
    amount: 15000,
    status: 'Scheduled',
  },
];

const assetInventory = [
  { name: 'LED Wall Panel A', type: 'Hardware', category: 'Display', venue: 'Venue A', qty: 12, status: 'Planned' },
  { name: 'LED Wall Panel B', type: 'Hardware', category: 'Display', venue: 'Venue B', qty: 8, status: 'Planned' },
  { name: 'Branded Arch Structure', type: 'Fabrication', category: 'Structural', venue: 'Venue A', qty: 1, status: 'In Production' },
  { name: 'Interactive Kiosk', type: 'Hardware', category: 'Interactive', venue: 'Both', qty: 4, status: 'Planned' },
  { name: 'Branded Flooring Tiles', type: 'Fabrication', category: 'Decor', venue: 'Venue A', qty: 200, status: 'Planned' },
  { name: 'Sound System Package', type: 'Rental', category: 'Audio', venue: 'Venue A', qty: 1, status: 'Planned' },
  { name: 'Portable Generator', type: 'Rental', category: 'Power', venue: 'Venue B', qty: 2, status: 'Planned' },
  { name: 'Custom Signage Set', type: 'Fabrication', category: 'Signage', venue: 'Both', qty: 6, status: 'In Production' },
];

const venueMatrix = [
  { asset: 'LED Wall Panel A', venueA: 12, venueB: 0 },
  { asset: 'LED Wall Panel B', venueA: 0, venueB: 8 },
  { asset: 'Branded Arch Structure', venueA: 1, venueB: 0 },
  { asset: 'Interactive Kiosk', venueA: 2, venueB: 2 },
  { asset: 'Branded Flooring Tiles', venueA: 200, venueB: 0 },
  { asset: 'Sound System Package', venueA: 1, venueB: 0 },
  { asset: 'Portable Generator', venueA: 0, venueB: 2 },
  { asset: 'Custom Signage Set', venueA: 3, venueB: 3 },
];

const personnelTable = [
  { role: 'Project Manager', phase1: 1, phase2: 1, phase3: 1, phase4: 1, totalHours: 320 },
  { role: 'Creative Director', phase1: 1, phase2: 0, phase3: 0, phase4: 0, totalHours: 80 },
  { role: 'Designer', phase1: 2, phase2: 1, phase3: 0, phase4: 0, totalHours: 240 },
  { role: 'Fabrication Lead', phase1: 0, phase2: 1, phase3: 0, phase4: 0, totalHours: 160 },
  { role: 'Fabricator', phase1: 0, phase2: 3, phase3: 0, phase4: 0, totalHours: 480 },
  { role: 'Install Lead', phase1: 0, phase2: 0, phase3: 1, phase4: 1, totalHours: 120 },
  { role: 'Install Crew', phase1: 0, phase2: 0, phase3: 4, phase4: 4, totalHours: 320 },
  { role: 'On-Site Tech', phase1: 0, phase2: 0, phase3: 2, phase4: 0, totalHours: 80 },
];

const equipmentList = [
  { item: 'Box Truck (26 ft)', qty: 2, phases: 'Phase 3, 4', notes: 'Load-in / strike' },
  { item: 'Scissor Lift', qty: 1, phases: 'Phase 3, 4', notes: 'LED wall install / removal' },
  { item: 'Sprinter Van', qty: 1, phases: 'Phase 2, 3', notes: 'Material transport' },
  { item: 'Power Distribution Unit', qty: 2, phases: 'Phase 3', notes: 'On-site power management' },
  { item: 'Tool Kit — Fabrication', qty: 3, phases: 'Phase 2, 3, 4', notes: 'Standard fab toolkit' },
  { item: 'Safety Kit', qty: 4, phases: 'Phase 3, 4', notes: 'PPE for install crew' },
];

const csvFiles = [
  { name: 'line_items', label: 'Line Items', rows: 24, description: 'All deliverable line items across phases' },
  { name: 'addons', label: 'Add-Ons', rows: 8, description: 'Optional add-on items by phase' },
  { name: 'milestones', label: 'Milestones', rows: 4, description: 'Milestone gates and requirements' },
  { name: 'venues', label: 'Venues', rows: 2, description: 'Venue details with addresses and contacts' },
  { name: 'contacts', label: 'Contacts', rows: 3, description: 'Client contacts with roles' },
  { name: 'tasks', label: 'Tasks', rows: 20, description: 'PM task breakdown with estimates' },
  { name: 'assets', label: 'Assets', rows: assetInventory.length, description: 'Full asset inventory with tracking data' },
];

const salesforceMappings = [
  {
    name: 'Deal / Opportunity',
    mappings: [
      { flyteDeckField: 'proposal.name', targetField: 'Opportunity.Name' },
      { flyteDeckField: 'proposal.total_value', targetField: 'Opportunity.Amount' },
      { flyteDeckField: 'proposal.status', targetField: 'Opportunity.StageName' },
      { flyteDeckField: 'proposal.valid_until', targetField: 'Opportunity.CloseDate' },
      { flyteDeckField: 'proposal.currency', targetField: 'Opportunity.CurrencyIsoCode' },
    ],
  },
  {
    name: 'Account / Client',
    mappings: [
      { flyteDeckField: 'client.company_name', targetField: 'Account.Name' },
      { flyteDeckField: 'client.industry', targetField: 'Account.Industry' },
      { flyteDeckField: 'client.billing_address', targetField: 'Account.BillingAddress' },
    ],
  },
  {
    name: 'Line Items',
    mappings: [
      { flyteDeckField: 'deliverable.name', targetField: 'OpportunityLineItem.Name' },
      { flyteDeckField: 'deliverable.total_cost', targetField: 'OpportunityLineItem.UnitPrice' },
      { flyteDeckField: 'deliverable.qty', targetField: 'OpportunityLineItem.Quantity' },
      { flyteDeckField: 'phase.name', targetField: 'OpportunityLineItem.Description' },
    ],
  },
];

const hubspotMappings = [
  {
    name: 'Deal',
    mappings: [
      { flyteDeckField: 'proposal.name', targetField: 'deal.dealname' },
      { flyteDeckField: 'proposal.total_value', targetField: 'deal.amount' },
      { flyteDeckField: 'proposal.status', targetField: 'deal.dealstage' },
      { flyteDeckField: 'proposal.valid_until', targetField: 'deal.closedate' },
    ],
  },
  {
    name: 'Company',
    mappings: [
      { flyteDeckField: 'client.company_name', targetField: 'company.name' },
      { flyteDeckField: 'client.industry', targetField: 'company.industry' },
    ],
  },
];

const pipedriveMappings = [
  {
    name: 'Deal',
    mappings: [
      { flyteDeckField: 'proposal.name', targetField: 'deal.title' },
      { flyteDeckField: 'proposal.total_value', targetField: 'deal.value' },
      { flyteDeckField: 'proposal.currency', targetField: 'deal.currency' },
      { flyteDeckField: 'proposal.valid_until', targetField: 'deal.expected_close_date' },
    ],
  },
  {
    name: 'Organization',
    mappings: [
      { flyteDeckField: 'client.company_name', targetField: 'organization.name' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Document export options state
// ---------------------------------------------------------------------------

function DocxOptions({
  onExport,
}: {
  onExport: (opts: Record<string, boolean>) => void;
}) {
  const [includeTerms, setIncludeTerms] = useState(true);
  const [includePortfolio, setIncludePortfolio] = useState(true);
  const [includePlaceholders, setIncludePlaceholders] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      <div className="px-5 py-5">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold">
            W
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground">
              Word Document (.docx)
            </h3>
            <p className="mt-1 text-xs text-text-muted leading-relaxed">
              Full proposal document with cover page, phase breakdowns,
              investment summary, and appendices.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2.5 pl-[3.375rem]">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeTerms}
              onChange={() => setIncludeTerms(!includeTerms)}
              className="h-4 w-4 rounded border-gray-300 text-foreground focus:ring-foreground"
            />
            <span className="text-xs text-foreground">
              Include Terms & Conditions appendix
            </span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includePortfolio}
              onChange={() => setIncludePortfolio(!includePortfolio)}
              className="h-4 w-4 rounded border-gray-300 text-foreground focus:ring-foreground"
            />
            <span className="text-xs text-foreground">
              Include portfolio references
            </span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includePlaceholders}
              onChange={() => setIncludePlaceholders(!includePlaceholders)}
              className="h-4 w-4 rounded border-gray-300 text-foreground focus:ring-foreground"
            />
            <span className="text-xs text-foreground">
              Include placeholder fields for signatures
            </span>
          </label>
        </div>

        <div className="mt-4 pl-[3.375rem]">
          <button
            onClick={() =>
              onExport({
                includeTerms,
                includePortfolio,
                includePlaceholders,
              })
            }
            className="rounded-lg bg-foreground px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-foreground/90"
          >
            Download .docx
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper: format currency inline
// ---------------------------------------------------------------------------
function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function ExportHubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<ExportTab>('document');

  return (
    <>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-text-muted">
        <Link
          href="/app/proposals"
          className="hover:text-foreground transition-colors"
        >
          Proposals
        </Link>
        <span>/</span>
        <Link
          href={`/app/proposals/${id}`}
          className="hover:text-foreground transition-colors"
        >
          {MOCK_PROPOSAL.name}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Export Hub</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Export Hub
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Export proposal data to documents, CRM platforms, finance tools, PM
          systems, and more.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-8 border-b border-border">
        <nav className="-mb-px flex gap-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap pb-3 text-sm font-medium transition-colors border-b-2 ${
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

      {/* ----------------------------------------------------------------- */}
      {/* DOCUMENT TAB                                                       */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'document' && (
        <div className="space-y-5">
          <DocxOptions onExport={() => {}} />

          <ExportCard
            platformName="PDF Document"
            platformLetter="P"
            platformColor="#dc2626"
            description="High-fidelity PDF with branded cover, phase narratives, investment tables, and terms appendix. Ready for client delivery."
            status="connected"
            onExport={() => {}}
            actions={[{ label: 'Download PDF', onClick: () => {} }]}
          />
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* CRM TAB                                                            */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'crm' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <div className="space-y-5">
              <ExportCard
                platformName="Salesforce"
                platformLetter="S"
                platformColor="#00a1e0"
                description="Export as Salesforce Opportunity with OpportunityLineItems. Maps phases to line items and client to Account."
                status="connected"
                onExport={() => {}}
                previewData={salesforcePreview}
                actions={[
                  { label: 'Download JSON', onClick: () => {} },
                  { label: 'Download CSV', onClick: () => {} },
                ]}
              />
              <ExportCard
                platformName="HubSpot"
                platformLetter="H"
                platformColor="#ff7a59"
                description="Export as HubSpot Deal with company and contact associations. Includes deal stage mapping."
                status="not_configured"
                onExport={() => {}}
                previewData={hubspotPreview}
                actions={[
                  { label: 'Download JSON', onClick: () => {} },
                ]}
              />
              <ExportCard
                platformName="Pipedrive"
                platformLetter="P"
                platformColor="#017737"
                description="Export as Pipedrive Deal with organization and person associations. Maps to your pipeline stages."
                status="not_configured"
                onExport={() => {}}
                previewData={pipedrivePreview}
                actions={[
                  { label: 'Download JSON', onClick: () => {} },
                ]}
              />
            </div>

            <div className="space-y-5">
              <ExportPreview
                platformName="Salesforce"
                categories={salesforceMappings}
              />
              <ExportPreview
                platformName="HubSpot"
                categories={hubspotMappings}
              />
              <ExportPreview
                platformName="Pipedrive"
                categories={pipedriveMappings}
              />
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* FINANCE TAB                                                        */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <ExportCard
              platformName="QuickBooks"
              platformLetter="Q"
              platformColor="#2ca01c"
              description="Export invoices formatted for QuickBooks Online. Includes customer reference and line items."
              status="connected"
              onExport={() => {}}
              previewData={quickbooksPreview}
              actions={[{ label: 'Download JSON', onClick: () => {} }]}
            />
            <ExportCard
              platformName="Xero"
              platformLetter="X"
              platformColor="#13b5ea"
              description="Export invoices as Xero ACCREC format. Includes contact, line items, and currency."
              status="not_configured"
              onExport={() => {}}
              previewData={xeroPreview}
              actions={[{ label: 'Download JSON', onClick: () => {} }]}
            />
            <ExportCard
              platformName="FreshBooks"
              platformLetter="F"
              platformColor="#0075dd"
              description="Export invoices for FreshBooks with customer ID, line items, and payment terms."
              status="not_configured"
              onExport={() => {}}
              previewData={freshbooksPreview}
              actions={[{ label: 'Download JSON', onClick: () => {} }]}
            />
          </div>

          {/* Invoice Schedule */}
          <div className="rounded-xl border border-border bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">
                Invoice Schedule Preview
              </h2>
              <p className="mt-0.5 text-xs text-text-muted">
                Based on payment terms and milestone triggers
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary">
                    <th className="px-6 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Type
                    </th>
                    <th className="px-6 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Description
                    </th>
                    <th className="px-6 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Date
                    </th>
                    <th className="px-6 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Amount
                    </th>
                    <th className="px-6 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoiceSchedule.map((inv, i) => (
                    <tr key={i} className="hover:bg-bg-secondary/50">
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            inv.type === 'Deposit'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {inv.type}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-foreground">
                        {inv.description}
                      </td>
                      <td className="px-6 py-3 text-text-secondary tabular-nums">
                        {new Date(inv.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-foreground tabular-nums">
                        {fmt(inv.amount)}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            inv.status === 'Draft'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-green-50 text-green-700'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border bg-bg-secondary">
                    <td className="px-6 py-3" colSpan={3}>
                      <span className="text-sm font-semibold text-foreground">
                        Total
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-foreground tabular-nums">
                      {fmt(invoiceSchedule.reduce((s, inv) => s + inv.amount, 0))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* PM TAB                                                             */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'pm' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <ExportCard
              platformName="ClickUp"
              platformLetter="C"
              platformColor="#7b68ee"
              description="Export task structure to ClickUp. Creates a list with tasks grouped by phase and subtasks for each deliverable."
              status="connected"
              onExport={() => {}}
              previewData={clickupPreview}
              actions={[{ label: 'Download JSON', onClick: () => {} }]}
            />
            <ExportCard
              platformName="Asana"
              platformLetter="A"
              platformColor="#f06a6a"
              description="Export as Asana project with sections per phase and tasks per deliverable."
              status="not_configured"
              onExport={() => {}}
              previewData={asanaPreview}
              actions={[{ label: 'Download JSON', onClick: () => {} }]}
            />
            <ExportCard
              platformName="Monday.com"
              platformLetter="M"
              platformColor="#6161ff"
              description="Export as Monday.com board with groups per phase and items per deliverable."
              status="not_configured"
              onExport={() => {}}
              previewData={mondayPreview}
              actions={[{ label: 'Download JSON', onClick: () => {} }]}
            />
          </div>

          {/* Task Structure Preview */}
          <div className="rounded-xl border border-border bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">
                Task Structure Preview
              </h2>
              <p className="mt-0.5 text-xs text-text-muted">
                Phases, tasks, and subtasks as they will appear in your PM tool
              </p>
            </div>
            <div className="divide-y divide-border">
              {clickupPreview.tasks.map((task, i) => (
                <div key={i} className="px-6 py-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-foreground text-white text-[10px] font-bold">
                      {i + 1}
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {task.name}
                    </h3>
                    <span className="text-[11px] text-text-muted">
                      {task.subtasks.length} subtasks
                    </span>
                  </div>
                  <div className="ml-8 grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                    {task.subtasks.map((sub, j) => (
                      <div
                        key={j}
                        className="flex items-center gap-2 rounded-lg bg-bg-secondary px-3 py-2"
                      >
                        <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-text-muted" />
                        <span className="text-xs text-foreground">{sub}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* ASSETS TAB                                                         */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'assets' && (
        <div className="space-y-6">
          {/* Full Inventory */}
          <div className="rounded-xl border border-border bg-white overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Asset Inventory
                </h2>
                <p className="mt-0.5 text-xs text-text-muted">
                  {assetInventory.length} assets across all venues
                </p>
              </div>
              <button className="rounded-lg border border-border bg-white px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-bg-secondary">
                Download CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary">
                    <th className="px-6 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Asset Name
                    </th>
                    <th className="px-6 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Type
                    </th>
                    <th className="px-6 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Category
                    </th>
                    <th className="px-6 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Venue
                    </th>
                    <th className="px-6 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Qty
                    </th>
                    <th className="px-6 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {assetInventory.map((asset, i) => (
                    <tr key={i} className="hover:bg-bg-secondary/50">
                      <td className="px-6 py-3 font-medium text-foreground">
                        {asset.name}
                      </td>
                      <td className="px-6 py-3 text-text-secondary">
                        {asset.type}
                      </td>
                      <td className="px-6 py-3 text-text-secondary">
                        {asset.category}
                      </td>
                      <td className="px-6 py-3 text-text-secondary">
                        {asset.venue}
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums text-foreground">
                        {asset.qty}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            asset.status === 'In Production'
                              ? 'bg-orange-50 text-orange-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {asset.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Venue Assignment Matrix */}
          <div className="rounded-xl border border-border bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">
                Venue Assignment Matrix
              </h2>
              <p className="mt-0.5 text-xs text-text-muted">
                Asset quantities allocated to each venue
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary">
                    <th className="px-6 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Asset
                    </th>
                    <th className="px-6 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Venue A
                    </th>
                    <th className="px-6 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Venue B
                    </th>
                    <th className="px-6 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {venueMatrix.map((row, i) => (
                    <tr key={i} className="hover:bg-bg-secondary/50">
                      <td className="px-6 py-3 font-medium text-foreground">
                        {row.asset}
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums text-text-secondary">
                        {row.venueA || '\u2014'}
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums text-text-secondary">
                        {row.venueB || '\u2014'}
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums font-medium text-foreground">
                        {row.venueA + row.venueB}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* RESOURCES TAB                                                      */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          {/* Personnel Allocation */}
          <div className="rounded-xl border border-border bg-white overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Personnel Allocation
                </h2>
                <p className="mt-0.5 text-xs text-text-muted">
                  Headcount by role across project phases
                </p>
              </div>
              <button className="rounded-lg border border-border bg-white px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-bg-secondary">
                Download CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary">
                    <th className="px-6 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Role
                    </th>
                    <th className="px-6 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Phase 1
                    </th>
                    <th className="px-6 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Phase 2
                    </th>
                    <th className="px-6 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Phase 3
                    </th>
                    <th className="px-6 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Phase 4
                    </th>
                    <th className="px-6 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Est. Hours
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {personnelTable.map((row, i) => (
                    <tr key={i} className="hover:bg-bg-secondary/50">
                      <td className="px-6 py-3 font-medium text-foreground">
                        {row.role}
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums text-text-secondary">
                        {row.phase1 || '\u2014'}
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums text-text-secondary">
                        {row.phase2 || '\u2014'}
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums text-text-secondary">
                        {row.phase3 || '\u2014'}
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums text-text-secondary">
                        {row.phase4 || '\u2014'}
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums font-medium text-foreground">
                        {row.totalHours.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border bg-bg-secondary">
                    <td className="px-6 py-3 font-semibold text-foreground">
                      Total Headcount
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums font-semibold text-foreground">
                      {personnelTable.reduce((s, r) => s + r.phase1, 0)}
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums font-semibold text-foreground">
                      {personnelTable.reduce((s, r) => s + r.phase2, 0)}
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums font-semibold text-foreground">
                      {personnelTable.reduce((s, r) => s + r.phase3, 0)}
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums font-semibold text-foreground">
                      {personnelTable.reduce((s, r) => s + r.phase4, 0)}
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums font-semibold text-foreground">
                      {personnelTable
                        .reduce((s, r) => s + r.totalHours, 0)
                        .toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Equipment / Vehicle Requirements */}
          <div className="rounded-xl border border-border bg-white overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Equipment & Vehicle Requirements
                </h2>
                <p className="mt-0.5 text-xs text-text-muted">
                  Logistics and equipment needs by phase
                </p>
              </div>
              <button className="rounded-lg border border-border bg-white px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-bg-secondary">
                Download CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary">
                    <th className="px-6 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Item
                    </th>
                    <th className="px-6 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Qty
                    </th>
                    <th className="px-6 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Phases
                    </th>
                    <th className="px-6 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {equipmentList.map((row, i) => (
                    <tr key={i} className="hover:bg-bg-secondary/50">
                      <td className="px-6 py-3 font-medium text-foreground">
                        {row.item}
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums text-text-secondary">
                        {row.qty}
                      </td>
                      <td className="px-6 py-3 text-text-secondary">
                        {row.phases}
                      </td>
                      <td className="px-6 py-3 text-text-muted">
                        {row.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* CSV PACK TAB                                                       */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'csv' && (
        <div className="space-y-6">
          {/* Download All */}
          <div className="rounded-xl border border-border bg-white px-6 py-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Complete CSV Pack
              </h2>
              <p className="mt-0.5 text-xs text-text-muted">
                Download all {csvFiles.length} CSV files as a single ZIP
                archive.
              </p>
            </div>
            <button className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-foreground/90">
              Download All as ZIP
            </button>
          </div>

          {/* Individual files */}
          <div className="rounded-xl border border-border bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">
                Individual Files
              </h2>
            </div>
            <div className="divide-y divide-border">
              {csvFiles.map((file) => (
                <div
                  key={file.name}
                  className="flex items-center justify-between px-6 py-4 hover:bg-bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {file.name}.csv
                      </p>
                      <p className="text-xs text-text-muted">
                        {file.description} — {file.rows} rows
                      </p>
                    </div>
                  </div>
                  <button className="rounded-lg border border-border bg-white px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-bg-secondary shrink-0">
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
