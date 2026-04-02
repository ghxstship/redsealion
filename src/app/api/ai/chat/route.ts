import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireFeature } from '@/lib/api/tier-guard';
import { buildSystemPrompt } from '@/lib/ai/prompts';
import { gatherContext } from '@/lib/ai/context';
import {
  getSeedProposals,
  getSeedClients,
  getSeedDeals,
  getSeedInvoices,
} from '@/lib/seed-data';

type Intent =
  | 'proposal'
  | 'revenue'
  | 'client'
  | 'invoice'
  | 'overdue'
  | 'team'
  | 'status'
  | 'pipeline'
  | 'general';

function detectIntent(message: string): Intent {
  const lower = message.toLowerCase();

  if (/overdue|past\s*due|late\s+payment/.test(lower)) return 'overdue';
  if (/invoice|billing|payment(?!.*term)/.test(lower)) return 'invoice';
  if (/revenue|income|earned|paid/.test(lower)) return 'revenue';
  if (/pipeline|deal|stage|funnel/.test(lower)) return 'pipeline';
  if (/client|customer|account/.test(lower)) return 'client';
  if (/team|member|staff|employee/.test(lower)) return 'team';
  if (/status|overview|summary|how.*doing/.test(lower)) return 'status';
  if (/proposal|project|scope/.test(lower)) return 'proposal';

  return 'general';
}

const currencyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

interface ProposalRow {
  name: string;
  status: string;
  total_value: number;
  client_id?: string;
}

interface ClientRow {
  id: string;
  company_name: string;
}

interface DealRow {
  title: string;
  stage: string;
  value: number;
  probability: number;
}

interface InvoiceRow {
  invoice_number: string;
  status: string;
  total: number;
  amount_paid: number;
  due_date: string;
  paid_date: string | null;
  memo: string | null;
}

