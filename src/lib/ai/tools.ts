/**
 * AI Copilot tool definitions — Claude tool-use schema.
 *
 * Each tool maps to a Supabase query scoped to the user's organization.
 * Tools are permission-aware and return structured data for Claude to synthesize.
 *
 * @module lib/ai/tools
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/logger';

const log = createLogger('ai-tools');

/**
 * Build the tool registry for a given org context.
 * Each tool closure captures the supabase client and org ID.
 */
export function buildCopilotTools(
  supabase: SupabaseClient,
  orgId: string
) {
  return {
    query_proposals: tool({
      description:
        'Search and summarize proposals. Use when the user asks about proposals, quotes, projects, or scope.',
      parameters: z.object({
        status: z
          .enum([
            'draft',
            'sent',
            'viewed',
            'approved',
            'rejected',
            'in_production',
            'complete',
            'archived',
          ])
          .optional()
          .describe('Filter by proposal status'),
        client_name: z
          .string()
          .optional()
          .describe('Filter by client name (partial match)'),
        limit: z
          .number()
          .min(1)
          .max(50)
          .default(10)
          .describe('Max number of results'),
      }),
      execute: async ({ status, client_name, limit }) => {
        try {
          let query = supabase
            .from('proposals')
            .select(
              'id, name, status, total_value, created_at, client_id'
            )
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
            .limit(limit);

          if (status) query = query.eq('status', status);

          const { data: proposals, error } = await query;
          if (error) throw error;

          // Resolve client names
          let clients: Record<string, string> = {};
          if (proposals && proposals.length > 0) {
            const clientIds = [
              ...new Set(
                proposals
                  .map((p) => p.client_id)
                  .filter(Boolean) as string[]
              ),
            ];
            if (clientIds.length > 0) {
              const { data: clientData } = await supabase
                .from('clients')
                .select('id, company_name')
                .in('id', clientIds);
              clients = Object.fromEntries(
                (clientData ?? []).map((c) => [c.id, c.company_name])
              );
            }
          }

          // Filter by client name if specified
          let results = (proposals ?? []).map((p) => ({
            name: p.name,
            status: p.status,
            total_value: p.total_value,
            client: clients[p.client_id] ?? 'Unknown',
            created_at: p.created_at,
          }));

          if (client_name) {
            const search = client_name.toLowerCase();
            results = results.filter((r) =>
              r.client.toLowerCase().includes(search)
            );
          }

          const totalValue = results.reduce(
            (sum, p) => sum + (p.total_value ?? 0),
            0
          );

          return {
            count: results.length,
            total_value: totalValue,
            proposals: results,
          };
        } catch (error) {
          log.error('query_proposals failed', {}, error);
          return { error: 'Failed to query proposals', count: 0, proposals: [] };
        }
      },
    }),

    query_invoices: tool({
      description:
        'Query invoices and accounts receivable. Use for billing, payment, revenue, and collection questions.',
      parameters: z.object({
        status: z
          .enum(['draft', 'sent', 'paid', 'overdue', 'void', 'partial'])
          .optional()
          .describe('Filter by invoice status'),
        limit: z.number().min(1).max(50).default(10),
      }),
      execute: async ({ status, limit }) => {
        try {
          let query = supabase
            .from('invoices')
            .select(
              'invoice_number, status, total, amount_paid, due_date, paid_date, memo'
            )
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
            .limit(limit);

          if (status) query = query.eq('status', status);

          const { data, error } = await query;
          if (error) throw error;

          const invoices = data ?? [];
          const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0);
          const totalCollected = invoices.reduce(
            (s, i) => s + i.amount_paid,
            0
          );
          const totalOutstanding = totalInvoiced - totalCollected;

          return {
            count: invoices.length,
            total_invoiced: totalInvoiced,
            total_collected: totalCollected,
            total_outstanding: totalOutstanding,
            invoices: invoices.map((i) => ({
              number: i.invoice_number,
              status: i.status,
              total: i.total,
              paid: i.amount_paid,
              outstanding: i.total - i.amount_paid,
              due_date: i.due_date,
              paid_date: i.paid_date,
            })),
          };
        } catch (error) {
          log.error('query_invoices failed', {}, error);
          return { error: 'Failed to query invoices', count: 0, invoices: [] };
        }
      },
    }),

    query_pipeline: tool({
      description:
        'Query sales pipeline deals. Use for deal, funnel, pipeline, and sales forecast questions.',
      parameters: z.object({
        stage: z
          .enum([
            'lead',
            'qualified',
            'proposal_sent',
            'negotiation',
            'contract_signed',
            'closed_won',
            'closed_lost',
          ])
          .optional()
          .describe('Filter by deal stage'),
        limit: z.number().min(1).max(50).default(20),
      }),
      execute: async ({ stage, limit }) => {
        try {
          let query = supabase
            .from('deals')
            .select('title, stage, deal_value, probability, created_at')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
            .limit(limit);

          if (stage) query = query.eq('stage', stage);

          const { data, error } = await query;
          if (error) throw error;

          const deals = data ?? [];
          const totalValue = deals.reduce((s, d) => s + d.deal_value, 0);
          const weightedValue = deals.reduce(
            (s, d) => s + d.deal_value * (d.probability / 100),
            0
          );

          // Group by stage
          const byStage: Record<string, { count: number; value: number }> = {};
          for (const d of deals) {
            const s = d.stage.replace(/_/g, ' ');
            if (!byStage[s]) byStage[s] = { count: 0, value: 0 };
            byStage[s].count++;
            byStage[s].value += d.deal_value;
          }

          return {
            count: deals.length,
            total_pipeline_value: totalValue,
            weighted_value: weightedValue,
            by_stage: byStage,
            deals: deals.map((d) => ({
              title: d.title,
              stage: d.stage.replace(/_/g, ' '),
              value: d.deal_value,
              probability: d.probability,
            })),
          };
        } catch (error) {
          log.error('query_pipeline failed', {}, error);
          return { error: 'Failed to query pipeline', count: 0, deals: [] };
        }
      },
    }),

    query_clients: tool({
      description:
        'Look up client/customer information and their relationship history.',
      parameters: z.object({
        search: z
          .string()
          .optional()
          .describe('Search clients by company name (partial match)'),
        limit: z.number().min(1).max(50).default(10),
      }),
      execute: async ({ search, limit }) => {
        try {
          let query = supabase
            .from('clients')
            .select('id, company_name, contact_name, contact_email, phone, status, created_at')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
            .limit(limit);

          if (search) query = query.ilike('company_name', `%${search}%`);

          const { data, error } = await query;
          if (error) throw error;

          return {
            count: (data ?? []).length,
            clients: (data ?? []).map((c) => ({
              name: c.company_name,
              contact: c.contact_name,
              email: c.contact_email,
              phone: c.phone,
              status: c.status,
            })),
          };
        } catch (error) {
          log.error('query_clients failed', {}, error);
          return { error: 'Failed to query clients', count: 0, clients: [] };
        }
      },
    }),

    query_expenses: tool({
      description:
        'Query expense records and pending approvals. Use for spend analysis and reimbursement questions.',
      parameters: z.object({
        status: z
          .enum(['pending', 'approved', 'rejected', 'reimbursed'])
          .optional(),
        limit: z.number().min(1).max(50).default(10),
      }),
      execute: async ({ status, limit }) => {
        try {
          let query = supabase
            .from('expenses')
            .select('description, amount, category, status, date, vendor')
            .eq('organization_id', orgId)
            .order('date', { ascending: false })
            .limit(limit);

          if (status) query = query.eq('status', status);

          const { data, error } = await query;
          if (error) throw error;

          const expenses = data ?? [];
          const total = expenses.reduce((s, e) => s + (e.amount ?? 0), 0);

          return {
            count: expenses.length,
            total_amount: total,
            expenses: expenses.map((e) => ({
              description: e.description,
              amount: e.amount,
              category: e.category,
              status: e.status,
              date: e.date,
              vendor: e.vendor,
            })),
          };
        } catch (error) {
          log.error('query_expenses failed', {}, error);
          return { error: 'Failed to query expenses', count: 0, expenses: [] };
        }
      },
    }),

    query_tasks: tool({
      description:
        'Query tasks and to-do items. Use for project status, workload, and task management questions.',
      parameters: z.object({
        status: z
          .enum(['todo', 'in_progress', 'done', 'blocked', 'cancelled'])
          .optional(),
        assignee_name: z.string().optional().describe('Filter by assignee name'),
        limit: z.number().min(1).max(50).default(10),
      }),
      execute: async ({ status, limit }) => {
        try {
          let query = supabase
            .from('tasks')
            .select('title, status, priority, due_date, created_at')
            .eq('organization_id', orgId)
            .order('due_date', { ascending: true })
            .limit(limit);

          if (status) query = query.eq('status', status);

          const { data, error } = await query;
          if (error) throw error;

          const tasks = data ?? [];
          const byStatus: Record<string, number> = {};
          for (const t of tasks) {
            byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
          }

          return {
            count: tasks.length,
            by_status: byStatus,
            tasks: tasks.map((t) => ({
              title: t.title,
              status: t.status,
              priority: t.priority,
              due_date: t.due_date,
            })),
          };
        } catch (error) {
          log.error('query_tasks failed', {}, error);
          return { error: 'Failed to query tasks', count: 0, tasks: [] };
        }
      },
    }),

    query_team: tool({
      description:
        'Query team member information and headcount.',
      parameters: z.object({
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ limit }) => {
        try {
          const { data, error, count } = await supabase
            .from('organization_memberships')
            .select('user_id, status, roles(name)', { count: 'exact' })
            .eq('organization_id', orgId)
            .eq('status', 'active')
            .limit(limit);

          if (error) throw error;

          return {
            total_members: count ?? (data ?? []).length,
            members: (data ?? []).map((m) => ({
              status: m.status,
              role: (m.roles as unknown as { name: string })?.name ?? 'member',
            })),
          };
        } catch (error) {
          log.error('query_team failed', {}, error);
          return { error: 'Failed to query team', total_members: 0, members: [] };
        }
      },
    }),

    query_events: tool({
      description:
        'Query upcoming events, activations, and locations.',
      parameters: z.object({
        limit: z.number().min(1).max(20).default(10),
      }),
      execute: async ({ limit }) => {
        try {
          const { data, error } = await supabase
            .from('events')
            .select('name, status, start_date, end_date, venue')
            .eq('organization_id', orgId)
            .order('start_date', { ascending: true })
            .limit(limit);

          if (error) throw error;

          return {
            count: (data ?? []).length,
            events: (data ?? []).map((e) => ({
              name: e.name,
              status: e.status,
              start_date: e.start_date,
              end_date: e.end_date,
              venue: e.venue,
            })),
          };
        } catch (error) {
          log.error('query_events failed', {}, error);
          return { error: 'Failed to query events', count: 0, events: [] };
        }
      },
    }),

    navigate_to: tool({
      description:
        'Suggest a navigation link for the user. Use when the answer involves directing the user to a specific page.',
      parameters: z.object({
        page: z
          .enum([
            'dashboard',
            'proposals',
            'pipeline',
            'clients',
            'invoices',
            'expenses',
            'tasks',
            'calendar',
            'people',
            'crew',
            'workloads',
            'equipment',
            'warehouse',
            'reports',
            'settings',
            'budgets',
            'time',
          ])
          .describe('The page to navigate to'),
        reason: z.string().describe('Why the user should visit this page'),
      }),
      execute: async ({ page, reason }) => {
        const routes: Record<string, string> = {
          dashboard: '/app',
          proposals: '/app/proposals',
          pipeline: '/app/pipeline',
          clients: '/app/clients',
          invoices: '/app/invoices',
          expenses: '/app/expenses',
          tasks: '/app/tasks',
          calendar: '/app/calendar',
          people: '/app/people',
          crew: '/app/crew',
          workloads: '/app/workloads',
          equipment: '/app/equipment',
          warehouse: '/app/logistics',
          reports: '/app/reports',
          settings: '/app/settings',
          budgets: '/app/budgets',
          time: '/app/time',
        };
        return {
          url: routes[page] ?? '/app',
          label: page.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          reason,
        };
      },
    }),
  };
}
