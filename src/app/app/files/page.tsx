import { createClient } from '@/lib/supabase/server';
import { FileText } from 'lucide-react';
import { TierGate } from '@/components/shared/TierGate';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';

interface FileStats {
  total: number;
  totalSizeMb: number;
  categories: Record<string, number>;
}

async function getFileStats(): Promise<FileStats> {
  const fallback: FileStats = { total: 0, totalSizeMb: 0, categories: {} };
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');

    // file_attachments scoped via proposal_id; RLS handles org filtering
    const { data: proposals } = await supabase
      .from('proposals')
      .select('id')
      .eq('organization_id', ctx.organizationId);

    if (!proposals || proposals.length === 0) return fallback;

    const proposalIds = proposals.map((p) => p.id);
    const { data } = await supabase
      .from('file_attachments')
      .select('id, file_size, category, file_name')
      .in('proposal_id', proposalIds);

    if (!data || data.length === 0) return fallback;

    const categories: Record<string, number> = {};
    let totalSize = 0;
    for (const f of data) {
      totalSize += f.file_size ?? 0;
      const cat = f.category ?? 'other';
      categories[cat] = (categories[cat] ?? 0) + 1;
    }

    return {
      total: data.length,
      totalSizeMb: Math.round((totalSize / (1024 * 1024)) * 10) / 10,
      categories,
    };
  } catch {
    return fallback;
  }
}

export default async function FilesPage() {
  const stats = await getFileStats();

  return (
    <TierGate feature="proposals">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Files
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          All documents and attachments across your projects.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-xl border border-border bg-white px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Total Files</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-border bg-white px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Storage Used</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{stats.totalSizeMb} MB</p>
        </div>
        <div className="rounded-xl border border-border bg-white px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Categories</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{Object.keys(stats.categories).length}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white px-8 py-16 text-center">
        <div className="mx-auto max-w-md">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bg-secondary">
            <FileText size={24} className="text-text-muted" />
          </div>
          <p className="text-sm text-text-secondary">
            Files attached to proposals, projects, and deliverables are surfaced here. Upload files from individual project pages.
          </p>
        </div>
      </div>
    </TierGate>
  );
}
