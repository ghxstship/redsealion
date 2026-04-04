/**
 * General-purpose approval workflow engine.
 *
 * Supports approval requests for any entity type (expenses, budgets,
 * change orders, timesheets, purchase orders, etc.).
 *
 * @module lib/approvals
 */

import type { ApprovalStatus } from '@/types/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApprovalRequest {
  id: string;
  organization_id: string;
  entity_type: ApprovalEntityType;
  entity_id: string;
  entity_title: string;
  requested_by: string;
  status: ApprovalStatus;
  approvers: string[];
  approved_by: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export type ApprovalEntityType =
  | 'expense'
  | 'budget'
  | 'change_order'
  | 'timesheet'
  | 'purchase_order'
  | 'time_off_request'
  | 'invoice';

// ---------------------------------------------------------------------------
// Approval request helpers
// ---------------------------------------------------------------------------

export function buildApprovalInsert(params: {
  orgId: string;
  entityType: ApprovalEntityType;
  entityId: string;
  entityTitle: string;
  requestedBy: string;
  approverIds: string[];
}): Record<string, unknown> {
  return {
    organization_id: params.orgId,
    entity_type: params.entityType,
    entity_id: params.entityId,
    entity_title: params.entityTitle,
    requested_by: params.requestedBy,
    approvers: params.approverIds,
    status: 'pending' as ApprovalStatus,
    approved_by: null,
    approved_at: null,
    rejected_by: null,
    rejected_at: null,
    rejection_reason: null,
  };
}

/**
 * Determine the resulting entity status after approval/rejection.
 * Maps entity types to their post-approval status values.
 */
export function getPostApprovalStatus(
  entityType: ApprovalEntityType,
  decision: 'approved' | 'rejected',
): string {
  if (decision === 'rejected') {
    return 'rejected';
  }

  const statusMap: Record<ApprovalEntityType, string> = {
    expense: 'approved',
    budget: 'approved',
    change_order: 'approved',
    timesheet: 'approved',
    purchase_order: 'sent',
    time_off_request: 'approved',
    invoice: 'sent',
  };

  return statusMap[entityType] ?? 'approved';
}

/**
 * Get the entity table name for a given approval entity type.
 */
export function getEntityTable(entityType: ApprovalEntityType): string {
  const tableMap: Record<ApprovalEntityType, string> = {
    expense: 'expenses',
    budget: 'project_budgets',
    change_order: 'change_orders',
    timesheet: 'timesheets',
    purchase_order: 'purchase_orders',
    time_off_request: 'time_off_requests',
    invoice: 'invoices',
  };

  return tableMap[entityType] ?? entityType;
}

/**
 * Format an approval request for display.
 */
export function formatApprovalLabel(entityType: ApprovalEntityType): string {
  const labels: Record<ApprovalEntityType, string> = {
    expense: 'Expense Report',
    budget: 'Budget',
    change_order: 'Change Order',
    timesheet: 'Timesheet',
    purchase_order: 'Purchase Order',
    time_off_request: 'Time Off Request',
    invoice: 'Invoice',
  };

  return labels[entityType] ?? entityType;
}
