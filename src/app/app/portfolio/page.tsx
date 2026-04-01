const categories = ['All', 'Pop-Up', 'Installation', 'Festival', 'Launch', 'Retail'];

const portfolioItems = [
  {
    id: 'port_001',
    project_name: 'Nike Air Max Day 2025',
    project_year: 2025,
    category: 'Pop-Up',
    client_name: 'Nike',
    description: 'Immersive sneaker culture pop-up in downtown LA.',
  },
  {
    id: 'port_002',
    project_name: 'Spotify Wrapped NYC',
    project_year: 2025,
    category: 'Installation',
    client_name: 'Spotify',
    description: 'Interactive data visualization installation at Hudson Yards.',
  },
  {
    id: 'port_003',
    project_name: 'Mercedes EQE Reveal',
    project_year: 2025,
    category: 'Launch',
    client_name: 'Mercedes-Benz',
    description: 'Premium EV launch experience with holographic displays.',
  },
  {
    id: 'port_004',
    project_name: 'Red Bull Sound Clash',
    project_year: 2024,
    category: 'Festival',
    client_name: 'Red Bull',
    description: 'Multi-stage music festival activation with branded environments.',
  },
  {
    id: 'port_005',
    project_name: 'Apple Vision Pro Demo',
    project_year: 2025,
    category: 'Retail',
    client_name: 'Apple',
    description: 'Spatial computing demo suite for flagship retail locations.',
  },
  {
    id: 'port_006',
    project_name: 'Spotify Listening Lounge',
    project_year: 2025,
    category: 'Installation',
    client_name: 'Spotify',
    description: 'Intimate premium listening experience for emerging artists at SXSW.',
  },
  {
    id: 'port_007',
    project_name: 'Nike SNKRS Fest',
    project_year: 2025,
    category: 'Festival',
    client_name: 'Nike',
    description: 'Annual sneaker culture festival and brand activation.',
  },
  {
    id: 'port_008',
    project_name: 'Mercedes Pop-Up Gallery',
    project_year: 2024,
    category: 'Pop-Up',
    client_name: 'Mercedes-Benz',
    description: 'Art meets automotive in this gallery-style brand experience.',
  },
];

export default function PortfolioPage() {
  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Portfolio
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {portfolioItems.length} projects in your portfolio library.
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
            <path d="M8 2v12M2 8h12" />
          </svg>
          Upload Project
        </button>
      </div>

      {/* Category filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((cat, idx) => (
          <button
            key={cat}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              idx === 0
                ? 'bg-foreground text-white'
                : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {portfolioItems.map((item) => (
          <div
            key={item.id}
            className="group rounded-xl border border-border bg-white overflow-hidden transition-colors hover:border-foreground/20"
          >
            {/* Placeholder image */}
            <div className="relative aspect-[4/3] bg-bg-tertiary flex items-center justify-center">
              <div className="text-center px-4">
                <p className="text-sm font-medium text-text-muted">{item.client_name}</p>
                <p className="mt-1 text-xs text-text-muted">Image placeholder</p>
              </div>
            </div>
            {/* Info */}
            <div className="px-4 py-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-foreground leading-snug">
                  {item.project_name}
                </p>
                <span className="shrink-0 text-xs tabular-nums text-text-muted">
                  {item.project_year}
                </span>
              </div>
              <span className="mt-2 inline-flex items-center rounded-full bg-bg-secondary px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                {item.category}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
