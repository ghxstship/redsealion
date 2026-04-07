'use client';

import { useRouter } from 'next/navigation';
import PageHeader from '@/components/shared/PageHeader';
import CreateAdvanceModal from '@/components/admin/advances/CreateAdvanceModal';

export default function AdvancingHeader() {
  const router = useRouter();

  return (
    <PageHeader
      title="Advancing"
      subtitle="Production advances, equipment requests, and service orders"
      actionLabel="New Advance"
      renderModal={(props) => (
        <CreateAdvanceModal
          {...props}
          onCreated={() => {
            props.onCreated();
            router.refresh();
          }}
        />
      )}
    />
  );
}
