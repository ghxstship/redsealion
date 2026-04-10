import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import JourneyContent from '@/components/portal/journey/JourneyContent';
import type {
  Phase,
  PhaseDeliverable,
  PhaseAddon,
  MilestoneGate,
  MilestoneRequirement,
  CreativeReference,
  PaymentTerms,
} from '@/types/database';
import { castRelation } from '@/lib/supabase/cast-relation';

interface PageProps {
  params: Promise<{ orgSlug: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { orgSlug, id } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('slug', orgSlug)
    .single();

  const { data: proposal } = await supabase
    .from('proposals')
    .select('name')
    .eq('id', id)
    .single();

  const orgName = org?.name ?? orgSlug
    .split('-')
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return {
    title: `${proposal?.name ?? 'Proposal'} | ${orgName}`,
  };
}

export default async function ProposalJourneyPage({ params }: PageProps) {
  const { orgSlug, id } = await params;

  const supabase = await createClient();

  // Find user's portal permission for 'proposals.approve'
  const { data: { user } } = await supabase.auth.getUser();
  let canApprove = false;

  // Verify the proposal belongs to the org by slug
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .single();

  if (user && org) {
    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('roles(name)')
      .eq('user_id', user.id)
      .eq('organization_id', org.id)
      .eq('status', 'active')
      .limit(1)
      .single();

    if (membership) {
      const rawRole = castRelation<{ name: string }>(membership.roles)?.name ?? 'viewer';
      const { mapDBRoleToEnum } = await import('@/lib/permissions');
      const role = mapDBRoleToEnum(rawRole);

      if (role === 'developer' || role === 'owner' || role === 'admin' || role === 'manager') {
        canApprove = true;
      } else if (role === 'client') {
        const { getPortalPermission } = await import('@/lib/permissions');
        canApprove = getPortalPermission('client', 'proposals.approve');
      }
    }
  }

  // Fetch the proposal
  const { data: proposal } = await supabase
    .from('proposals')
    .select('*')
    .eq('id', id)
    .single();

  if (!proposal) {
    notFound();
  }

  if (!org || proposal.organization_id !== org.id) {
    notFound();
  }

  // GAP-PTL-03: Enforce portal_token_expires_at
  if (
    proposal.portal_token_expires_at &&
    new Date(proposal.portal_token_expires_at) < new Date()
  ) {
    notFound();
  }

  // GAP-PTL-09: Verify the authenticated client has access to THIS proposal.
  // Org members (with a membership) can view any proposal in their org.
  // Portal clients must match via client_contacts → client_id → proposal.client_id.
  if (user && org) {
    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', org.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    if (!membership) {
      // Not an org member — must be a portal client. Check client_id match.
      const { data: contact } = await supabase
        .from('client_contacts')
        .select('client_id')
        .eq('email', user.email ?? '')
        .limit(1)
        .maybeSingle();

      if (!contact || contact.client_id !== proposal.client_id) {
        notFound();
      }
    }
  }

  // M-03: Track first portal view
  if (user && !proposal.portal_first_viewed_at) {
    // Check if this user is a client (not an org member)
    const { data: contact } = await supabase
      .from('client_contacts')
      .select('id')
      .eq('email', user.email ?? '')
      .limit(1)
      .maybeSingle();

    if (contact) {
      await supabase
        .from('proposals')
        .update({ portal_first_viewed_at: new Date().toISOString() })
        .eq('id', id);
    }
  }

  // Fetch phases for this proposal
  const { data: phases } = await supabase
    .from('phases')
    .select('*')
    .eq('proposal_id', id)
    .order('sort_order', { ascending: true });

  const phaseList: Phase[] = phases ?? [];
  const phaseIds = phaseList.map((p) => p.id);

  // Fetch related data in parallel
  const [delivResult, addonResult, milestoneResult, reqResult, refResult] = await Promise.all([
    phaseIds.length > 0
      ? supabase.from('phase_deliverables').select('*').in('phase_id', phaseIds).order('sort_order', { ascending: true })
      : { data: [] },
    phaseIds.length > 0
      ? supabase.from('phase_addons').select('*').in('phase_id', phaseIds).order('sort_order', { ascending: true })
      : { data: [] },
    phaseIds.length > 0
      ? supabase.from('milestone_gates').select('*').in('phase_id', phaseIds)
      : { data: [] },
    phaseIds.length > 0
      ? supabase.from('milestone_requirements').select('*').order('sort_order', { ascending: true })
      : { data: [] },
    phaseIds.length > 0
      ? supabase.from('creative_references').select('*').in('phase_id', phaseIds).order('sort_order', { ascending: true })
      : { data: [] },
  ]);

  const deliverables: PhaseDeliverable[] = delivResult.data ?? [];
  const addons: PhaseAddon[] = addonResult.data ?? [];
  const milestones: (MilestoneGate)[] = milestoneResult.data ?? [];
  const allRequirements: MilestoneRequirement[] = reqResult.data ?? [];
  const creativeRefs: CreativeReference[] = refResult.data ?? [];

  // Filter requirements to only those belonging to our milestones
  const milestoneIds = new Set(milestones.map((m) => m.id));
  const requirements = allRequirements.filter((r) => milestoneIds.has(r.milestone_id));

  // Group deliverables, addons, milestones, requirements, and refs by phase
  const delivByPhase = groupBy(deliverables, 'phase_id');
  const addonsByPhase = groupBy(addons, 'phase_id');
  const refsByPhase = groupBy(creativeRefs, 'phase_id');
  const reqsByMilestone = groupBy(requirements, 'milestone_id');

  // Build milestone map by phase_id
  const milestoneByPhase = new Map<string, MilestoneGate & { requirements?: MilestoneRequirement[] }>();
  for (const ms of milestones) {
    milestoneByPhase.set(ms.phase_id, {
      ...ms,
      requirements: reqsByMilestone.get(ms.id) ?? [],
    });
  }

  // Assemble phase data
  const phaseData = phaseList.map((phase) => ({
    phase,
    deliverables: delivByPhase.get(phase.id) ?? [],
    addons: addonsByPhase.get(phase.id) ?? [],
    milestone: milestoneByPhase.get(phase.id) ?? null,
    creativeReferences: refsByPhase.get(phase.id) ?? [],
  }));

  return (
    <JourneyContent
      proposalId={id}
      proposalName={proposal.name}
      proposalSubtitle={proposal.subtitle}
      phases={phaseData}
      paymentTerms={proposal.payment_terms as PaymentTerms | null}
      currency={proposal.currency}
      currentPhaseId={proposal.current_phase_id}
      canApprove={canApprove}
    />
  );
}

function groupBy<T>(items: T[], key: keyof T): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = item[key] as string;
    const arr = map.get(k);
    if (arr) {
      arr.push(item);
    } else {
      map.set(k, [item]);
    }
  }
  return map;
}
