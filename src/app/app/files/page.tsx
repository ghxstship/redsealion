import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/ui/Card';
import FilesDataTable, { FileData } from '@/components/files/FilesDataTable';

interface FileStats {
  total: number;
  totalSizeMb: number;
  categories: Record<string, number>;
  files: FileData[];
}

async function getFileStats(): Promise<FileStats> {
  const fallback: FileStats = { total: 0, totalSizeMb: 0, categories: {}, files: [] };
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');

    // Fetch all files associated with the current org that are not soft-deleted
    const { data } = await supabase
      .from('file_attachments')
      .select('id, file_size, category, file_name, created_at, mime_type')
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

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
      files: data as FileData[]
    };
  } catch {
    return fallback;
  }
}

export default async function FilesPage() {
  const stats = await getFileStats();

  return (
    <TierGate feature="proposals">
<PageHeader
        title="Files"
        subtitle="All documents and attachments across your organization."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Total Files</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{stats.total}</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Storage Used</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{stats.totalSizeMb} MB</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Categories</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{Object.keys(stats.categories).length}</p>
        </Card>
      </div>

      <FilesDataTable initialFiles={stats.files} />
    </TierGate>
  );
}
