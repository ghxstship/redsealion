'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ModalShell from '@/components/ui/ModalShell';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import FormTextarea from '@/components/ui/FormTextarea';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

export default function ComposeEmailModal({
  open,
  onClose,
  onCreated,
  threadId,
  prefillTo,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  /** Optional thread ID for replies — links the new message to an existing thread. */
  threadId?: string;
  /** Pre-filled recipient for replies. */
  prefillTo?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [to, setTo] = useState(prefillTo ?? '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          subject,
          body_text: body,
          thread_id: threadId ?? undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error?.message ?? 'Failed to send email.');
        setLoading(false);
        return;
      }

      setTo('');
      setSubject('');
      setBody('');
      setLoading(false);
      onCreated();
      router.refresh();
    } catch {
      setError('Failed to send email.');
      setLoading(false);
    }
  }

  return (
    <ModalShell title={threadId ? 'Reply' : 'New Email Draft'} open={open} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="error">{error}</Alert>
        )}
        <div>
          <FormLabel>To</FormLabel>
          <FormInput 
            value={to} 
            onChange={(e) => setTo(e.target.value)} 
            placeholder="recipient@example.com"
            required 
          />
        </div>
        <div>
          <FormLabel>Subject</FormLabel>
          <FormInput 
            value={subject} 
            onChange={(e) => setSubject(e.target.value)} 
            placeholder="Message Subject"
            required 
          />
        </div>
        <div>
          <FormLabel>Message Body</FormLabel>
          <FormTextarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            placeholder="Write your message here..."
            rows={6}
          />
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading} disabled={loading || !to || !subject || !body}>Send</Button>
        </div>
      </form>
    </ModalShell>
  );
}
