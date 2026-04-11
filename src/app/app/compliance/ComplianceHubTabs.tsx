'use client';
import HubTabs from '@/components/shared/HubTabs';

export default function ComplianceHubTabs() {
  return (
    <HubTabs
      basePath="/app/compliance"
      tabs={[
        { key: '', label: 'Overview' },
        { key: 'contracts', label: 'Contracts' },
        { key: 'cois', label: 'COIs' },
        { key: 'licenses', label: 'Licenses' },
        { key: 'permits', label: 'Permits' },
        { key: 'certifications', label: 'Certifications' }
      ]}
    />
  );
}
