'use client';

import { useState, type FormEvent } from 'react';
import { formatLabel } from '@/lib/utils';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface NotificationFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const TYPE_OPTIONS = ['general', 'reminder', 'announcement', 'alert'] as const;
const PRIORITY_OPTIONS = ['normal', 'high', 'urgent'] as const;

export default function NotificationFormModal({ open, onClose, onCreated }: NotificationFormModalProps) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('general');
  const [priority, setPriority] = useState('normal');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setRecipientEmail('');
    setRecipientName('');
    setSubject('');
    setBody('');
    setType('general');
    setPriority('normal');
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_email: recipientEmail,
          recipient_name: recipientName || undefined,
          subject,
          body,
          type,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send notification');
      }

      resetForm();
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} title="New Message">
      {error && <Alert className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Recipient Email</FormLabel>
            <FormInput
              type="email"
              required
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </div>
          <div>
            <FormLabel>Recipient Name</FormLabel>
            <FormInput
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>

        <div>
          <FormLabel>Subject</FormLabel>
          <FormInput
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Reminder: Event setup tomorrow"
          />
        </div>

        <div>
          <FormLabel>Message</FormLabel>
          <FormTextarea
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Write your message..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Type</FormLabel>
            <FormSelect value={type} onChange={(e) => setType(e.target.value)}>
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{formatLabel(t)}</option>
              ))}
            </FormSelect>
          </div>
          <div>
            <FormLabel>Priority</FormLabel>
            <FormSelect value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>{formatLabel(p)}</option>
              ))}
            </FormSelect>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>
            {submitting ? 'Sending...' : 'Send Message'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
