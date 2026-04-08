'use client';
import { RoleGate } from '@/components/shared/RoleGate';

export default function InvoiceHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate resource="invoices">
      {children}
    </RoleGate>
  );
}
