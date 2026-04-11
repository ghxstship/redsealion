import Link from 'next/link';
import { TierGate } from '@/components/shared/TierGate';
import { AUTOMATION_TEMPLATES, getTemplateCategories } from '@/lib/automations/templates';
import StatusBadge from '@/components/ui/StatusBadge';

const CATEGORY_COLORS: Record<string, string> = {
  'Project Setup': 'bg-indigo-50 text-indigo-700',
  Finance: 'bg-green-50 text-green-700',
  Notifications: 'bg-cyan-50 text-cyan-700',
  Sales: 'bg-blue-50 text-blue-700',
  'Time Tracking': 'bg-orange-50 text-orange-700',
  Operations: 'bg-orange-50 text-orange-700',
  Marketing: 'bg-purple-50 text-purple-700',
  Production: 'bg-red-50 text-red-700',
};

export default function AutomationTemplatesPage() {
  const categories = getTemplateCategories();

  return (
    <TierGate feature="automations">
      {categories.map((category) => {
        const templates = AUTOMATION_TEMPLATES.filter((t) => t.category === category);
        return (
          <div key={category} className="mb-8">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">{category}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Link
                  key={template.id}
                  href={`/app/automations/new?template=${template.id}`}
                  className="rounded-xl border border-border bg-background px-5 py-5 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all group"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <StatusBadge status={template.category} colorMap={CATEGORY_COLORS} />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">{template.name}</h3>
                    <p className="text-xs text-text-secondary mt-1">{template.description}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <p className="text-xs text-text-muted">Trigger: <span className="font-medium text-text-secondary">{template.trigger_type.replace(/_/g, ' ')}</span></p>
                    <span className="text-xs font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      Use Template →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </TierGate>
  );
}
