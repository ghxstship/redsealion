'use client';

import { useState } from 'react';
import { TierGate } from '@/components/shared/TierGate';
import Button from '@/components/ui/Button';
import ModalShell from '@/components/ui/ModalShell';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import PageHeader from '@/components/shared/PageHeader';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  mergeFields: string[];
}

const BUILT_IN_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tpl_initial_outreach',
    name: 'Initial Outreach',
    subject: 'Hi {{contact_name}} — quick intro from {{company_name}}',
    body: `Hi {{contact_name}},\n\nI'm reaching out because I came across {{client_company}} and wanted to introduce our team. We specialize in {{industry}} production and have worked with companies like yours to deliver exceptional results.\n\nWould you be open to a brief conversation this week?\n\nBest,\n{{sender_name}}`,
    category: 'Prospecting',
    mergeFields: ['contact_name', 'client_company', 'company_name', 'industry', 'sender_name'],
  },
  {
    id: 'tpl_proposal_followup',
    name: 'Proposal Follow-Up',
    subject: 'Following up on our proposal for {{deal_title}}',
    body: `Hi {{contact_name}},\n\nI wanted to follow up on the proposal we sent for {{deal_title}} ({{deal_value}}). I'd love to hear your thoughts and answer any questions.\n\nIs there a good time to connect this week?\n\nBest,\n{{sender_name}}`,
    category: 'Follow-Up',
    mergeFields: ['contact_name', 'deal_title', 'deal_value', 'sender_name'],
  },
  {
    id: 'tpl_check_in',
    name: 'Friendly Check-In',
    subject: 'Checking in — {{client_company}}',
    body: `Hi {{contact_name}},\n\nIt's been a little while since we connected, and I wanted to check in. How have things been going with {{client_company}}?\n\nIf there's anything we can help with — even just brainstorming — I'm happy to chat.\n\nHope you're doing well!\n\n{{sender_name}}`,
    category: 'Relationship',
    mergeFields: ['contact_name', 'client_company', 'sender_name'],
  },
  {
    id: 'tpl_meeting_request',
    name: 'Meeting Request',
    subject: 'Quick meeting to discuss {{deal_title}}?',
    body: `Hi {{contact_name}},\n\nI'd love to schedule a brief call to discuss {{deal_title}} and align on next steps.\n\nWould any of these times work for you?\n- [Option 1]\n- [Option 2]\n- [Option 3]\n\nAlternatively, feel free to pick a time that works best.\n\nLooking forward to connecting,\n{{sender_name}}`,
    category: 'Scheduling',
    mergeFields: ['contact_name', 'deal_title', 'sender_name'],
  },
  {
    id: 'tpl_thank_you',
    name: 'Post-Project Thank You',
    subject: 'Thank you — {{project_name}}',
    body: `Hi {{contact_name}},\n\nI wanted to extend a sincere thank you for the opportunity to work with {{client_company}} on {{project_name}}. It was a fantastic project and we're proud of what we delivered together.\n\nIf you ever need anything in the future, don't hesitate to reach out. We'd also love a testimonial if you're open to it!\n\nWarmly,\n{{sender_name}}`,
    category: 'Relationship',
    mergeFields: ['contact_name', 'client_company', 'project_name', 'sender_name'],
  },
  {
    id: 'tpl_closing_push',
    name: 'Closing Push',
    subject: 'Ready to move forward on {{deal_title}}?',
    body: `Hi {{contact_name}},\n\nI know there's been a lot to consider with {{deal_title}}, and I want to make sure we're aligned before the {{expected_close_date}} timeline.\n\nIs there anything holding things up that I can help address? I'm confident we can make this work.\n\nLet me know how you'd like to proceed.\n\nBest,\n{{sender_name}}`,
    category: 'Closing',
    mergeFields: ['contact_name', 'deal_title', 'expected_close_date', 'sender_name'],
  },
];

const CATEGORIES = ['All', ...new Set(BUILT_IN_TEMPLATES.map((t) => t.category))];

export default function EmailTemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [copied, setCopied] = useState(false);

  const filtered = selectedCategory === 'All'
    ? BUILT_IN_TEMPLATES
    : BUILT_IN_TEMPLATES.filter((t) => t.category === selectedCategory);

  async function handleCopy(body: string) {
    await navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <TierGate feature="email_inbox">
<PageHeader
        title="Email Templates"
        subtitle="Reusable email templates with merge fields for quick, personalized outreach."
      />

      {/* Category filters */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-foreground text-white'
                : 'bg-bg-secondary text-text-muted hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((template) => (
          <div
            key={template.id}
            className="group rounded-xl border border-border bg-white p-5 transition-colors hover:border-foreground/20 cursor-pointer"
            onClick={() => setPreviewTemplate(template)}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground">{template.name}</h3>
              <span className="inline-flex items-center rounded-full bg-bg-secondary px-2 py-0.5 text-[10px] font-medium text-text-muted">
                {template.category}
              </span>
            </div>
            <p className="text-xs text-text-secondary line-clamp-2 mb-3">{template.subject}</p>
            <div className="flex flex-wrap gap-1">
              {template.mergeFields.slice(0, 3).map((field) => (
                <span
                  key={field}
                  className="inline-flex items-center rounded bg-bg-secondary px-1.5 py-0.5 text-[10px] font-mono text-text-muted"
                >
                  {`{{${field}}}`}
                </span>
              ))}
              {template.mergeFields.length > 3 && (
                <span className="text-[10px] text-text-muted">+{template.mergeFields.length - 3} more</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Preview modal */}
      <ModalShell open={!!previewTemplate} onClose={() => setPreviewTemplate(null)} title={previewTemplate?.name ?? 'Template Preview'}>
        {previewTemplate && (
          <div className="space-y-4">
            <div>
              <FormLabel>Subject</FormLabel>
              <FormInput value={previewTemplate.subject} readOnly />
            </div>
            <div>
              <FormLabel>Body</FormLabel>
              <div className="rounded-lg border border-border bg-bg-secondary p-4 min-h-[200px]">
                <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                  {previewTemplate.body}
                </pre>
              </div>
            </div>
            <div>
              <FormLabel>Merge Fields</FormLabel>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {previewTemplate.mergeFields.map((field) => (
                  <span
                    key={field}
                    className="inline-flex items-center rounded bg-bg-secondary px-2 py-1 text-xs font-mono text-text-secondary"
                  >
                    {`{{${field}}}`}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" size="sm" onClick={() => handleCopy(previewTemplate.body)}>
                {copied ? 'Copied!' : 'Copy Body'}
              </Button>
              <Button size="sm" onClick={() => setPreviewTemplate(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </ModalShell>
    </TierGate>
  );
}
