'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ModalShell from '@/components/ui/ModalShell';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { resolveClientOrg } from '@/lib/auth/resolve-org-client';

export default function ComposeEmailModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const ctx = await resolveClientOrg();
      if (!ctx) {
        setError('Not authenticated.');
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not authenticated.');
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase.from('email_messages').insert({
        organization_id: ctx.organizationId,
        direction: 'outbound',
        from_name: user.user_metadata?.full_name ?? user.email ?? 'Unknown',
        from_email: user.email ?? '',
        to_emails: [to],
        subject,
        body_text: body,
        sent_at: new Date().toISOString(),
        status: 'sent',
      });

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }

      setTo('');
      setSubject('');
      setBody('');
      onCreated();
      router.refresh();
    } catch {
      setError('Failed to send email.');
      setLoading(false);
    }
  }

  return (
    <ModalShell title="New Email Draft" open={open} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
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
