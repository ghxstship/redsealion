'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Button from '@/components/ui/Button';
import { formatLabel } from '@/lib/utils';
import FormSelect from '@/components/ui/FormSelect';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import { useTranslation } from '@/lib/i18n/client';
import { createClient } from '@/lib/supabase/client';

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
  issued_to: string | null;
  notes: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

interface ComplianceDocumentsPanelProps {
  crewId: string;
}

function useDocTypeLabels() {
  const { t } = useTranslation();
  return {
    coi: t('compliance.docTypes.coi'),
    w9: t('compliance.docTypes.w9'),
    w4: t('compliance.docTypes.w4'),
    license: t('compliance.docTypes.license'),
    certification: t('compliance.docTypes.certification'),
    background_check: t('compliance.docTypes.background_check'),
    nda: t('compliance.docTypes.nda'),
    i9: t('compliance.docTypes.i9'),
    drivers_license: t('compliance.docTypes.drivers_license'),
    contract: t('compliance.docTypes.contract'),
    permit: t('compliance.docTypes.permit'),
    other: t('compliance.docTypes.other'),
  } as Record<string, string>;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  uploaded: 'bg-blue-50 text-blue-700',
  verified: 'bg-green-50 text-green-700',
  expired: 'bg-red-500/10 text-red-700',
  rejected: 'bg-bg-secondary text-text-muted',
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
  const DOC_TYPE_LABELS = useDocTypeLabels();
  const [documents, setDocuments] = useState<ComplianceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [rejectDocId, setRejectDocId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newDoc, setNewDoc] = useState({
    document_type: 'coi',
    document_name: '',
    expiry_date: '',
    issued_to: '',
    notes: '',
  });

  const fetchDocuments = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/crew/${crewId}/compliance`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      } else {
        setError('Failed to load compliance documents.');
      }
    } catch {
      setError('Network error loading compliance documents.');
    } finally {
      setLoading(false);
    }
  }, [crewId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // GAP-L4: Realtime subscription for live compliance updates
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`compliance-docs-${crewId}`)
      .on<ComplianceDocument>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'compliance_documents',
          filter: `crew_profile_id=eq.${crewId}`,
        },
        () => {
          // Re-fetch on any change to this crew member's compliance docs
          fetchDocuments();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [crewId, fetchDocuments]);

  async function uploadFile(file: File): Promise<{ url: string; name: string; size: number } | null> {
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() || 'pdf';
      const path = `${crewId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('compliance-documents')
        .upload(path, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        // Bucket may not exist — silently fail and create doc without file
        console.warn('File upload failed (bucket may not exist):', uploadError.message);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from('compliance-documents')
        .getPublicUrl(path);

      return { url: urlData.publicUrl, name: file.name, size: file.size };
    } catch {
      return null;
    }
  }

  async function handleAdd() {
    if (!newDoc.document_name) return;
    setSaving(true);
    setError(null);

    let fileData: { url: string; name: string; size: number } | null = null;

    // Upload file if selected
    if (selectedFile) {
      setUploading(true);
      fileData = await uploadFile(selectedFile);
      setUploading(false);
    }

    try {
      const res = await fetch(`/api/crew/${crewId}/compliance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newDoc,
          file_url: fileData?.url || null,
          file_name: fileData?.name || null,
          file_size_bytes: fileData?.size || null,
        }),
      });

      if (res.ok) {
        setNewDoc({ document_type: 'coi', document_name: '', expiry_date: '', issued_to: '', notes: '' });
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setShowForm(false);
        await fetchDocuments();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to add document.');
      }
    } catch {
      setError('Network error adding document.');
    } finally {
      setSaving(false);
    }
  }

  async function handleVerify(docId: string) {
    setActionInProgress(docId);
    setError(null);
    try {
      const res = await fetch(`/api/crew/${crewId}/compliance/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'verified' }),
      });
      if (res.ok) {
        await fetchDocuments();
      } else {
        setError('Failed to verify document.');
      }
    } catch {
      setError('Network error verifying document.');
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleReject(docId: string) {
    setActionInProgress(docId);
    setError(null);
    try {
      const res = await fetch(`/api/crew/${crewId}/compliance/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', rejection_reason: rejectionReason || null }),
      });
      if (res.ok) {
        setRejectDocId(null);
        setRejectionReason('');
        await fetchDocuments();
      } else {
        setError('Failed to reject document.');
      }
    } catch {
      setError('Network error rejecting document.');
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleDelete(docId: string) {
    setActionInProgress(docId);
    setError(null);
    try {
      const res = await fetch(`/api/crew/${crewId}/compliance/${docId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setConfirmDelete(null);
        await fetchDocuments();
      } else {
        setError('Failed to delete document.');
      }
    } catch {
      setError('Network error deleting document.');
    } finally {
      setActionInProgress(null);
    }
  }

  const expiredCount = documents.filter((d) => isExpired(d.expiry_date)).length;
  const expiringCount = documents.filter((d) => isExpiringSoon(d.expiry_date) && !isExpired(d.expiry_date)).length;
  const verifiedCount = documents.filter((d) => d.status === 'verified').length;

  return (
    <div className="rounded-xl border border-border bg-background">
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
              <span className="rounded-full bg-red-500/10 text-red-700 px-2 py-0.5 text-[11px] font-medium">
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

      {/* Error Banner */}
      {error && (
        <div className="border-b border-red-500/30 bg-red-500/10 px-5 py-2.5 text-xs text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 text-xs font-medium">
            Dismiss
          </button>
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <div className="border-b border-border bg-bg-secondary/30 px-5 py-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <FormLabel>Type</FormLabel>
              <FormSelect
                value={newDoc.document_type}
                onChange={(e) => setNewDoc((p) => ({ ...p, document_type: e.target.value }))}
              >
                {Object.entries(DOC_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </FormSelect>
            </div>
            <div>
              <FormLabel>Document Name</FormLabel>
              <FormInput
                type="text"
                value={newDoc.document_name}
                onChange={(e) => setNewDoc((p) => ({ ...p, document_name: e.target.value }))}
                placeholder="e.g., General Liability COI" />
            </div>
            <div>
              <FormLabel>Expiry Date</FormLabel>
              <FormInput
                type="date"
                value={newDoc.expiry_date}
                onChange={(e) => setNewDoc((p) => ({ ...p, expiry_date: e.target.value }))} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <FormLabel>Issued To</FormLabel>
              <FormInput
                type="text"
                value={newDoc.issued_to}
                onChange={(e) => setNewDoc((p) => ({ ...p, issued_to: e.target.value }))}
                placeholder="e.g., Vendor name or crew member" />
            </div>
            <div>
              <FormLabel>Notes</FormLabel>
              <FormInput
                type="text"
                value={newDoc.notes}
                onChange={(e) => setNewDoc((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Optional notes" />
            </div>
          </div>
          {/* GAP-C5: File upload */}
          <div>
            <FormLabel>Attach Document File</FormLabel>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.tiff"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              className="block w-full text-xs text-text-muted file:mr-3 file:rounded-lg file:border file:border-border file:bg-bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-foreground hover:file:bg-bg-secondary/80 file:cursor-pointer file:transition-colors"
            />
            {selectedFile && (
              <p className="mt-1 text-[11px] text-text-muted">
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={handleAdd}
              disabled={saving || uploading || !newDoc.document_name}>
              {uploading ? 'Uploading…' : saving ? 'Adding…' : 'Add Document'}
            </Button>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal Inline */}
      {rejectDocId && (
        <div className="border-b border-border bg-amber-50/50 px-5 py-4 space-y-2">
          <p className="text-xs font-medium text-foreground">Rejection Reason</p>
          <FormInput
            type="text"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter reason for rejection (optional)" />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setRejectDocId(null); setRejectionReason(''); }}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-bg-secondary transition-colors"
            >Cancel</button>
            <Button size="sm" variant="danger" onClick={() => handleReject(rejectDocId)}
              disabled={actionInProgress === rejectDocId}>
              {actionInProgress === rejectDocId ? 'Rejecting…' : 'Reject'}
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Inline */}
      {confirmDelete && (
        <div className="border-b border-border bg-red-500/10 px-5 py-4 space-y-2">
          <p className="text-xs font-medium text-red-700">
            Are you sure you want to delete this document? This action cannot be undone.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setConfirmDelete(null)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-bg-secondary transition-colors"
            >Cancel</button>
            <Button size="sm" variant="danger" onClick={() => handleDelete(confirmDelete)}
              disabled={actionInProgress === confirmDelete}>
              {actionInProgress === confirmDelete ? 'Deleting…' : 'Delete'}
            </Button>
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
            Add COI, W-9, licenses, contracts, and other required documents.
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
                    {doc.issued_to && <span>Issued to: {doc.issued_to}</span>}
                    {doc.expiry_date && (
                      <span>
                        Expires: {new Date(doc.expiry_date + 'T00:00:00').toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                    {doc.file_name && <span>File: {doc.file_name}</span>}
                    {doc.rejection_reason && (
                      <span className="text-red-600">Reason: {doc.rejection_reason}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {doc.file_url && (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-bg-secondary transition-colors"
                    >
                      View
                    </a>
                  )}
                  {doc.status !== 'verified' && doc.status !== 'rejected' && (
                    <button
                      onClick={() => handleVerify(doc.id)}
                      disabled={actionInProgress === doc.id}
                      className="rounded-lg border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
                    >
                      {actionInProgress === doc.id ? '…' : 'Verify'}
                    </button>
                  )}
                  {doc.status !== 'rejected' && doc.status !== 'verified' && (
                    <button
                      onClick={() => setRejectDocId(doc.id)}
                      disabled={actionInProgress === doc.id}
                      className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmDelete(doc.id)}
                    disabled={actionInProgress === doc.id}
                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
