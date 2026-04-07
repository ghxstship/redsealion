'use client';

import { useEffect, useState } from 'react';
import { resolveClientOrg } from '@/lib/auth/resolve-org-client';
import EmptyState from '@/components/ui/EmptyState';

interface OrgNode {
  id: string;
  name: string;
  title: string;
  children: OrgNode[];
}

function OrgNodeCard({ node, isRoot = false }: { node: OrgNode; isRoot?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`rounded-xl border border-border bg-white px-5 py-3 text-center ${isRoot ? 'shadow-md' : ''}`}>
        <p className="text-sm font-medium text-foreground">{node.name}</p>
        <p className="text-xs text-text-secondary">{node.title}</p>
      </div>

      {node.children.length > 0 && (
        <>
          <div className="w-px h-6 bg-border" />
          <div className="flex gap-8 relative">
            {node.children.length > 1 && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-border" style={{
                width: `calc(100% - 80px)`,
              }} />
            )}
            {node.children.map((child) => (
              <div key={child.id} className="flex flex-col items-center">
                <div className="w-px h-6 bg-border" />
                <OrgNodeCard node={child} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function buildOrgTree(positions: Array<{ id: string; title: string; reports_to: string | null; user_name: string | null }>): OrgNode | null {
  if (positions.length === 0) return null;

  const nodeMap = new Map<string, OrgNode>();

  for (const pos of positions) {
    nodeMap.set(pos.id, {
      id: pos.id,
      name: pos.user_name ?? 'Vacant',
      title: pos.title,
      children: [],
    });
  }

  let root: OrgNode | null = null;

  for (const pos of positions) {
    const node = nodeMap.get(pos.id)!;
    if (pos.reports_to && nodeMap.has(pos.reports_to)) {
      nodeMap.get(pos.reports_to)!.children.push(node);
    } else {
      root = node;
    }
  }

  return root ?? nodeMap.values().next().value ?? null;
}

export default function OrgChart() {
  const [orgTree, setOrgTree] = useState<OrgNode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrg() {
      try {
        const ctx = await resolveClientOrg();
        if (!ctx) return;

        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        // Fetch from org_chart_positions with user join
        const { data: positions } = await supabase
          .from('org_chart_positions')
          .select('id, title, reports_to, user_id, users!org_chart_positions_user_id_fkey(full_name)')
          .eq('organization_id', ctx.organizationId)
          .order('level', { ascending: true });

        if (positions && positions.length > 0) {
          const mapped = positions.map((p) => {
            const user = p.users as unknown as { full_name: string } | null;
            return {
              id: p.id,
              title: p.title,
              reports_to: p.reports_to,
              user_name: user?.full_name ?? null,
            };
          });
          setOrgTree(buildOrgTree(mapped));
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    loadOrg();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-white px-8 py-8 text-center">
        <p className="text-sm text-text-muted">Loading organization chart...</p>
      </div>
    );
  }

  if (!orgTree) {
    return (
      <EmptyState
        message="No org chart positions configured yet"
        description="Add positions in your organization settings."
      />
    );
  }

  return (
    <div className="rounded-xl border border-border bg-white px-8 py-8 overflow-x-auto">
      <div className="min-w-[600px] flex justify-center">
        <OrgNodeCard node={orgTree} isRoot />
      </div>
    </div>
  );
}
