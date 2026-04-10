'use client';

import { useState } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import Button from '@/components/ui/Button';

export default function ComposeEmailModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // In a real implementation we would insert into email_messages 
    // and trigger backend processing sync.
    // For now we mock the successful response to unblock the UI flow.
    setTimeout(() => {
      setLoading(false);
      onCreated();
    }, 500);
  }

  return (
    <ModalShell title="New Email Draft" open={open} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <FormLabel>MessageBody</FormLabel>
          <textarea
            className="w-full flex min-h-[120px] rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            placeholder="Write your message here..."
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
