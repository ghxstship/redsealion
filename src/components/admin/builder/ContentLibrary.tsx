'use client';

/**
 * ContentLibrary — Slide-over panel for saved snippets, narratives,
 * and deliverable templates that can be inserted into any phase.
 *
 * @module components/admin/builder/ContentLibrary
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fmTransition } from '@/lib/motion';
import FormInput from '@/components/ui/FormInput';
import { X, Search, FileText, Package, Sparkles, ChevronRight } from 'lucide-react';
import type { DeliverableData, AddonData } from './types';

/* ─── Types ──────────────────────────────────────────────── */

interface NarrativeSnippet {
  id: string;
  title: string;
  content: string;
  category: string;
}

interface DeliverableTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  unitCost: number;
  unit: string;
}

type ContentTab = 'narratives' | 'deliverables' | 'addons';

/* ─── Built-in templates (phase-specific defaults) ───────── */

const DEFAULT_NARRATIVES: NarrativeSnippet[] = [
  {
    id: 'tmpl-discovery',
    title: 'Discovery & Strategy',
    content:
      'This phase establishes the creative and strategic foundation for the entire project. Through a series of immersive workshops and collaborative sessions, our team will deeply understand the brand\'s DNA, target audience behavior, and experience objectives. The result is a comprehensive creative brief that aligns all stakeholders and provides a clear roadmap for design and production.',
    category: 'Phase 01',
  },
  {
    id: 'tmpl-concept',
    title: 'Concept Design',
    content:
      'With the strategic foundation in place, our creative team translates the brief into tangible visual concepts. This includes spatial design, guest journey mapping, materials exploration, and detailed renderings that bring the experience to life on paper before a single piece is fabricated. Multiple concept directions are presented for client review, ensuring alignment before advancing into production.',
    category: 'Phase 02',
  },
  {
    id: 'tmpl-engineering',
    title: 'Engineering & Pre-Production',
    content:
      'The approved concept enters the engineering phase where every element is specified for fabrication. Structural calculations, material specifications, technology integration plans, and vendor coordination are finalized. This is the bridge between creative vision and physical reality — ensuring every detail is production-ready and budget-aligned.',
    category: 'Phase 03',
  },
  {
    id: 'tmpl-fabrication',
    title: 'Fabrication & Build',
    content:
      'Production begins in our fabrication facilities, where skilled artisans and advanced manufacturing technology bring the design to life. Regular quality checkpoints, progress photography, and milestone reviews keep the client informed throughout the build. All elements are completed, finished, and staged for logistics coordination.',
    category: 'Phase 04',
  },
  {
    id: 'tmpl-logistics',
    title: 'Logistics & Coordination',
    content:
      'The logistics team manages the complex choreography of moving all elements from our facilities to the activation site. This includes freight coordination, customs documentation (if applicable), warehouse staging, and detailed load-in scheduling to ensure every piece arrives on time and in perfect condition.',
    category: 'Phase 05',
  },
  {
    id: 'tmpl-installation',
    title: 'Installation & Technical',
    content:
      'On-site installation brings together scenics, technology, lighting, and infrastructure in a carefully orchestrated sequence. Our installation crew works to detailed plans with built-in contingency time, ensuring everything is tested, tuned, and photo-ready before the doors open.',
    category: 'Phase 06',
  },
  {
    id: 'tmpl-activation',
    title: 'Activation & Live Management',
    content:
      'During the live event, our production team provides on-site management, technical support, and real-time adjustments to ensure the experience runs flawlessly. This includes guest flow management, brand ambassador coordination, and live data capture for post-event analysis.',
    category: 'Phase 07',
  },
  {
    id: 'tmpl-strike',
    title: 'Deinstallation & Wrap',
    content:
      'Following the activation, the strike team executes a clean, efficient deinstallation. All assets are documented, sorted for storage or disposal, and the venue is restored to its original condition. A comprehensive wrap report captures learnings, metrics, and recommendations for future activations.',
    category: 'Phase 08',
  },
];

/* ─── Component ──────────────────────────────────────────── */

interface ContentLibraryProps {
  open: boolean;
  onClose: () => void;
  onInsertNarrative: (content: string) => void;
  onInsertDeliverable: (deliverable: DeliverableData) => void;
  onInsertAddon: (addon: AddonData) => void;
}

export default function ContentLibrary({
  open,
  onClose,
  onInsertNarrative,
  onInsertDeliverable,
  onInsertAddon,
}: ContentLibraryProps) {
  const [tab, setTab] = useState<ContentTab>('narratives');
  const [search, setSearch] = useState('');
  const [narratives] = useState<NarrativeSnippet[]>(DEFAULT_NARRATIVES);
  const [deliverableTemplates, setDeliverableTemplates] = useState<DeliverableTemplate[]>([]);

  // Load org-specific templates (if any exist in the future)
  useEffect(() => {
    if (!open) return;
    // Placeholder — in production, this would query a `content_library` table
    setDeliverableTemplates([]);
  }, [open]);

  const matchesSearch = useCallback(
    (text: string) => {
      if (!search) return true;
      return text.toLowerCase().includes(search.toLowerCase());
    },
    [search],
  );

  const filteredNarratives = narratives.filter(
    (s) => matchesSearch(s.title) || matchesSearch(s.category) || matchesSearch(s.content),
  );

  const tabs: { key: ContentTab; label: string; icon: React.ReactNode }[] = [
    { key: 'narratives', label: 'Narratives', icon: <FileText size={14} /> },
    { key: 'deliverables', label: 'Deliverables', icon: <Package size={14} /> },
    { key: 'addons', label: 'Add-Ons', icon: <Sparkles size={14} /> },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fmTransition.enter}
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Slide-over panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={fmTransition.springGentle}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Content Library</h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-text-muted hover:text-foreground transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Search */}
            <div className="px-6 py-3 border-b border-border">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <FormInput
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search templates…"
                  className="pl-8"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors ${
                    tab === t.key
                      ? 'text-org-primary border-b-2 border-org-primary'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {tab === 'narratives' && (
                <div className="space-y-3">
                  {filteredNarratives.map((snippet) => (
                    <button
                      key={snippet.id}
                      type="button"
                      onClick={() => {
                        onInsertNarrative(snippet.content);
                        onClose();
                      }}
                      className="w-full text-left rounded-lg border border-border p-4 hover:bg-bg-secondary/50 transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{snippet.title}</span>
                        <ChevronRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="inline-block text-[10px] font-medium tracking-wider uppercase text-org-primary mb-2">
                        {snippet.category}
                      </span>
                      <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed">
                        {snippet.content}
                      </p>
                    </button>
                  ))}

                  {filteredNarratives.length === 0 && (
                    <p className="text-sm text-text-muted text-center py-8">
                      No matching narratives found.
                    </p>
                  )}
                </div>
              )}

              {tab === 'deliverables' && (
                <div className="space-y-3">
                  {deliverableTemplates.length === 0 && (
                    <div className="text-center py-12">
                      <Package size={28} className="mx-auto text-text-muted mb-3" />
                      <p className="text-sm text-text-secondary mb-1">No deliverable templates yet</p>
                      <p className="text-xs text-text-muted">
                        Templates saved from past proposals will appear here.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {tab === 'addons' && (
                <div className="text-center py-12">
                  <Sparkles size={28} className="mx-auto text-text-muted mb-3" />
                  <p className="text-sm text-text-secondary mb-1">No add-on templates yet</p>
                  <p className="text-xs text-text-muted">
                    Templates saved from past proposals will appear here.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
