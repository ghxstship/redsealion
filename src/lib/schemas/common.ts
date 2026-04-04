/**
 * Shared Zod validation schemas — SSOT for request shapes.
 *
 * TypeScript types are derived from these schemas using z.infer<>.
 * Both client-side forms and server-side API routes import from here.
 *
 * @module lib/schemas/common
 */

import { z } from 'zod';

// ─── Pagination ────────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// ─── Common ID Params ──────────────────────────────────────────────────────

export const uuidParam = z.string().uuid('Invalid UUID format');

// ─── Sorting ───────────────────────────────────────────────────────────────

export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ─── Search / Filter ───────────────────────────────────────────────────────

export const searchSchema = z.object({
  search: z.string().trim().max(200).optional(),
});

// ─── Proposal Schemas ──────────────────────────────────────────────────────

export const proposalStatusSchema = z.enum([
  'draft', 'sent', 'viewed', 'negotiating', 'approved',
  'in_production', 'active', 'complete', 'cancelled',
]);

export const proposalListQuerySchema = paginationSchema.merge(searchSchema).merge(sortSchema).extend({
  status: proposalStatusSchema.optional(),
  client_id: uuidParam.optional(),
});

export type ProposalListQuery = z.infer<typeof proposalListQuerySchema>;

// ─── Client Schemas ────────────────────────────────────────────────────────

export const clientCreateSchema = z.object({
  company_name: z.string().trim().min(1, 'Company name is required').max(200),
  industry: z.string().trim().max(100).nullable().optional(),
  website: z.string().url().nullable().optional(),
  linkedin: z.string().url().nullable().optional(),
  source: z.string().trim().max(100).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  tags: z.array(z.string().trim().max(50)).max(20).default([]),
  billing_address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
  }).nullable().optional(),
});

export type ClientCreateInput = z.infer<typeof clientCreateSchema>;

export const clientUpdateSchema = clientCreateSchema.partial();

export type ClientUpdateInput = z.infer<typeof clientUpdateSchema>;

// ─── Invoice Schemas ───────────────────────────────────────────────────────

export const invoiceStatusSchema = z.enum([
  'draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'void',
]);

export const invoiceTypeSchema = z.enum([
  'deposit', 'balance', 'change_order', 'addon', 'final', 'recurring',
]);

// ─── Task Schemas ──────────────────────────────────────────────────────────

export const taskStatusSchema = z.enum([
  'todo', 'in_progress', 'review', 'done', 'blocked', 'cancelled',
]);

export const taskPrioritySchema = z.enum([
  'low', 'medium', 'high', 'urgent',
]);

export const taskCreateSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(500),
  description: z.string().max(10000).nullable().optional(),
  status: taskStatusSchema.default('todo'),
  priority: taskPrioritySchema.default('medium'),
  assignee_id: uuidParam.nullable().optional(),
  proposal_id: uuidParam.nullable().optional(),
  phase_id: uuidParam.nullable().optional(),
  due_date: z.string().datetime().nullable().optional(),
  start_date: z.string().datetime().nullable().optional(),
  estimated_hours: z.number().min(0).nullable().optional(),
});

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;

export const taskUpdateSchema = taskCreateSchema.partial();

export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;

// ─── Lead Schemas ──────────────────────────────────────────────────────────

export const leadStatusSchema = z.enum([
  'new', 'contacted', 'qualified', 'converted', 'lost',
]);

// ─── Deal Schemas ──────────────────────────────────────────────────────────

export const dealStageSchema = z.enum([
  'lead', 'qualified', 'proposal_sent', 'negotiation',
  'verbal_yes', 'contract_signed', 'lost', 'on_hold',
]);
