import type { FileAttachment } from '@/types/database';

interface PageProps {
  params: Promise<{ orgSlug: string; id: string }>;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const ts = '2026-01-15T00:00:00Z';

interface FileWithPhase extends FileAttachment {
  phase_name: string;
  phase_number: string;
}

const mockFiles: FileWithPhase[] = [
  {
    id: 'f-1',
    proposal_id: 'proposal-1',
    phase_id: 'phase-1',
    uploaded_by: 'user-1',
    file_name: 'Creative_Brief_v2.pdf',
    file_path: '/files/creative-brief-v2.pdf',
    file_size: 2_450_000,
    mime_type: 'application/pdf',
    category: 'brief',
    is_client_visible: true,
    created_at: '2026-02-08T14:30:00Z',
    updated_at: '2026-02-08T14:30:00Z',
    phase_name: 'Discovery',
    phase_number: '1',
  },
  {
    id: 'f-2',
    proposal_id: 'proposal-1',
    phase_id: 'phase-1',
    uploaded_by: 'user-1',
    file_name: 'Site_Analysis_Portland.pdf',
    file_path: '/files/site-analysis.pdf',
    file_size: 8_120_000,
    mime_type: 'application/pdf',
    category: 'report',
    is_client_visible: true,
    created_at: '2026-02-06T09:15:00Z',
    updated_at: '2026-02-06T09:15:00Z',
    phase_name: 'Discovery',
    phase_number: '1',
  },
  {
    id: 'f-3',
    proposal_id: 'proposal-1',
    phase_id: 'phase-2',
    uploaded_by: 'user-1',
    file_name: 'AirMax_3D_Renderings.zip',
    file_path: '/files/3d-renderings.zip',
    file_size: 145_000_000,
    mime_type: 'application/zip',
    category: 'design',
    is_client_visible: true,
    created_at: '2026-02-25T16:45:00Z',
    updated_at: '2026-02-25T16:45:00Z',
    phase_name: 'Design',
    phase_number: '2',
  },
  {
    id: 'f-4',
    proposal_id: 'proposal-1',
    phase_id: 'phase-2',
    uploaded_by: 'user-1',
    file_name: 'Material_Spec_Book.pdf',
    file_path: '/files/material-specs.pdf',
    file_size: 12_800_000,
    mime_type: 'application/pdf',
    category: 'specification',
    is_client_visible: true,
    created_at: '2026-02-27T11:00:00Z',
    updated_at: '2026-02-27T11:00:00Z',
    phase_name: 'Design',
    phase_number: '2',
  },
  {
    id: 'f-5',
    proposal_id: 'proposal-1',
    phase_id: 'phase-3',
    uploaded_by: 'user-1',
    file_name: 'Structural_Drawings_PE_Stamped.pdf',
    file_path: '/files/structural-drawings.pdf',
    file_size: 18_400_000,
    mime_type: 'application/pdf',
    category: 'engineering',
    is_client_visible: true,
    created_at: '2026-03-18T10:30:00Z',
    updated_at: '2026-03-18T10:30:00Z',
    phase_name: 'Engineering',
    phase_number: '3',
  },
  {
    id: 'f-6',
    proposal_id: 'proposal-1',
    phase_id: 'phase-3',
    uploaded_by: 'user-1',
    file_name: 'Walkthrough_Animation.mp4',
    file_path: '/files/walkthrough.mp4',
    file_size: 256_000_000,
    mime_type: 'video/mp4',
    category: 'presentation',
    is_client_visible: true,
    created_at: '2026-03-20T15:20:00Z',
    updated_at: '2026-03-20T15:20:00Z',
    phase_name: 'Engineering',
    phase_number: '3',
  },
];

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
    <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
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
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[category] ?? 'bg-gray-100 text-gray-600'}`}>
      {category}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default async function FilesPage({ params }: PageProps) {
  const { orgSlug, id } = await params;

  // Group files by phase
  const grouped = mockFiles.reduce<Record<string, FileWithPhase[]>>((acc, file) => {
    const key = `Phase ${file.phase_number}: ${file.phase_name}`;
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

      {Object.entries(grouped).map(([groupLabel, files]) => (
        <section key={groupLabel}>
          <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
            {groupLabel}
          </h3>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {files.map((file) => (
              <button
                key={file.id}
                type="button"
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
                  <span
                    className="text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--org-primary)' }}
                  >
                    Open &rarr;
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
