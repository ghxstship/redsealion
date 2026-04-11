'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import Button from '@/components/ui/Button';
import StatusBadge, { TERMS_STATUS_COLORS } from '@/components/ui/StatusBadge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface TermsSection {
  number: string;
  title: string;
  body: string;
}

interface TermsDocument {
  id: string;
  title: string;
  version: number;
  status: string;
  is_active: boolean;
  sections: TermsSection[];
  created_at: string;
  updated_at: string;
}

interface Props {
  activeDocument: TermsDocument | null;
  allDocuments: TermsDocument[];
}

export default function TermsDocumentView({ activeDocument, allDocuments }: Props) {
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editingSections, setEditingSections] = useState<TermsSection[]>([]);

  function toggleSection(number: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(number)) next.delete(number);
      else next.add(number);
      return next;
    });
  }

  async function handleCreateVersion() {
    if (!activeDocument) return;
    setCreating(true);
    try {
      const res = await fetch('/api/terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${activeDocument.title} v${activeDocument.version + 1}`,
          sections: activeDocument.sections,
        }),
      });
      if (res.ok) router.refresh();
    } finally {
      setCreating(false);
    }
  }

  async function handleSetActive(docId: string) {
    try {
      // Deactivate all first
      for (const doc of allDocuments) {
        if (doc.is_active && doc.id !== docId) {
          await fetch(`/api/terms/${doc.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: false }),
          });
        }
      }
      // Activate the selected
      const res = await fetch(`/api/terms/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: true, status: 'active' }),
      });
      if (res.ok) {
        toast.success('Version set as active');
        router.refresh();
      } else {
        toast.error('Failed to set active version');
      }
    } catch {
      toast.error('Network error');
    }
  }

  async function handleArchive(docId: string) {
    setDeleteConfirmId(null);
    try {
      const res = await fetch(`/api/terms/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived', is_active: false }),
      });
      if (res.ok) {
        toast.success('Document archived');
        router.refresh();
      } else {
        toast.error('Failed to archive document');
      }
    } catch {
      toast.error('Network error');
    }
  }

  async function handleSaveSections() {
    if (!activeDocument) return;
    try {
      const res = await fetch(`/api/terms/${activeDocument.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: editingSections }),
      });
      if (res.ok) {
        toast.success('Sections updated');
        setEditing(false);
        router.refresh();
      } else {
        toast.error('Failed to update');
      }
    } catch {
      toast.error('Network error');
    }
  }

  if (!activeDocument) {
    return (
      <div className="rounded-xl border border-border bg-background px-8 py-16 text-center">
        <p className="text-sm text-text-secondary mb-4">No terms documents found.</p>
        <Button
          onClick={async () => {
            setCreating(true);
            try {
              const res = await fetch('/api/terms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: 'Standard Terms & Conditions',
                  sections: [
                    { number: '1', title: 'Scope of Services', body: 'Define the scope of services to be provided.' },
                    { number: '2', title: 'Payment Terms', body: 'Define the payment terms and schedule.' },
                    { number: '3', title: 'Cancellation Policy', body: 'Define the cancellation and refund policy.' },
                  ],
                }),
              });
              if (res.ok) router.refresh();
            } finally {
              setCreating(false);
            }
          }}
          disabled={creating}
        >
          {creating ? 'Creating...' : 'Create First Terms Document'}
        </Button>
      </div>
    );
  }

  const sections = activeDocument.sections ?? [];

  return (
    <>
      {/* Actions bar */}
      <div className="flex items-center gap-3 mb-6">
        {allDocuments.length > 1 && (
          <Button variant="ghost" size="sm" onClick={() => setShowVersions(!showVersions)}>
            {showVersions ? 'Hide Versions' : `${allDocuments.length} Versions`}
          </Button>
        )}
        <div className="flex-1" />
        {!editing ? (
          <Button variant="ghost" size="sm" onClick={() => { setEditing(true); setEditingSections([...(activeDocument.sections ?? [])]); }}>Edit Sections</Button>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveSections}>Save Changes</Button>
          </>
        )}
        <Button variant="secondary" size="sm" onClick={() => setDeleteConfirmId(activeDocument.id)} className="text-red-600 hover:bg-red-50">Archive</Button>
        <Button
          variant="secondary"
          disabled={creating}
          onClick={handleCreateVersion}
        >
          {creating ? 'Creating...' : 'New Version'}
        </Button>
      </div>

      {/* Document header card */}
      <div className="rounded-xl border border-border bg-background px-6 py-5 mb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">{activeDocument.title}</h2>
            <p className="mt-1 text-xs text-text-muted">
              Version {activeDocument.version} &middot; Updated {formatDate(activeDocument.updated_at)}
            </p>
          </div>
          <StatusBadge status={activeDocument.is_active ? 'active' : activeDocument.status} colorMap={TERMS_STATUS_COLORS} className="self-start" />
        </div>
      </div>

      {/* Version history */}
      {showVersions && allDocuments.length > 1 && (
        <div className="rounded-xl border border-border bg-background p-4 mb-6">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Version History</h3>
          <div className="space-y-2">
            {allDocuments.map((doc) => (
              <div key={doc.id} className={`flex items-center justify-between py-2 px-3 rounded-lg ${doc.id === activeDocument.id ? 'bg-bg-secondary' : ''}`}>
                <div>
                  <p className="text-sm text-foreground">{doc.title}</p>
                  <p className="text-xs text-text-muted">{formatDate(doc.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!doc.is_active && (
                    <Button variant="ghost" size="sm" onClick={() => handleSetActive(doc.id)}>Set Active</Button>
                  )}
                  <StatusBadge status={doc.is_active ? 'active' : doc.status} colorMap={TERMS_STATUS_COLORS} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirmId !== null}
        title="Archive Document"
        description="This will archive this terms document version. It will no longer be available for new proposals."
        confirmLabel="Archive"
        onConfirm={() => deleteConfirmId && handleArchive(deleteConfirmId)}
        onCancel={() => setDeleteConfirmId(null)}
      />

      {/* Sections */}
      <div className="space-y-3">
        {sections.length === 0 ? (
          <div className="rounded-xl border border-border bg-background px-8 py-12 text-center">
            <p className="text-sm text-text-secondary">This document has no sections.</p>
          </div>
        ) : (
          sections.map((section) => {
            const isExpanded = expandedSections.has(section.number);
            return (
              <div
                key={section.number}
                className="rounded-xl border border-border bg-background overflow-hidden"
              >
                <button
                  onClick={() => toggleSection(section.number)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left transition-colors hover:bg-bg-secondary/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-text-muted w-5 shrink-0">
                      {section.number}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {section.title}
                    </span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>
                {!isExpanded && (
                  <div className="px-6 pb-4 -mt-1">
                    <p className="text-xs text-text-muted line-clamp-2 pl-8">
                      {section.body}
                    </p>
                  </div>
                )}
                {isExpanded && (
                  <div className="px-6 pb-5 border-t border-border">
                    <p className="mt-4 text-sm text-text-secondary leading-relaxed pl-8">
                      {section.body}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
