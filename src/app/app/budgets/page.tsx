'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RoleGate } from '@/components/shared/RoleGate';

/**
 * /app/budgets — Role-gated redirect to /app/finance/budgets.
 * Designers and other restricted roles see access-denied before redirect.
 */
export default function BudgetsPage() {
  return (
    <RoleGate allowedRoles={['developer', 'owner', 'admin', 'controller', 'manager']}>
      <BudgetsRedirect />
    </RoleGate>
  );
}

function BudgetsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/app/finance/budgets');
  }, [router]);

  return (
    <div className="flex items-center justify-center py-16">
      <p className="text-sm text-text-secondary">Redirecting to budgets…</p>
    </div>
  );
}
