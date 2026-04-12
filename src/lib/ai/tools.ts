/**
 * AI Copilot tool definitions — Claude tool-use schema.
 *
 * Each tool maps to a Supabase query scoped to the user's organization.
 * Tools are permission-aware and return structured data for Claude to synthesize.
 *
 * AI SDK v6: tools are plain objects with description, parameters, and execute.
 *
 * @module lib/ai/tools
 */

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
    query_proposals: {
      description:
        'Search and summarize proposals. Use when the user asks about proposals, quotes, projects, or scope.',
      inputSchema: z.object({
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
      execute: async ({ status, client_name, limit }: { status?: string; client_name?: string; limit: number }) => {
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
                (clientData ?? []).map((c: { id: string; company_name: string }) => [c.id, c.company_name])
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
    },

    query_invoices: {
      description:
        'Query invoices and accounts receivable. Use for billing, payment, revenue, and collection questions.',
      inputSchema: z.object({
        status: z
          .enum(['draft', 'sent', 'paid', 'overdue', 'void', 'partial'])
          .optional()
          .describe('Filter by invoice status'),
        limit: z.number().min(1).max(50).default(10),
      }),
      execute: async ({ status, limit }: { status?: string; limit: number }) => {
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
    },

    query_pipeline: {
      description:
        'Query sales pipeline deals. Use for deal, funnel, pipeline, and sales forecast questions.',
      inputSchema: z.object({
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
      execute: async ({ stage, limit }: { stage?: string; limit: number }) => {
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
    },

    query_clients: {
      description:
        'Look up client/customer information and their relationship history.',
      inputSchema: z.object({
        search: z
          .string()
          .optional()
          .describe('Search clients by company name (partial match)'),
        limit: z.number().min(1).max(50).default(10),
      }),
      execute: async ({ search, limit }: { search?: string; limit: number }) => {
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
    },

    query_expenses: {
      description:
        'Query expense records and pending approvals. Use for spend analysis and reimbursement questions.',
      inputSchema: z.object({
        status: z
          .enum(['pending', 'approved', 'rejected', 'reimbursed'])
          .optional(),
        limit: z.number().min(1).max(50).default(10),
      }),
      execute: async ({ status, limit }: { status?: string; limit: number }) => {
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
    },

    query_tasks: {
      description:
        'Query tasks and to-do items. Use for project status, workload, and task management questions.',
      inputSchema: z.object({
        status: z
          .enum(['todo', 'in_progress', 'done', 'blocked', 'cancelled'])
          .optional(),
        assignee_name: z.string().optional().describe('Filter by assignee name'),
        limit: z.number().min(1).max(50).default(10),
      }),
      execute: async ({ status, assignee_name, limit }: { status?: string; assignee_name?: string; limit: number }) => {
        try {
          let query = supabase
            .from('tasks')
            .select('title, status, priority, due_date, created_at, assignee_id')
            .eq('organization_id', orgId)
            .order('due_date', { ascending: true })
            .limit(limit);

          if (status) query = query.eq('status', status);

          const { data, error } = await query;
          if (error) throw error;

          let tasks = data ?? [];

          // GAP-27: Filter by assignee name if provided
          if (assignee_name && tasks.length > 0) {
            const assigneeIds = [...new Set(tasks.map((t) => t.assignee_id).filter(Boolean) as string[])];
            if (assigneeIds.length > 0) {
              const { data: users } = await supabase
                .from('users')
                .select('id, full_name')
                .in('id', assigneeIds);
              const userMap = Object.fromEntries(
                (users ?? []).map((u: { id: string; full_name: string }) => [u.id, u.full_name])
              );
              const search = assignee_name.toLowerCase();
              tasks = tasks.filter(
                (t) => t.assignee_id && userMap[t.assignee_id]?.toLowerCase().includes(search)
              );
            } else {
              tasks = [];
            }
          }

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
    },

    query_team: {
      description:
        'Query team member information and headcount.',
      inputSchema: z.object({
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ limit }: { limit: number }) => {
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
              role: (m.roles as { name?: string | null })?.name ?? 'member',
            })),
          };
        } catch (error) {
          log.error('query_team failed', {}, error);
          return { error: 'Failed to query team', total_members: 0, members: [] };
        }
      },
    },

    query_events: {
      description:
        'Query upcoming events, activations, and locations.',
      inputSchema: z.object({
        limit: z.number().min(1).max(20).default(10),
      }),
      execute: async ({ limit }: { limit: number }) => {
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
    },

    query_budgets: {
      description:
        'Query project budgets. Use for budget utilization, over/under budget, and cost tracking questions.',
      inputSchema: z.object({
        limit: z.number().min(1).max(20).default(10),
      }),
      execute: async ({ limit }: { limit: number }) => {
        try {
          const { data, error } = await supabase
            .from('project_budgets')
            .select('name, total_budget, spent, remaining, status, proposal_id')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
            .limit(limit);

          if (error) throw error;

          const budgets = data ?? [];
          const totalBudgeted = budgets.reduce((s, b) => s + (b.total_budget ?? 0), 0);
          const totalSpent = budgets.reduce((s, b) => s + (b.spent ?? 0), 0);
          const overBudget = budgets.filter((b) => (b.spent ?? 0) > (b.total_budget ?? 0));

          return {
            count: budgets.length,
            total_budgeted: totalBudgeted,
            total_spent: totalSpent,
            utilization_pct: totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0,
            over_budget_count: overBudget.length,
            budgets: budgets.map((b) => ({
              name: b.name,
              budget: b.total_budget,
              spent: b.spent,
              remaining: b.remaining,
              status: b.status,
            })),
          };
        } catch (error) {
          log.error('query_budgets failed', {}, error);
          return { error: 'Failed to query budgets', count: 0, budgets: [] };
        }
      },
    },

    query_crew: {
      description:
        'Query crew members, their roles, and availability. Use for staffing, headcount, and crew management questions.',
      inputSchema: z.object({
        status: z.enum(['active', 'inactive', 'on_leave']).optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
      execute: async ({ status, limit }: { status?: string; limit: number }) => {
        try {
          let query = supabase
            .from('crew_profiles')
            .select('name, role, status, daily_rate, phone, email')
            .eq('organization_id', orgId)
            .order('name', { ascending: true })
            .limit(limit);

          if (status) query = query.eq('status', status);

          const { data, error } = await query;
          if (error) throw error;

          const crew = data ?? [];
          const byRole: Record<string, number> = {};
          for (const c of crew) {
            const r = c.role ?? 'unassigned';
            byRole[r] = (byRole[r] ?? 0) + 1;
          }

          return {
            count: crew.length,
            by_role: byRole,
            crew: crew.map((c) => ({
              name: c.name,
              role: c.role,
              status: c.status,
              daily_rate: c.daily_rate,
            })),
          };
        } catch (error) {
          log.error('query_crew failed', {}, error);
          return { error: 'Failed to query crew', count: 0, crew: [] };
        }
      },
    },

    query_equipment: {
      description:
        'Query equipment inventory and availability. Use for equipment status, maintenance, and utilization questions.',
      inputSchema: z.object({
        status: z.enum(['available', 'in_use', 'maintenance', 'retired']).optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
      execute: async ({ status, limit }: { status?: string; limit: number }) => {
        try {
          let query = supabase
            .from('assets')
            .select('name, category, status, serial_number, purchase_cost, location')
            .eq('organization_id', orgId)
            .order('name', { ascending: true })
            .limit(limit);

          if (status) query = query.eq('status', status);

          const { data, error } = await query;
          if (error) throw error;

          const equipment = data ?? [];
          const byStatus: Record<string, number> = {};
          for (const e of equipment) {
            const s = e.status ?? 'unknown';
            byStatus[s] = (byStatus[s] ?? 0) + 1;
          }

          return {
            count: equipment.length,
            by_status: byStatus,
            equipment: equipment.map((e) => ({
              name: e.name,
              category: e.category,
              status: e.status,
              serial: e.serial_number,
              cost: e.purchase_cost,
              location: e.location,
            })),
          };
        } catch (error) {
          log.error('query_equipment failed', {}, error);
          return { error: 'Failed to query equipment', count: 0, equipment: [] };
        }
      },
    },

    query_time_entries: {
      description:
        'Query time tracking entries. Use for billable hours, utilization, timesheet, and work-hours questions.',
      inputSchema: z.object({
        billable: z.boolean().optional().describe('Filter by billable status'),
        limit: z.number().min(1).max(50).default(20),
      }),
      execute: async ({ billable, limit }: { billable?: boolean; limit: number }) => {
        try {
          let query = supabase
            .from('time_entries')
            .select('description, hours, billable, date, user_id, proposal_id')
            .eq('organization_id', orgId)
            .order('date', { ascending: false })
            .limit(limit);

          if (billable !== undefined) query = query.eq('billable', billable);

          const { data, error } = await query;
          if (error) throw error;

          const entries = data ?? [];
          const totalHours = entries.reduce((s, e) => s + (e.hours ?? 0), 0);
          const billableHours = entries.filter((e) => e.billable).reduce((s, e) => s + (e.hours ?? 0), 0);

          return {
            count: entries.length,
            total_hours: totalHours,
            billable_hours: billableHours,
            utilization_pct: totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0,
            entries: entries.map((e) => ({
              description: e.description,
              hours: e.hours,
              billable: e.billable,
              date: e.date,
            })),
          };
        } catch (error) {
          log.error('query_time_entries failed', {}, error);
          return { error: 'Failed to query time entries', count: 0, entries: [] };
        }
      },
    },

    navigate_to: {
      description:
        'Suggest a navigation link for the user. Use when the answer involves directing the user to a specific page.',
      inputSchema: z.object({
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
      execute: async ({ page, reason }: { page: string; reason: string }) => {
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
          label: page.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
          reason,
        };
      },
    },
  };
}
