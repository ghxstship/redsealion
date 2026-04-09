/**
 * Production Advancing Module — Constants
 *
 * Status state machines, display config, tier limits, and enumerations.
 *
 * @module lib/advances/constants
 */

import type { AdvanceStatus, AdvanceMode, AdvanceType, AdvancePriority, FulfillmentStatus } from '@/types/database';

/* ─────────────────────────────────────────────────────────
   Status State Machine — Valid Transitions
   ───────────────────────────────────────────────────────── */

export const INTERNAL_TRANSITIONS: Record<AdvanceStatus, AdvanceStatus[]> = {
  draft: ['submitted', 'cancelled'],
  open_for_submissions: [], // Not used in internal mode
  submitted: ['under_review', 'approved', 'changes_requested', 'rejected', 'cancelled'],
  under_review: ['approved', 'changes_requested', 'rejected', 'on_hold'],
  changes_requested: ['submitted'],
  approved: ['partially_fulfilled', 'fulfilled', 'cancelled'],
  partially_fulfilled: ['fulfilled', 'cancelled'],
  fulfilled: ['completed'],
  completed: [],
  rejected: [],
  cancelled: [],
  on_hold: ['under_review'],
  expired: [],
};

export const COLLECTION_TRANSITIONS: Record<AdvanceStatus, AdvanceStatus[]> = {
  draft: ['open_for_submissions', 'cancelled'],
  open_for_submissions: ['under_review', 'on_hold', 'cancelled'],
  submitted: [], // Not used directly in collection mode
  under_review: ['approved', 'changes_requested', 'rejected', 'on_hold'],
  changes_requested: ['open_for_submissions'],
  approved: ['partially_fulfilled', 'fulfilled', 'cancelled'],
  partially_fulfilled: ['fulfilled', 'cancelled'],
  fulfilled: ['completed'],
  completed: [],
  rejected: [],
  cancelled: [],
  on_hold: ['under_review'],
  expired: [],
};

export function getValidTransitions(mode: AdvanceMode, currentStatus: AdvanceStatus): AdvanceStatus[] {
  const map = mode === 'internal' ? INTERNAL_TRANSITIONS : COLLECTION_TRANSITIONS;
  return map[currentStatus] ?? [];
}

/* ─────────────────────────────────────────────────────────
   Fulfillment Pipeline
   ───────────────────────────────────────────────────────── */

export const FULFILLMENT_PIPELINE: FulfillmentStatus[] = [
  'pending', 'sourcing', 'quoted', 'confirmed', 'reserved',
  'in_transit', 'delivered', 'inspected', 'setup_complete',
  'active', 'struck', 'returned',
];

export const FULFILLMENT_TERMINAL: FulfillmentStatus[] = ['returned', 'damaged', 'cancelled'];

/* ─────────────────────────────────────────────────────────
   Display Labels & Colors
   ───────────────────────────────────────────────────────── */

