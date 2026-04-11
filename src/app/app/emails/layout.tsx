import type { Metadata } from 'next';
import { TierGate } from '@/components/shared/TierGate';
import { RoleGate } from '@/components/shared/RoleGate';

export const metadata: Metadata = {
  title: 'Emails | FlyteDeck',
  description: 'Manage email templates and inbox.',
};

export default function EmailsLayout({ children }: { children: React.ReactNode }) {
  return (
    <TierGate feature="email_inbox">
      <RoleGate resource="email_inbox">
        {children}
      </RoleGate>
    </TierGate>
  );
}
