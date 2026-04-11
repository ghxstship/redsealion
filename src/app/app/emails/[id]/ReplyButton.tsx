'use client';

import ComposeEmailModal from '../ComposeEmailModal';

export default function ReplyButton({
  open,
  onClose,
  onCreated,
  threadId,
  toEmail,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  threadId: string;
  toEmail?: string;
}) {
  return (
    <ComposeEmailModal
      open={open}
      onClose={onClose}
      onCreated={onCreated}
      threadId={threadId}
      prefillTo={toEmail}
    />
  );
}