async function buildIntentResponse(
  intent: Intent,
  supabase: Awaited<ReturnType<typeof createClient>> | null,
  orgId: string | null
): Promise<string> {
  // Try to fetch real data, fall back to seed data
  let proposals: ProposalRow[] = [];
  let clients: ClientRow[] = [];
  let deals: DealRow[] = [];
  let invoices: InvoiceRow[] = [];

  if (supabase && orgId) {
    try {
      const [propRes, clientRes, dealRes, invRes] = await Promise.all([
        supabase
          .from('proposals')
          .select('name, status, total_value, client_id')
          .eq('organization_id', orgId),
        supabase
          .from('clients')
          .select('id, company_name')
          .eq('organization_id', orgId),
        supabase
          .from('deals')
          .select('title, stage, value, probability')
          .eq('organization_id', orgId),
        supabase
          .from('invoices')
          .select(
            'invoice_number, status, total, amount_paid, due_date, paid_date, memo'
          )
          .eq('organization_id', orgId),
      ]);

      proposals = (propRes.data ?? []) as ProposalRow[];
      clients = (clientRes.data ?? []) as ClientRow[];
      deals = (dealRes.data ?? []) as DealRow[];
      invoices = (invRes.data ?? []) as InvoiceRow[];
    } catch {
      // Fall through to seed data
    }
  }

  // Use seed data if nothing loaded
  if (proposals.length === 0) {
    const seedP = getSeedProposals();
    proposals = seedP.map((p) => ({
      name: p.name,
      status: p.status,
      total_value: p.total_value,
      client_id: p.client_id,
    }));
  }
  if (clients.length === 0) {
    clients = getSeedClients().map((c) => ({ id: c.id, company_name: c.company_name }));
  }
  if (deals.length === 0) {
    deals = getSeedDeals().map((d) => ({
      title: d.title,
      stage: d.stage,
      value: d.value,
      probability: d.probability,
    }));
  }
  if (invoices.length === 0) {
    invoices = getSeedInvoices().map((i) => ({
      invoice_number: i.invoice_number,
      status: i.status,
      total: i.total,
      amount_paid: i.amount_paid,
      due_date: i.due_date,
      paid_date: i.paid_date,
      memo: i.memo,
    }));
  }

  switch (intent) {
    case 'proposal': {
      const total = proposals.length;
      const totalValue = proposals.reduce((s, p) => s + p.total_value, 0);
      const byStatus: Record<string, number> = {};
      for (const p of proposals) {
        const label = p.status.replace(/_/g, ' ');
        byStatus[label] = (byStatus[label] ?? 0) + 1;
      }
      const statusBreakdown = Object.entries(byStatus)
        .map(([s, c]) => `  - ${s}: ${c}`)
        .join('\n');

      const listing = proposals
        .map((p) => `  - ${p.name} (${p.status.replace(/_/g, ' ')}) -- ${currencyFmt.format(p.total_value)}`)
        .join('\n');

      return (
        `You have ${total} proposals with a combined value of ${currencyFmt.format(totalValue)}.\n\n` +
        `Status breakdown:\n${statusBreakdown}\n\n` +
        `Proposals:\n${listing}`
      );
    }

    case 'revenue': {
      const paidInvoices = invoices.filter((i) => i.status === 'paid');
      const totalPaid = paidInvoices.reduce((s, i) => s + i.amount_paid, 0);
      const outstanding = invoices
        .filter((i) => i.status !== 'paid' && i.status !== 'void' && i.status !== 'draft')
        .reduce((s, i) => s + (i.total - i.amount_paid), 0);

      return (
        `Revenue summary:\n\n` +
        `  - Total collected: ${currencyFmt.format(totalPaid)} (${paidInvoices.length} paid invoice${paidInvoices.length !== 1 ? 's' : ''})\n` +
        `  - Outstanding receivables: ${currencyFmt.format(outstanding)}\n` +
        `  - Total pipeline value: ${currencyFmt.format(deals.reduce((s, d) => s + d.value, 0))}\n` +
        `  - Weighted pipeline: ${currencyFmt.format(deals.reduce((s, d) => s + d.value * (d.probability / 100), 0))}`
      );
    }

    case 'client': {
      const clientMap = new Map(clients.map((c) => [c.id, c.company_name]));
      const clientProposals: Record<string, { count: number; value: number }> = {};

      for (const p of proposals) {
        const name = clientMap.get(p.client_id ?? '') ?? 'Unknown';
        if (!clientProposals[name]) clientProposals[name] = { count: 0, value: 0 };
        clientProposals[name].count++;
        clientProposals[name].value += p.total_value;
      }

      const lines = Object.entries(clientProposals)
        .sort((a, b) => b[1].value - a[1].value)
        .map(
          ([name, data]) =>
            `  - ${name}: ${data.count} proposal${data.count !== 1 ? 's' : ''}, ${currencyFmt.format(data.value)} total value`
        )
        .join('\n');

      return `Client summary (${clients.length} clients):\n\n${lines}`;
    }

    case 'invoice': {
      const byStatus: Record<string, { count: number; total: number }> = {};
      for (const inv of invoices) {
        if (!byStatus[inv.status]) byStatus[inv.status] = { count: 0, total: 0 };
        byStatus[inv.status].count++;
        byStatus[inv.status].total += inv.total;
      }

      const lines = Object.entries(byStatus)
        .map(
          ([s, d]) =>
            `  - ${s}: ${d.count} invoice${d.count !== 1 ? 's' : ''}, ${currencyFmt.format(d.total)}`
        )
        .join('\n');

      return (
        `Invoice summary (${invoices.length} total):\n\n${lines}\n\n` +
        `Total invoiced: ${currencyFmt.format(invoices.reduce((s, i) => s + i.total, 0))}\n` +
        `Total collected: ${currencyFmt.format(invoices.reduce((s, i) => s + i.amount_paid, 0))}`
      );
    }

    case 'overdue': {
      const overdue = invoices.filter((i) => i.status === 'overdue');
      if (overdue.length === 0) {
        return 'Great news -- there are no overdue invoices at this time.';
      }

      const lines = overdue
        .map(
          (i) =>
            `  - ${i.invoice_number}: ${currencyFmt.format(i.total - i.amount_paid)} outstanding (due ${i.due_date})\n    ${i.memo}`
        )
        .join('\n');

      const totalOverdue = overdue.reduce(
        (s, i) => s + (i.total - i.amount_paid),
        0
      );

      return (
        `There ${overdue.length === 1 ? 'is' : 'are'} ${overdue.length} overdue invoice${overdue.length !== 1 ? 's' : ''} totaling ${currencyFmt.format(totalOverdue)}:\n\n` +
        lines
      );
    }

    case 'pipeline': {
      const stageOrder = [
        'lead',
        'qualified',
        'proposal_sent',
        'negotiation',
        'contract_signed',
      ];
      const byStage: Record<string, { count: number; value: number }> = {};
      for (const d of deals) {
        const stage = d.stage.replace(/_/g, ' ');
        if (!byStage[stage]) byStage[stage] = { count: 0, value: 0 };
        byStage[stage].count++;
        byStage[stage].value += d.value;
      }

      const lines = stageOrder
        .map((s) => s.replace(/_/g, ' '))
        .filter((s) => byStage[s])
        .map(
          (s) =>
            `  - ${s}: ${byStage[s].count} deal${byStage[s].count !== 1 ? 's' : ''}, ${currencyFmt.format(byStage[s].value)}`
        )
        .join('\n');

      const totalValue = deals.reduce((s, d) => s + d.value, 0);
      const weighted = deals.reduce(
        (s, d) => s + d.value * (d.probability / 100),
        0
      );

      return (
        `Pipeline summary (${deals.length} deals):\n\n${lines}\n\n` +
        `Total pipeline value: ${currencyFmt.format(totalValue)}\n` +
        `Weighted value: ${currencyFmt.format(weighted)}`
      );
    }

    case 'team': {
      let teamCount = 0;
      if (supabase && orgId) {
        try {
          const { count } = await supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId);
          teamCount = count ?? 0;
        } catch {
          // fall through
        }
      }

      return teamCount > 0
        ? `Your team has ${teamCount} member${teamCount !== 1 ? 's' : ''}. You can manage team roles and permissions in the Settings area.`
        : `Team information is not available right now. Check the Settings area to manage your team.`;
    }

    case 'status': {
      const activeProposals = proposals.filter((p) =>
        ['approved', 'in_production', 'active'].includes(p.status)
      ).length;
      const totalValue = proposals.reduce((s, p) => s + p.total_value, 0);
      const paidAmount = invoices
        .filter((i) => i.status === 'paid')
        .reduce((s, i) => s + i.amount_paid, 0);
      const overdueCount = invoices.filter(
        (i) => i.status === 'overdue'
      ).length;
      const pipelineValue = deals.reduce((s, d) => s + d.value, 0);

      return (
        `Here is your business overview:\n\n` +
        `  - ${proposals.length} total proposals (${activeProposals} active) worth ${currencyFmt.format(totalValue)}\n` +
        `  - ${deals.length} deals in pipeline worth ${currencyFmt.format(pipelineValue)}\n` +
        `  - ${currencyFmt.format(paidAmount)} collected to date\n` +
        `  - ${overdueCount} overdue invoice${overdueCount !== 1 ? 's' : ''}\n` +
        `  - ${clients.length} clients on file`
      );
    }

    default: {
      return (
        `I can help you with insights about your business. Try asking about:\n\n` +
        `  - "How many proposals do we have?" -- proposal summary\n` +
        `  - "Revenue summary" -- income and collections\n` +
        `  - "Pipeline status" -- deals by stage\n` +
        `  - "Client summary" -- clients and their proposals\n` +
        `  - "Overdue invoices" -- outstanding payments\n` +
        `  - "Business overview" -- high-level status of everything`
      );
    }
  }
}

export async function POST(request: Request) {
  try {
    const tierError = await requireFeature('ai_assistant');
    if (tierError) return tierError;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Gather base context (used for system prompt)
    const context = await gatherContext(supabase, user.id);
    const _systemPrompt = buildSystemPrompt(context);

    // Determine the user's org for data queries
    let orgId: string | null = null;
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();
      orgId = userData?.organization_id ?? null;
    } catch {
      // Will fall back to seed data
    }

    const intent = detectIntent(message);
    const response = await buildIntentResponse(intent, supabase, orgId);

    return NextResponse.json({ response });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
