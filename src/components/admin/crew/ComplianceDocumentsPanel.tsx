'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatLabel } from '@/lib/utils';

interface ComplianceDocument {
  id: string;
  document_type: string;
  document_name: string;
  description: string | null;
  file_url: string | null;
  file_name: string | null;
  status: string;
  issued_date: string | null;
  expiry_date: string | null;
  verified_at: string | null;
  created_at: string;
}

interface ComplianceDocumentsPanelProps {
  crewId: string;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  coi: 'Certificate of Insurance',
  w9: 'W-9',
  w4: 'W-4',
  license: 'Professional License',
  certification: 'Certification',
  background_check: 'Background Check',
  nda: 'NDA',
  i9: 'I-9',
  drivers_license: "Driver's License",
  other: 'Other',
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  uploaded: 'bg-blue-50 text-blue-700',
  verified: 'bg-green-50 text-green-700',
  expired: 'bg-red-50 text-red-700',
  rejected: 'bg-gray-100 text-gray-600',
};



function isExpiringSoon(expiryDate: string | null): boolean {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate + 'T00:00:00');
  const now = new Date();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  return expiry.getTime() - now.getTime() < thirtyDays && expiry.getTime() > now.getTime();
}

function isExpired(expiryDate: string | null): boolean {
  if (!expiryDate) return false;
  return new Date(expiryDate + 'T00:00:00') < new Date();
}

export default function ComplianceDocumentsPanel({ crewId }: ComplianceDocumentsPanelProps) {
  const [documents, setDocuments] = useState<ComplianceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newDoc, setNewDoc] = useState({
    document_type: 'coi',
    document_name: '',
    expiry_date: '',
  });

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch(`/api/crew/${crewId}/compliance`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch {
      // Fail silently — compliance section is supplementary
    } finally {
      setLoading(false);
    }
  }, [crewId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  async function handleAdd() {
    if (!newDoc.document_name) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/crew/${crewId}/compliance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoc),
      });

      if (res.ok) {
        setNewDoc({ document_type: 'coi', document_name: '', expiry_date: '' });
        setShowForm(false);
        await fetchDocuments();
      }
    } catch {
      // Silent
    } finally {
      setSaving(false);
    }
  }

  const expiredCount = documents.filter((d) => isExpired(d.expiry_date)).length;
  const expiringCount = documents.filter((d) => isExpiringSoon(d.expiry_date) && !isExpired(d.expiry_date)).length;
  const verifiedCount = documents.filter((d) => d.status === 'verified').length;

  return (
    <div className="rounded-xl border border-border bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-foreground">Compliance Documents</h3>
          <div className="flex gap-1.5">
            {verifiedCount > 0 && (
              <span className="rounded-full bg-green-50 text-green-700 px-2 py-0.5 text-[11px] font-medium">
                {verifiedCount} verified
              </span>
            )}
            {expiringCount > 0 && (
              <span className="rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-[11px] font-medium">
                {expiringCount} expiring soon
              </span>
            )}
            {expiredCount > 0 && (
              <span className="rounded-full bg-red-50 text-red-700 px-2 py-0.5 text-[11px] font-medium">
                {expiredCount} expired
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-bg-secondary transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Document'}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="border-b border-border bg-bg-secondary/30 px-5 py-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Type</label>
              <select
                value={newDoc.document_type}
                onChange={(e) => setNewDoc((p) => ({ ...p, document_type: e.target.value }))}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground"
              >
                {Object.entries(DOC_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Document Name</label>
              <input
                type="text"
                value={newDoc.document_name}
                onChange={(e) => setNewDoc((p) => ({ ...p, document_name: e.target.value }))}
                placeholder="e.g., General Liability COI"
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Expiry Date</label>
              <input
                type="date"
                value={newDoc.expiry_date}
                onChange={(e) => setNewDoc((p) => ({ ...p, expiry_date: e.target.value }))}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleAdd}
              disabled={saving || !newDoc.document_name}
              className="rounded-lg bg-foreground px-4 py-2 text-xs font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Adding…' : 'Add Document'}
            </button>
          </div>
        </div>
      )}

      {/* Document List */}
      {loading ? (
        <div className="px-5 py-8 text-center text-sm text-text-muted">Loading…</div>
      ) : documents.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-text-muted">No compliance documents on file.</p>
          <p className="text-xs text-text-muted mt-1">
            Add COI, W-9, licenses, and other required documents.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {documents.map((doc) => {
            const expired = isExpired(doc.expiry_date);
            const expiring = isExpiringSoon(doc.expiry_date) && !expired;

            return (
              <div key={doc.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">
                      {doc.document_name}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        expired
                          ? STATUS_STYLES.expired
                          : STATUS_STYLES[doc.status] ?? STATUS_STYLES.pending
                      }`}
                    >
                      {expired ? 'Expired' : formatLabel(doc.status)}
                    </span>
                    {expiring && (
                      <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-[11px] font-medium">
                        Expiring Soon
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-text-muted">
                    <span>{DOC_TYPE_LABELS[doc.document_type] ?? doc.document_type}</span>
                    {doc.expiry_date && (
                      <span>
                        Expires: {new Date(doc.expiry_date + 'T00:00:00').toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                </div>
                {doc.file_url && (
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-bg-secondary transition-colors"
                  >
                    View
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
