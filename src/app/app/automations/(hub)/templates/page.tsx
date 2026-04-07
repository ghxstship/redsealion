import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import AutomationsHubTabs from '../../AutomationsHubTabs';

const TEMPLATES = [
  { name: 'New Lead Follow-up', trigger: 'Lead Created', description: 'Automatically send a welcome email when a new lead is captured.', category: 'Sales' },
  { name: 'Invoice Overdue Reminder', trigger: 'Invoice Overdue', description: 'Send payment reminders when invoices pass their due date.', category: 'Finance' },
  { name: 'Crew Scheduling Alert', trigger: 'Event Created', description: 'Notify available crew members when a new event needs staffing.', category: 'Operations' },
  { name: 'Proposal Approval Workflow', trigger: 'Proposal Submitted', description: 'Route proposals through the approval chain automatically.', category: 'Sales' },
  { name: 'Expense Report Auto-Submit', trigger: 'Receipt Uploaded', description: 'Auto-create expense reports from uploaded receipts.', category: 'Finance' },
  { name: 'Equipment Maintenance Alert', trigger: 'Maintenance Due', description: 'Schedule maintenance reminders based on usage or calendar cycles.', category: 'Operations' },
  { name: 'Client Birthday Outreach', trigger: 'Date Match', description: 'Send personalized birthday messages to client contacts.', category: 'Marketing' },
  { name: 'Project Status Update', trigger: 'Weekly Schedule', description: 'Auto-generate and send project status reports to stakeholders.', category: 'Production' },
];

const CATEGORY_COLORS: Record<string, string> = {
  Sales: 'bg-blue-50 text-blue-700',
  Finance: 'bg-green-50 text-green-700',
  Operations: 'bg-orange-50 text-orange-700',
  Marketing: 'bg-purple-50 text-purple-700',
  Production: 'bg-red-50 text-red-700',
};

export default function AutomationTemplatesPage() {
  return (
    <TierGate feature="automations">
      <PageHeader title="Automation Templates" subtitle="Pre-built workflow templates to get started quickly." />
      <AutomationsHubTabs />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((template) => (
          <div key={template.name} className="rounded-xl border border-border bg-white px-5 py-5 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[template.category] ?? 'bg-gray-50 text-gray-700'}`}>{template.category}</span>
              </div>
              <h3 className="text-sm font-semibold text-foreground">{template.name}</h3>
              <p className="text-xs text-text-secondary mt-1">{template.description}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-border">
              <p className="text-xs text-text-muted">Trigger: <span className="font-medium text-text-secondary">{template.trigger}</span></p>
            </div>
          </div>
        ))}
      </div>
    </TierGate>
  );
}
