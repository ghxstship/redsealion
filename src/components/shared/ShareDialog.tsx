'use client';

import { useState } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';
import FormTextarea from '@/components/ui/FormTextarea';

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

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/shared/${entityType}/${entityId}`;

  function handleCopyLink() {
    void navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <ModalShell open={open} onClose={onClose} title={`Share "${entityName}"`} size="md">
      <div className="space-y-4">
        {/* Copy link */}
        <div>
          <FormLabel>Share Link</FormLabel>
          <div className="flex gap-2">
            <FormInput
              type="text"
              readOnly
              value={shareUrl} />
            <Button onClick={handleCopyLink} size="sm">
              {copied ? 'Copied!' : 'Copy'}
            </Button>
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
            <span className={`inline-block h-4 w-4 rounded-full bg-background transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Email invite */}
        <div>
          <FormLabel>Invite via Email</FormLabel>
          <div className="flex gap-2">
            <FormInput type="email" placeholder="email@example.com" className="flex-1" />
            <Button variant="secondary" size="sm">Send</Button>
          </div>
        </div>

        {/* Embed code */}
        <div>
          <FormLabel>Embed</FormLabel>
          <FormTextarea
            readOnly
            rows={2}
            value={`<iframe src="${shareUrl}/embed" width="100%" height="600" frameBorder="0"></iframe>`} />
        </div>
      </div>
    </ModalShell>
  );
}
