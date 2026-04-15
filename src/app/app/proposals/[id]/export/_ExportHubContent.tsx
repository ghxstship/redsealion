'use client';
import Checkbox from '@/components/ui/Checkbox';

import Button from '@/components/ui/Button';

import { useState, useCallback } from 'react';
import { FileText } from 'lucide-react';
import ExportCard from '@/components/admin/export/ExportCard';
import ExportPreview from '@/components/admin/export/ExportPreview';
import Tabs from '@/components/ui/Tabs';
import type { ExportHubData } from './_data';
import PageHeader from '@/components/shared/PageHeader';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

type ExportTab = 'document' | 'crm' | 'finance' | 'pm' | 'assets' | 'resources' | 'csv';

const TABS: { key: ExportTab; label: string }[] = [
  { key: 'document', label: 'Document' },
  { key: 'crm', label: 'CRM' },
  { key: 'finance', label: 'Finance' },
  { key: 'pm', label: 'PM' },
  { key: 'assets', label: 'Assets' },
  { key: 'resources', label: 'Resources' },
  { key: 'csv', label: 'CSV Pack' },
];

interface ExportHubContentProps {
  id: string;
  data: ExportHubData;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DocxOptions({ onExport }: { onExport: (opts: Record<string, boolean>) => void }) {
  const [includeTerms, setIncludeTerms] = useState(true);
  const [includePortfolio, setIncludePortfolio] = useState(true);
  const [includePlaceholders, setIncludePlaceholders] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden">
      <div className="px-5 py-5">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold">
            W
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground">Word Document (.docx)</h3>
            <p className="mt-1 text-xs text-text-muted leading-relaxed">
              Full proposal document with cover page, phase breakdowns, investment summary, and appendices.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2.5 pl-[3.375rem]">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <Checkbox checked={includeTerms} onChange={() => setIncludeTerms(!includeTerms)} className="h-4 w-4 rounded border-border" />
            <span className="text-xs text-foreground">Include Terms &amp; Conditions appendix</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <Checkbox checked={includePortfolio} onChange={() => setIncludePortfolio(!includePortfolio)} className="h-4 w-4 rounded border-border" />
            <span className="text-xs text-foreground">Include portfolio references</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <Checkbox checked={includePlaceholders} onChange={() => setIncludePlaceholders(!includePlaceholders)} className="h-4 w-4 rounded border-border" />
            <span className="text-xs text-foreground">Include placeholder fields for signatures</span>
          </label>
        </div>

        <div className="mt-4 pl-[3.375rem]">
          <Button onClick={() => onExport({ includeTerms, includePortfolio, includePlaceholders })} className="rounded-lg bg-foreground px-3.5 py-1.5 text-xs font-medium text-background transition-colors hover:bg-foreground/90">
            Download .docx
          </Button>
        </div>
      </div>
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ExportHubContent({ id, data }: ExportHubContentProps) {
  const [activeTab, setActiveTab] = useState<ExportTab>('document');

  // Download helpers
  const downloadJson = useCallback((data: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const downloadCsv = useCallback((rows: Record<string, unknown>[], filename: string) => {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleDocxExport = useCallback(async () => {
    const res = await fetch(`/api/documents/proposal?proposalId=${id}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proposal-${id}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  }, [id]);

  const {
    proposal: _proposal,
    salesforcePreview, hubspotPreview, pipedrivePreview,
    quickbooksPreview, xeroPreview, freshbooksPreview,
    clickupPreview, asanaPreview, mondayPreview,
    invoiceSchedule, assetInventory, venueMatrix,
    personnelTable, equipmentList, csvFiles,
    salesforceMappings, hubspotMappings, pipedriveMappings,
  } = data;

  return (
    <>
      {/* Header */}
      <div className="mb-8">
<PageHeader title="Export Hub" />
        <p className="mt-1 text-sm text-text-muted">
          Export proposal data to documents, CRM platforms, finance tools, PM systems, and more.
        </p>
      </div>

      {/* Tabs */}
      <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} className="mb-8" />

      {/* DOCUMENT TAB */}
      {activeTab === 'document' && (
        <div className="space-y-5">
          <DocxOptions onExport={handleDocxExport} />
          <ExportCard platformName="Print Preview" platformLetter="P" platformColor="#dc2626" description="Print-ready HTML with branded cover, phase breakdown, investment tables, and terms. Use your browser's Print → Save as PDF." status="connected" onExport={() => window.open(`/api/proposals/${id}/export/pdf?html=1`, '_blank')} actions={[{ label: 'Open Print Preview', onClick: () => window.open(`/api/proposals/${id}/export/pdf?html=1`, '_blank') }]} />
        </div>
      )}

      {/* CRM TAB */}
      {activeTab === 'crm' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <div className="space-y-5">
              <ExportCard platformName="Salesforce" platformLetter="S" platformColor="#00a1e0" description="Export as Salesforce Opportunity with OpportunityLineItems." status="connected" onExport={() => downloadJson(salesforcePreview, 'salesforce-export')} previewData={salesforcePreview} actions={[{ label: 'Download JSON', onClick: () => downloadJson(salesforcePreview, 'salesforce-export') }, { label: 'Download CSV', onClick: () => downloadCsv(salesforcePreview.OpportunityLineItems ?? [], 'salesforce-line-items') }]} />
              <ExportCard platformName="HubSpot" platformLetter="H" platformColor="#ff7a59" description="Export as HubSpot Deal with company and contact associations." status="not_configured" onExport={() => downloadJson(hubspotPreview, 'hubspot-export')} previewData={hubspotPreview} actions={[{ label: 'Download JSON', onClick: () => downloadJson(hubspotPreview, 'hubspot-export') }]} />
              <ExportCard platformName="Pipedrive" platformLetter="P" platformColor="#017737" description="Export as Pipedrive Deal with organization and person associations." status="not_configured" onExport={() => downloadJson(pipedrivePreview, 'pipedrive-export')} previewData={pipedrivePreview} actions={[{ label: 'Download JSON', onClick: () => downloadJson(pipedrivePreview, 'pipedrive-export') }]} />
            </div>
            <div className="space-y-5">
              <ExportPreview platformName="Salesforce" categories={salesforceMappings} />
              <ExportPreview platformName="HubSpot" categories={hubspotMappings} />
              <ExportPreview platformName="Pipedrive" categories={pipedriveMappings} />
            </div>
          </div>
        </div>
      )}

      {/* FINANCE TAB */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <ExportCard platformName="QuickBooks" platformLetter="Q" platformColor="#2ca01c" description="Export invoices for QuickBooks Online." status="connected" onExport={() => downloadJson(quickbooksPreview, 'quickbooks-export')} previewData={quickbooksPreview} actions={[{ label: 'Download JSON', onClick: () => downloadJson(quickbooksPreview, 'quickbooks-export') }]} />
            <ExportCard platformName="Xero" platformLetter="X" platformColor="#13b5ea" description="Export invoices as Xero ACCREC format." status="not_configured" onExport={() => downloadJson(xeroPreview, 'xero-export')} previewData={xeroPreview} actions={[{ label: 'Download JSON', onClick: () => downloadJson(xeroPreview, 'xero-export') }]} />
            <ExportCard platformName="FreshBooks" platformLetter="F" platformColor="#0075dd" description="Export invoices for FreshBooks." status="not_configured" onExport={() => downloadJson(freshbooksPreview, 'freshbooks-export')} previewData={freshbooksPreview} actions={[{ label: 'Download JSON', onClick: () => downloadJson(freshbooksPreview, 'freshbooks-export') }]} />
          </div>

          {/* Invoice Schedule */}
          <div className="rounded-xl border border-border bg-background overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Invoice Schedule Preview</h2>
              <p className="mt-0.5 text-xs text-text-muted">Based on payment terms and milestone triggers</p>
            </div>
            <div className="overflow-x-auto">
              <Table >
                <TableHeader>
                  <TableRow className="border-b border-border bg-bg-secondary">
                    <TableHead className="px-6 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Type</TableHead>
                    <TableHead className="px-6 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Description</TableHead>
                    <TableHead className="px-6 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Date</TableHead>
                    <TableHead className="px-6 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-text-muted">Amount</TableHead>
                    <TableHead className="px-6 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody >
                  {invoiceSchedule.map((inv: { type: string; description: string; date: string; amount: number; status: string }, i: number) => (
                    <TableRow key={i} className="hover:bg-bg-secondary/50">
                      <TableCell className="px-6 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${inv.type === 'Deposit' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>{inv.type}</span>
                      </TableCell>
                      <TableCell className="px-6 py-3 text-foreground">{inv.description}</TableCell>
                      <TableCell className="px-6 py-3 text-text-secondary tabular-nums">{new Date(inv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                      <TableCell className="px-6 py-3 text-right font-medium text-foreground tabular-nums">{fmt(inv.amount)}</TableCell>
                      <TableCell className="px-6 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${inv.status === 'Draft' ? 'bg-bg-secondary text-text-muted' : 'bg-green-50 text-green-700'}`}>{inv.status}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <tfoot>
                  <TableRow className="border-t border-border bg-bg-secondary">
                    <TableCell className="px-6 py-3" colSpan={3}><span className="text-sm font-semibold text-foreground">Total</span></TableCell>
                    <TableCell className="px-6 py-3 text-right font-semibold text-foreground tabular-nums">{fmt(invoiceSchedule.reduce((s: number, inv: { amount: number }) => s + inv.amount, 0))}</TableCell>
                    <TableCell />
                  </TableRow>
                </tfoot>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* PM TAB */}
      {activeTab === 'pm' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <ExportCard platformName="ClickUp" platformLetter="C" platformColor="#7b68ee" description="Export task structure to ClickUp." status="connected" onExport={() => downloadJson(clickupPreview, 'clickup-export')} previewData={clickupPreview} actions={[{ label: 'Download JSON', onClick: () => downloadJson(clickupPreview, 'clickup-export') }]} />
            <ExportCard platformName="Asana" platformLetter="A" platformColor="#f06a6a" description="Export as Asana project with sections per phase." status="not_configured" onExport={() => downloadJson(asanaPreview, 'asana-export')} previewData={asanaPreview} actions={[{ label: 'Download JSON', onClick: () => downloadJson(asanaPreview, 'asana-export') }]} />
            <ExportCard platformName="Monday.com" platformLetter="M" platformColor="#6161ff" description="Export as Monday.com board with groups per phase." status="not_configured" onExport={() => downloadJson(mondayPreview, 'monday-export')} previewData={mondayPreview} actions={[{ label: 'Download JSON', onClick: () => downloadJson(mondayPreview, 'monday-export') }]} />
          </div>

          {/* Task Structure Preview */}
          <div className="rounded-xl border border-border bg-background overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Task Structure Preview</h2>
              <p className="mt-0.5 text-xs text-text-muted">Phases, tasks, and subtasks as they will appear in your PM tool</p>
            </div>
            <div >
              {clickupPreview.tasks.map((task: { name: string; subtasks: string[] }, i: number) => (
                <div key={i} className="px-6 py-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-foreground text-background text-[10px] font-bold">{i + 1}</div>
                    <h3 className="text-sm font-semibold text-foreground">{task.name}</h3>
                    <span className="text-[11px] text-text-muted">{task.subtasks.length} subtasks</span>
                  </div>
                  <div className="ml-8 grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                    {task.subtasks.map((sub: string, j: number) => (
                      <div key={j} className="flex items-center gap-2 rounded-lg bg-bg-secondary px-3 py-2">
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

      {/* ASSETS TAB */}
      {activeTab === 'assets' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-background overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Asset Inventory</h2>
                <p className="mt-0.5 text-xs text-text-muted">{assetInventory.length} assets</p>
              </div>
              <Button onClick={() => downloadCsv(assetInventory, 'asset-inventory')} className="rounded-lg border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-bg-secondary">Download CSV</Button>
            </div>
            <div className="overflow-x-auto">
              <Table >
                <TableHeader>
                  <TableRow className="border-b border-border bg-bg-secondary">
                    <TableHead className="px-6 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Asset Name</TableHead>
                    <TableHead className="px-6 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Type</TableHead>
                    <TableHead className="px-6 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Category</TableHead>
                    <TableHead className="px-6 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Venue</TableHead>
                    <TableHead className="px-6 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-text-muted">Qty</TableHead>
                    <TableHead className="px-6 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody >
                  {assetInventory.map((asset: { name: string; type: string; category: string; venue: string; qty: number; status: string }, i: number) => (
                    <TableRow key={i} className="hover:bg-bg-secondary/50">
                      <TableCell className="px-6 py-3 font-medium text-foreground">{asset.name}</TableCell>
                      <TableCell className="px-6 py-3 text-text-secondary">{asset.type}</TableCell>
                      <TableCell className="px-6 py-3 text-text-secondary">{asset.category}</TableCell>
                      <TableCell className="px-6 py-3 text-text-secondary">{asset.venue}</TableCell>
                      <TableCell className="px-6 py-3 text-right tabular-nums text-foreground">{asset.qty}</TableCell>
                      <TableCell className="px-6 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${asset.status === 'In Production' ? 'bg-orange-50 text-orange-700' : 'bg-bg-secondary text-text-muted'}`}>{asset.status}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Venue Matrix */}
          <div className="rounded-xl border border-border bg-background overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Venue Assignment Matrix</h2>
            </div>
            <div className="overflow-x-auto">
              <Table >
                <TableHeader>
                  <TableRow className="border-b border-border bg-bg-secondary">
                    <TableHead className="px-6 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Asset</TableHead>
                    <TableHead className="px-6 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-text-muted">Venue A</TableHead>
                    <TableHead className="px-6 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-text-muted">Venue B</TableHead>
                    <TableHead className="px-6 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-text-muted">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody >
                  {venueMatrix.map((row: { asset: string; venueA: number; venueB: number }, i: number) => (
                    <TableRow key={i} className="hover:bg-bg-secondary/50">
                      <TableCell className="px-6 py-3 font-medium text-foreground">{row.asset}</TableCell>
                      <TableCell className="px-6 py-3 text-right tabular-nums text-text-secondary">{row.venueA || '\u2014'}</TableCell>
                      <TableCell className="px-6 py-3 text-right tabular-nums text-text-secondary">{row.venueB || '\u2014'}</TableCell>
                      <TableCell className="px-6 py-3 text-right tabular-nums font-medium text-foreground">{row.venueA + row.venueB}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* RESOURCES TAB */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-background overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Personnel Allocation</h2>
                <p className="mt-0.5 text-xs text-text-muted">Headcount by role across project phases</p>
              </div>
              <Button onClick={() => downloadCsv(personnelTable, 'personnel-allocation')} className="rounded-lg border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-bg-secondary">Download CSV</Button>
            </div>
            <div className="overflow-x-auto">
              <Table >
                <TableHeader>
                  <TableRow className="border-b border-border bg-bg-secondary">
                    <TableHead className="px-6 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Role</TableHead>
                    <TableHead className="px-6 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-text-muted">Phase 1</TableHead>
                    <TableHead className="px-6 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-text-muted">Phase 2</TableHead>
                    <TableHead className="px-6 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-text-muted">Phase 3</TableHead>
                    <TableHead className="px-6 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-text-muted">Phase 4</TableHead>
                    <TableHead className="px-6 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-text-muted">Est. Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody >
                  {personnelTable.map((row: { role: string; phase1: number; phase2: number; phase3: number; phase4: number; totalHours: number }, i: number) => (
                    <TableRow key={i} className="hover:bg-bg-secondary/50">
                      <TableCell className="px-6 py-3 font-medium text-foreground">{row.role}</TableCell>
                      <TableCell className="px-6 py-3 text-right tabular-nums text-text-secondary">{row.phase1 || '\u2014'}</TableCell>
                      <TableCell className="px-6 py-3 text-right tabular-nums text-text-secondary">{row.phase2 || '\u2014'}</TableCell>
                      <TableCell className="px-6 py-3 text-right tabular-nums text-text-secondary">{row.phase3 || '\u2014'}</TableCell>
                      <TableCell className="px-6 py-3 text-right tabular-nums text-text-secondary">{row.phase4 || '\u2014'}</TableCell>
                      <TableCell className="px-6 py-3 text-right tabular-nums font-medium text-foreground">{row.totalHours.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Equipment &amp; Vehicle Requirements</h2>
              </div>
              <Button onClick={() => downloadCsv(equipmentList, 'equipment-requirements')} className="rounded-lg border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-bg-secondary">Download CSV</Button>
            </div>
            <div className="overflow-x-auto">
              <Table >
                <TableHeader>
                  <TableRow className="border-b border-border bg-bg-secondary">
                    <TableHead className="px-6 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Item</TableHead>
                    <TableHead className="px-6 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-text-muted">Qty</TableHead>
                    <TableHead className="px-6 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Phases</TableHead>
                    <TableHead className="px-6 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody >
                  {equipmentList.map((row: { item: string; qty: number; phases: string; notes: string }, i: number) => (
                    <TableRow key={i} className="hover:bg-bg-secondary/50">
                      <TableCell className="px-6 py-3 font-medium text-foreground">{row.item}</TableCell>
                      <TableCell className="px-6 py-3 text-right tabular-nums text-text-secondary">{row.qty}</TableCell>
                      <TableCell className="px-6 py-3 text-text-secondary">{row.phases}</TableCell>
                      <TableCell className="px-6 py-3 text-text-muted">{row.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* CSV PACK TAB */}
      {activeTab === 'csv' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-background px-6 py-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Complete CSV Pack</h2>
              <p className="mt-0.5 text-xs text-text-muted">Download all {csvFiles.length} CSV files as a single ZIP archive.</p>
            </div>
            <Button onClick={() => csvFiles.forEach((f) => downloadCsv([], f.name))} className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90">Download All as ZIP</Button>
          </div>

          <div className="rounded-xl border border-border bg-background overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Individual Files</h2>
            </div>
            <div >
              {csvFiles.map((file: { name: string; label: string; rows: number; description: string }) => (
                <div key={file.name} className="flex items-center justify-between px-6 py-4 hover:bg-bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{file.name}.csv</p>
                      <p className="text-xs text-text-muted">{file.description} — {file.rows} rows</p>
                    </div>
                  </div>
                  <Button onClick={() => downloadCsv([], file.name)} className="rounded-lg border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-bg-secondary shrink-0">Download</Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
