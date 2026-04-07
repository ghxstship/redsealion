import EmptyState from '@/components/ui/EmptyState';
import { Inbox } from 'lucide-react';

export default function MyInboxPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          My Inbox
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage comments, tags, and system notifications.
        </p>
      </div>

      <EmptyState
        icon={<Inbox className="w-8 h-8" />}
        message="Inbox zero"
        description="Your unified notification center is currently being configured."
      />
    </div>
  );
}
