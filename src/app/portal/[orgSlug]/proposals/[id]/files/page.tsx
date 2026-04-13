import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import EmptyState from '@/components/ui/EmptyState';
import FileDownloadButton from '@/components/portal/FileDownloadButton';

interface PageProps {
  params: Promise<{ orgSlug: string; id: string }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

function FileTypeIcon({ mimeType }: { mimeType: string }) {
  if (mimeType === 'application/pdf') {
    return (
      <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center">
        <span className="text-xs font-bold text-red-600">PDF</span>
      </div>
    );
  }
  if (mimeType === 'application/zip') {
    return (
      <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
        <span className="text-xs font-bold text-amber-600">ZIP</span>
      </div>
    );
  }
  if (mimeType.startsWith('video/')) {
    return (
      <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
        <span className="text-xs font-bold text-purple-600">MP4</span>
      </div>
    );
  }
  if (mimeType.startsWith('image/')) {
    return (
      <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
        <span className="text-xs font-bold text-blue-600">IMG</span>
      </div>
    );
  }
  return (
    <div className="h-10 w-10 rounded-lg bg-bg-secondary flex items-center justify-center">
      <span className="text-xs font-bold text-gray-500">FILE</span>
    </div>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const styles: Record<string, string> = {
    brief: 'bg-blue-50 text-blue-700',
    report: 'bg-emerald-50 text-emerald-700',
    design: 'bg-purple-50 text-purple-700',
    specification: 'bg-orange-50 text-orange-700',
    engineering: 'bg-indigo-50 text-indigo-700',
    presentation: 'bg-pink-50 text-pink-700',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[category] ?? 'bg-bg-secondary text-gray-600'}`}>
      {category}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default async function FilesPage({ params }: PageProps) {
  const { orgSlug, id } = await params;

  const supabase = await createClient();

  // Verify proposal belongs to this org
  const { data: proposal } = await supabase
    .from('proposals')
    .select('id, organization_id')
    .eq('id', id)
    .single();

  if (!proposal) notFound();

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .single();

  if (!org || proposal.organization_id !== org.id) notFound();

  // Fetch file attachments for this proposal (client-visible only)
  const { data: files } = await supabase
    .from('file_attachments')
    .select('*')
    .eq('proposal_id', id)
    .eq('is_client_visible', true)
    .order('created_at', { ascending: true });

  const fileList = files ?? [];

  // Fetch phases to map phase_id → phase name/number
  const { data: phases } = await supabase
    .from('phases')
    .select('id, phase_number, name')
    .eq('proposal_id', id)
    .order('sort_order', { ascending: true });

  const phaseMap = new Map(
    (phases ?? []).map((p) => [p.id, { name: p.name, number: p.phase_number }]),
  );

  // Group files by phase
  interface FileWithPhase {
    id: string;
    file_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    category: string;
    created_at: string;
    phase_name: string;
    phase_number: string;
  }

  const enriched: FileWithPhase[] = fileList.map((f) => {
    const phase = f.phase_id ? phaseMap.get(f.phase_id) : null;
    return {
      id: f.id,
      file_name: f.file_name,
      file_path: f.file_path,
      file_size: f.file_size,
      mime_type: f.mime_type,
      category: f.category,
      created_at: f.created_at,
      phase_name: phase?.name ?? 'General',
      phase_number: phase?.number ?? '0',
    };
  });

  const grouped = enriched.reduce<Record<string, FileWithPhase[]>>((acc, file) => {
    const key = file.phase_number === '0'
      ? 'General'
      : `Phase ${file.phase_number}: ${file.phase_name}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(file);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Files</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Project files and deliverables organized by phase.
        </p>
      </div>

      {Object.keys(grouped).length === 0 && (
        <EmptyState
          message="No files shared yet"
          description="Files and deliverables will appear here as your project progresses."
        />
      )}

      {Object.entries(grouped).map(([groupLabel, groupFiles]) => (
        <section key={groupLabel}>
          <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
            {groupLabel}
          </h3>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groupFiles.map((file) => (
              <div
                key={file.id}
                className="group rounded-lg border border-border bg-background p-4 text-left transition-[color,background-color,border-color,opacity,box-shadow] hover:border-text-muted hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <FileTypeIcon mimeType={file.mime_type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-clip">
                      {file.file_name}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[11px] text-text-muted">
                        {formatFileSize(file.file_size)}
                      </span>
                      <span className="text-text-muted">&middot;</span>
                      <span className="text-[11px] text-text-muted">
                        {new Date(file.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <CategoryBadge category={file.category} />
                  <FileDownloadButton fileId={file.id} fileName={file.file_name} />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