export const ADVANCE_STATUS_CONFIG: Record<AdvanceStatus, { label: string; color: string; bgClass: string }> = {
  draft: { label: 'Draft', color: '#6B7280', bgClass: 'bg-gray-100 text-gray-700' },
  open_for_submissions: { label: 'Open', color: '#3B82F6', bgClass: 'bg-blue-100 text-blue-700' },
  submitted: { label: 'Submitted', color: '#8B5CF6', bgClass: 'bg-violet-100 text-violet-700' },
  under_review: { label: 'Under Review', color: '#F59E0B', bgClass: 'bg-amber-100 text-amber-700' },
  changes_requested: { label: 'Changes Requested', color: '#F97316', bgClass: 'bg-orange-100 text-orange-700' },
  approved: { label: 'Approved', color: '#10B981', bgClass: 'bg-emerald-100 text-emerald-700' },
  partially_fulfilled: { label: 'Partially Fulfilled', color: '#06B6D4', bgClass: 'bg-cyan-100 text-cyan-700' },
  fulfilled: { label: 'Fulfilled', color: '#059669', bgClass: 'bg-green-100 text-green-700' },
  completed: { label: 'Completed', color: '#047857', bgClass: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', color: '#EF4444', bgClass: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelled', color: '#9CA3AF', bgClass: 'bg-gray-100 text-gray-500' },
  on_hold: { label: 'On Hold', color: '#F59E0B', bgClass: 'bg-yellow-100 text-yellow-700' },
  expired: { label: 'Expired', color: '#9CA3AF', bgClass: 'bg-gray-100 text-gray-500' },
};

export const FULFILLMENT_STATUS_CONFIG: Record<FulfillmentStatus, { label: string; color: string; bgClass: string }> = {
  pending: { label: 'Pending', color: '#6B7280', bgClass: 'bg-gray-100 text-gray-700' },
  sourcing: { label: 'Sourcing', color: '#8B5CF6', bgClass: 'bg-violet-100 text-violet-700' },
  quoted: { label: 'Quoted', color: '#6366F1', bgClass: 'bg-indigo-100 text-indigo-700' },
  confirmed: { label: 'Confirmed', color: '#3B82F6', bgClass: 'bg-blue-100 text-blue-700' },
  reserved: { label: 'Reserved', color: '#0EA5E9', bgClass: 'bg-sky-100 text-sky-700' },
  in_transit: { label: 'In Transit', color: '#F59E0B', bgClass: 'bg-amber-100 text-amber-700' },
  delivered: { label: 'Delivered', color: '#10B981', bgClass: 'bg-emerald-100 text-emerald-700' },
  inspected: { label: 'Inspected', color: '#059669', bgClass: 'bg-green-100 text-green-700' },
  setup_complete: { label: 'Set Up', color: '#047857', bgClass: 'bg-green-100 text-green-800' },
  active: { label: 'Active', color: '#10B981', bgClass: 'bg-emerald-100 text-emerald-800' },
  struck: { label: 'Struck', color: '#F97316', bgClass: 'bg-orange-100 text-orange-700' },
  returned: { label: 'Returned', color: '#6B7280', bgClass: 'bg-gray-100 text-gray-700' },
  damaged: { label: 'Damaged', color: '#EF4444', bgClass: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelled', color: '#9CA3AF', bgClass: 'bg-gray-100 text-gray-500' },
};

export const ADVANCE_TYPE_CONFIG: Record<AdvanceType, { label: string; icon: string; description: string }> = {
  access: { label: 'Access & Credentials', icon: 'KeyRound', description: 'Badges, parking, credentials' },
  production: { label: 'Production', icon: 'Clapperboard', description: 'Equipment, staging, logistics' },
  technical: { label: 'Technical', icon: 'Wrench', description: 'Audio, video, lighting, power' },
  hospitality: { label: 'Hospitality', icon: 'UtensilsCrossed', description: 'Catering, facilities, site services' },
  travel: { label: 'Travel & Transport', icon: 'Truck', description: 'Vehicles, freight, hotels' },
  labor: { label: 'Labor & Crew', icon: 'HardHat', description: 'Stagehands, technicians, specialists' },
  custom: { label: 'Custom', icon: 'Boxes', description: 'Custom advance type' },
};

export const PRIORITY_CONFIG: Record<AdvancePriority, { label: string; color: string; bgClass: string }> = {
  critical: { label: 'Critical', color: '#DC2626', bgClass: 'bg-red-100 text-red-700' },
  high: { label: 'High', color: '#F97316', bgClass: 'bg-orange-100 text-orange-700' },
  medium: { label: 'Medium', color: '#3B82F6', bgClass: 'bg-blue-100 text-blue-700' },
  low: { label: 'Low', color: '#6B7280', bgClass: 'bg-gray-100 text-gray-700' },
};

/* ─────────────────────────────────────────────────────────
   Tier Limits
   ───────────────────────────────────────────────────────── */

export const TIER_LIMITS = {
  free: {
    advancesPerMonth: 3,
    lineItemsPerAdvance: 10,
    templates: 0,
    customCatalogItems: 0,
    collectionMode: false,
    collaboratorsPerAdvance: 0,
    accessCodesPerAdvance: 0,
    inventoryTracking: false,
    exportCsvPdf: false,
    fulfillmentStates: 3,
    webhookEvents: false,
    apiAccess: false,
  },
  starter: {
    advancesPerMonth: 25,
    lineItemsPerAdvance: 50,
    templates: 5,
    customCatalogItems: 10,
    collectionMode: false,
    collaboratorsPerAdvance: 0,
    accessCodesPerAdvance: 0,
    inventoryTracking: true, // basic
    exportCsvPdf: true,
    fulfillmentStates: 14,
    webhookEvents: false,
    apiAccess: false,
  },
  professional: {
    advancesPerMonth: Infinity,
    lineItemsPerAdvance: Infinity,
    templates: Infinity,
    customCatalogItems: 100,
    collectionMode: true,
    collaboratorsPerAdvance: 10,
    accessCodesPerAdvance: 5,
    inventoryTracking: true,
    exportCsvPdf: true,
    fulfillmentStates: 14,
    webhookEvents: true,
    apiAccess: true,
  },
  enterprise: {
    advancesPerMonth: Infinity,
    lineItemsPerAdvance: Infinity,
    templates: Infinity,
    customCatalogItems: Infinity,
    collectionMode: true,
    collaboratorsPerAdvance: Infinity,
    accessCodesPerAdvance: Infinity,
    inventoryTracking: true, // multi-location
    exportCsvPdf: true,
    fulfillmentStates: 14,
    webhookEvents: true,
    apiAccess: true,
  },
} as const;

/* ─────────────────────────────────────────────────────────
   List Tabs
   ───────────────────────────────────────────────────────── */

export const ADVANCE_LIST_TABS = [
  { id: 'all', label: 'All' },
  { id: 'my_advances', label: 'My Advances' },
  { id: 'pending_review', label: 'Pending Review' },
  { id: 'collaborations', label: 'Collaborations' },
  { id: 'approved', label: 'Approved' },
  { id: 'fulfilled', label: 'Fulfilled' },
] as const;
