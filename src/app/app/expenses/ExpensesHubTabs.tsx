import HubTabs from '@/components/shared/HubTabs';

const TABS = [
  { key: '', label: 'Expenses' },
  { key: 'approvals', label: 'Approvals' },
  { key: 'receipts', label: 'Receipts' },
  { key: 'mileage', label: 'Mileage' },
];

export default function ExpensesHubTabs() {
  return <HubTabs basePath="/app/expenses" tabs={TABS} />;
}
