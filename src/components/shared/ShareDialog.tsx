'use client';

import { useState } from 'react';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  entityType: string;
  entityId: string;
  entityName: string;
}

export default function ShareDialog({ open, onClose, entityType, entityId, entityName }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

  if (!open) return null;

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/shared/${entityType}/${entityId}`;

  function handleCopyLink() {
    void navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      <div className="fixed inset-0 bg-black/40 animate-modal-backdrop" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-xl animate-modal-content my-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Share &quot;{entityName}&quot;</h2>
          <button onClick={onClose} className="text-text-muted hover:text-foreground transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="5" y1="5" x2="15" y2="15" /><line x1="15" y1="5" x2="5" y2="15" />
            </svg>
          </button>
        </div>

        {/* Copy link */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Share Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-secondary truncate"
              />
              <button
                onClick={handleCopyLink}
                className="shrink-0 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-foreground/90"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Public toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Public Access</p>
              <p className="text-xs text-text-muted mt-0.5">Anyone with the link can view</p>
            </div>
            <button
              onClick={() => setIsPublic(!isPublic)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPublic ? 'bg-green-500' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Email invite */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Invite via Email</label>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="email@example.com"
                className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10"
              />
              <button className="shrink-0 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary">
                Send
              </button>
            </div>
          </div>

          {/* Embed code */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Embed</label>
            <textarea
              readOnly
              rows={2}
              value={`<iframe src="${shareUrl}/embed" width="100%" height="600" frameBorder="0"></iframe>`}
              className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-xs text-text-muted font-mono resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
