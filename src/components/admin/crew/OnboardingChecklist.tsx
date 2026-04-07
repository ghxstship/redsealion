'use client';

import React, { useState } from 'react';
import Alert from '@/components/ui/Alert';

interface Document {
  id: string;
  type: string;
  name: string;
  status: string;
  file_url: string | null;
}

interface OnboardingChecklistProps {
  userId: string;
  documents: Document[];
}

const STATUS_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  pending: { icon: '\u25CB', color: 'text-gray-400', label: 'Pending' },
  uploaded: { icon: '\u25D4', color: 'text-blue-500', label: 'Uploaded' },
  verified: { icon: '\u2713', color: 'text-green-600', label: 'Verified' },
  rejected: { icon: '\u2717', color: 'text-red-600', label: 'Rejected' },
};

export default function OnboardingChecklist({ userId, documents }: OnboardingChecklistProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (docId: string, file: File) => {
    setUploading(docId);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/crew/${userId}/documents/${docId}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? 'Upload failed.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  const triggerFileInput = (docId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleUpload(docId, file);
    };
    input.click();
  };

  const completed = documents.filter((d) => d.status === 'verified').length;
  const total = documents.length;

  return (
    <div className="bg-white border border-border rounded-lg shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground">Onboarding Checklist</h2>
        <span className="text-xs text-text-muted">
          {completed}/{total} complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-bg-secondary rounded-full mb-4">
        <div
          className="h-2 bg-green-500 rounded-full transition-[width,opacity]"
          style={{ width: total > 0 ? `${(completed / total) * 100}%` : '0%' }}
        />
      </div>

      {error && (
        <Alert className="mb-4">{error}</Alert>
      )}

      <ul className="space-y-3">
        {documents.map((doc) => {
          const config = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.pending;
          return (
            <li key={doc.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
              <span className={`text-lg ${config.color}`}>{config.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground font-medium truncate">{doc.name}</p>
                <p className="text-xs text-text-muted">{doc.type} &mdash; {config.label}</p>
              </div>
              {(doc.status === 'pending' || doc.status === 'rejected') && (
                <button
                  onClick={() => triggerFileInput(doc.id)}
                  disabled={uploading === doc.id}
                  className="px-3 py-1 text-xs rounded-lg bg-bg-secondary text-foreground hover:bg-bg-tertiary disabled:opacity-50"
                >
                  {uploading === doc.id ? 'Uploading...' : 'Upload'}
                </button>
              )}
              {doc.file_url && doc.status !== 'pending' && (
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  View
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
