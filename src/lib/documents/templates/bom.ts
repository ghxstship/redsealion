
/**
 * Bill of Materials (BOM) Document
 *
 * Generates a DOCX bill of materials with per-phase deliverables,
 * add-ons, materials summary by category, and procurement notes.
 */

import type {
  Organization,
  Proposal,
  Client,
  Phase,
  PhaseDeliverable,
  PhaseAddon,
} from '@/types/database';

import { AlignmentType } from 'docx';

import {
  brandFromOrg,
  buildSection,
  createDocument,
  packDocument,
  heading,
  body,
  spacer,
  pageBreak,
  bullet,
  labelValue,
  dataTable,
  formatDate,
  formatCurrency,
  type TableColumn,
  CONTENT_WIDTH,
} from '../engine';

import { castDeliverableMeta } from '../doc-types';
import { castResourceMetadata } from '../json-casts';




// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface BOMData {
  org: Organization;
  proposal: Proposal;
  client: Client;
  phases: Phase[];
  deliverables: PhaseDeliverable[];
  addons: PhaseAddon[];
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateBOM(data: BOMData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { proposal, client, phases, deliverables, addons } = data;

  // Build lookup maps
  const deliverablesByPhase = new Map<string, PhaseDeliverable[]>();
  for (const d of deliverables) {
    const list = deliverablesByPhase.get(d.phase_id) ?? [];
    list.push(d);
    deliverablesByPhase.set(d.phase_id, list);
  }

  const addonsByPhase = new Map<string, PhaseAddon[]>();
  for (const a of addons) {
    const list = addonsByPhase.get(a.phase_id) ?? [];
    list.push(a);
    addonsByPhase.set(a.phase_id, list);
  }

  const sortedPhases = [...phases].sort((a, b) => a.sort_order - b.sort_order);

  // Pre-calculate totals
  const selectedAddons = addons.filter((a) => a.is_selected);
  const totalLineItems = deliverables.length;
  const totalAddonsSelected = selectedAddons.length;
  const totalDeliverableCost = deliverables.reduce((sum, d) => sum + d.total_cost, 0);
  const totalAddonCost = selectedAddons.reduce((sum, a) => sum + a.total_cost, 0);
  const totalCost = totalDeliverableCost + totalAddonCost;

  // Category aggregation
  const categoryMap = new Map<string, { count: number; cost: number }>();
  for (const d of deliverables) {
    const entry = categoryMap.get(d.category) ?? { count: 0, cost: 0 };
    entry.count += 1;
    entry.cost += d.total_cost;
    categoryMap.set(d.category, entry);
  }
  for (const a of selectedAddons) {
    const entry = categoryMap.get(a.category) ?? { count: 0, cost: 0 };
    entry.count += 1;
    entry.cost += a.total_cost;
    categoryMap.set(a.category, entry);
  }

  // Procurement items
  const procurementItems = [
    ...deliverables.filter((d) => castResourceMetadata(d.resource_metadata)?.triggersProcurement),
    ...selectedAddons.filter((a) => castResourceMetadata(a.resource_metadata)?.triggersProcurement),
  ];

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  // ------------------------------------------------------------------
  // 1. Header
  // ------------------------------------------------------------------
  children.push(heading('BILL OF MATERIALS', 1));
  children.push(body(proposal.name, { bold: true, size: 28, spacing: { after: 200 } }));

  // ------------------------------------------------------------------
  // 2. Project Reference
  // ------------------------------------------------------------------
  children.push(heading('Project Reference', 2));
  children.push(labelValue('Proposal', proposal.name, brand));
  children.push(labelValue('Client', client.company_name, brand));
  children.push(labelValue('Date', formatDate(proposal.prepared_date), brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 3. Summary
  // ------------------------------------------------------------------
  children.push(heading('Summary', 2));
  children.push(labelValue('Total Line Items', String(totalLineItems), brand));
  children.push(labelValue('Add-Ons Selected', String(totalAddonsSelected), brand));
  children.push(labelValue('Total Cost', formatCurrency(totalCost, proposal.currency), brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 4. BOM by Phase
  // ------------------------------------------------------------------
  const itemCols: TableColumn[] = [
    { header: 'Item Name', width: Math.floor(CONTENT_WIDTH * 0.2) },
    { header: 'Description', width: Math.floor(CONTENT_WIDTH * 0.2) },
    { header: 'Category', width: Math.floor(CONTENT_WIDTH * 0.12) },
    { header: 'Qty', width: Math.floor(CONTENT_WIDTH * 0.08), align: AlignmentType.RIGHT },
    { header: 'Unit', width: Math.floor(CONTENT_WIDTH * 0.1) },
    { header: 'Unit Cost', width: Math.floor(CONTENT_WIDTH * 0.13), align: AlignmentType.RIGHT },
    { header: 'Total', width: Math.floor(CONTENT_WIDTH * 0.17), align: AlignmentType.RIGHT },
  ];

  for (const phase of sortedPhases) {
    const phaseDeliverables = (deliverablesByPhase.get(phase.id) ?? []).sort(
      (a, b) => a.sort_order - b.sort_order
    );
    const phaseAddons = (addonsByPhase.get(phase.id) ?? []).filter((a) => a.is_selected).sort(
      (a, b) => a.sort_order - b.sort_order
    );

    if (phaseDeliverables.length === 0 && phaseAddons.length === 0) continue;

    children.push(heading(`Phase ${phase.phase_number}: ${phase.name}`, 2));

    // Core items
    if (phaseDeliverables.length > 0) {
      const coreRows: string[][] = [];

      for (const d of phaseDeliverables) {
        coreRows.push([
          d.name,
          d.description ?? '',
          d.category,
          String(d.qty),
          d.unit,
          formatCurrency(d.unit_cost, proposal.currency),
          formatCurrency(d.total_cost, proposal.currency),
        ]);

        // Asset metadata extra rows
        if (d.asset_metadata) {
          const meta = castDeliverableMeta(d.asset_metadata);
          if (meta.dimensions) {
            coreRows.push(['', `Dimensions: ${meta.dimensions}`, '', '', '', '', '']);
          }
          if (meta.weight) {
            coreRows.push(['', `Weight: ${meta.weight}`, '', '', '', '', '']);
          }
          if (meta.material) {
            coreRows.push(['', `Material: ${meta.material}`, '', '', '', '', '']);
          }
        }
      }

      children.push(body('Core Items', { bold: true, spacing: { before: 120, after: 80 } }));
      children.push(dataTable(itemCols, coreRows, brand));
    }

    // Add-ons
    if (phaseAddons.length > 0) {
      const addonRows: string[][] = [];

      for (const a of phaseAddons) {
        addonRows.push([
          `[Add-On] ${a.name}`,
          a.description ?? '',
          a.category,
          String(a.qty),
          a.unit,
          formatCurrency(a.unit_cost, proposal.currency),
          formatCurrency(a.total_cost, proposal.currency),
        ]);

        if (a.asset_metadata) {
          const aMeta = castDeliverableMeta(a.asset_metadata);
          if (aMeta.dimensions) {
            addonRows.push(['', `Dimensions: ${aMeta.dimensions}`, '', '', '', '', '']);
          }
          if (aMeta.weight) {
            addonRows.push(['', `Weight: ${aMeta.weight}`, '', '', '', '', '']);
          }
          if (aMeta.material) {
            addonRows.push(['', `Material: ${aMeta.material}`, '', '', '', '', '']);
          }
        }
      }

      children.push(spacer(80));
      children.push(body('Add-Ons (Selected)', { bold: true, spacing: { before: 120, after: 80 } }));
      children.push(dataTable(itemCols, addonRows, brand));
    }

    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 5. Materials Summary
  // ------------------------------------------------------------------
  children.push(pageBreak());
  children.push(heading('Materials Summary', 2));

  const categoryCols: TableColumn[] = [
    { header: 'Category', width: Math.floor(CONTENT_WIDTH * 0.4) },
    { header: 'Items', width: Math.floor(CONTENT_WIDTH * 0.2), align: AlignmentType.RIGHT },
    { header: 'Total Cost', width: Math.floor(CONTENT_WIDTH * 0.4), align: AlignmentType.RIGHT },
  ];

  const categoryRows = Array.from(categoryMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([cat, info]) => [cat, String(info.count), formatCurrency(info.cost, proposal.currency)]);

  if (categoryRows.length > 0) {
    children.push(dataTable(categoryCols, categoryRows, brand));
  }
  children.push(spacer());

  // ------------------------------------------------------------------
  // 6. Procurement Notes
  // ------------------------------------------------------------------
  if (procurementItems.length > 0) {
    children.push(heading('Procurement Notes', 2));
    children.push(
      body('The following items trigger procurement and require advance ordering:', {
        spacing: { after: 120 },
      })
    );

    for (const item of procurementItems) {
      children.push(
        bullet(
          `${item.name} (${item.category}) \u2014 Qty: ${item.qty} ${item.unit}`
        )
      );
    }
  }

  // ------------------------------------------------------------------
  // Assemble document
  // ------------------------------------------------------------------
  const section = buildSection({
    brand,
    children,
    documentTitle: 'Bill of Materials',
  });

  const doc = createDocument(brand, [section]);
  return packDocument(doc);
}
