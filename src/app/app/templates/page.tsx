const templates = [
  {
    id: 'tmpl_001',
    name: 'Experiential Production (8-Phase)',
    description: 'Full-service experiential production pipeline from discovery through strike. Suitable for large-scale brand activations, pop-ups, and multi-venue campaigns.',
    phases_count: 8,
    is_default: true,
    phases: [
      'Discovery & Strategy',
      'Concept Design',
      'Design Development',
      'Fabrication',
      'Technology Integration',
      'Logistics & Install',
      'Activation & Staffing',
      'Strike & Wrap',
    ],
    updated_at: '2026-03-20T00:00:00Z',
  },
  {
    id: 'tmpl_002',
    name: 'Quick Activation (4-Phase)',
    description: 'Streamlined pipeline for smaller activations and single-venue events. Combines design and fabrication phases for faster turnaround.',
    phases_count: 4,
    is_default: false,
    phases: [
      'Strategy & Design',
      'Production',
      'Install & Activate',
      'Strike & Report',
    ],
    updated_at: '2026-02-15T00:00:00Z',
  },
  {
    id: 'tmpl_003',
    name: 'Retail Environment (6-Phase)',
    description: 'Designed for permanent and semi-permanent retail installations. Includes extended design development and long-term maintenance phases.',
    phases_count: 6,
    is_default: false,
    phases: [
      'Discovery',
      'Concept Design',
      'Design Development',
      'Fabrication & QA',
      'Install & Launch',
      'Maintenance & Iteration',
    ],
    updated_at: '2026-01-28T00:00:00Z',
  },
  {
    id: 'tmpl_004',
    name: 'Festival & Touring (7-Phase)',
    description: 'Multi-city touring production pipeline with built-in logistics for repeatable deployments and asset tracking across venues.',
    phases_count: 7,
    is_default: false,
    phases: [
      'Route Planning & Strategy',
      'Design & Engineering',
      'Fabrication',
      'Tech Integration',
      'Tour Launch',
      'Touring Operations',
      'Wrap & Asset Recovery',
    ],
    updated_at: '2026-02-05T00:00:00Z',
  },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function TemplatesPage() {
  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Phase Templates
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Define reusable phase structures for your proposals.
          </p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-foreground/90">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="8" y1="2" x2="8" y2="14" />
            <line x1="2" y1="8" x2="14" y2="8" />
          </svg>
          Create Template
        </button>
      </div>

      {/* Templates list */}
      <div className="space-y-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`rounded-xl border bg-white px-6 py-5 transition-colors hover:border-foreground/20 ${
              template.is_default ? 'border-foreground/30' : 'border-border'
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-semibold text-foreground">
                    {template.name}
                  </h3>
                  {template.is_default && (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      Default
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">
                  {template.description}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-text-muted">
                  Updated {formatDate(template.updated_at)}
                </p>
              </div>
            </div>

            {/* Phases preview */}
            <div className="mt-4 flex flex-wrap gap-2">
              {template.phases.map((phase, idx) => (
                <span
                  key={phase}
                  className="inline-flex items-center gap-1.5 rounded-full bg-bg-secondary px-3 py-1 text-xs font-medium text-text-secondary"
                >
                  <span className="text-text-muted font-mono">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  {phase}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
