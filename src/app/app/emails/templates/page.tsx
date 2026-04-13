'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { TierGate } from '@/components/shared/TierGate';
import Button from '@/components/ui/Button';
import ModalShell from '@/components/ui/ModalShell';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import FormTextarea from '@/components/ui/FormTextarea';
import PageHeader from '@/components/shared/PageHeader';
import Tabs from '@/components/ui/Tabs';
import EmptyState from '@/components/ui/EmptyState';
import Tag from '@/components/ui/Tag';
import { createClient } from '@/lib/supabase/client';
import { resolveClientOrg } from '@/lib/auth/resolve-org-client';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

interface EmailTemplate {
  id: string;
  name: string;
  subject_template: string;
  body_template: string;
  category: string;
  merge_fields: string[];
}

export default function EmailTemplatesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<EmailTemplate>>({});
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    resolveClientOrg().then((org) => {
      if (org) {
        setCurrentOrgId(org.organizationId);
      }
    });
  }, []);

  useEffect(() => {
    if (currentOrgId) {
      loadTemplates();
    }
  }, [currentOrgId]);

  const loadTemplates = useCallback(async function loadTemplates() {
    if (!currentOrgId) return;
    const { data } = await supabase
      .from('email_templates')
      .select('*')
      .eq('organization_id', currentOrgId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    
    if (data) {
      setTemplates(data as unknown as EmailTemplate[]);
    }
  }, [currentOrgId, supabase]);

  const categories = ['All', ...new Set(templates.map((t) => t.category).filter(Boolean))];

  const filtered = selectedCategory === 'All'
    ? templates
    : templates.filter((t) => t.category === selectedCategory);

  async function handleCopy(body: string) {
    await navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleOpenCreate() {
    setEditFormData({ name: '', subject_template: '', body_template: '', category: 'General' });
    setIsEditing(true);
  }

  function handleOpenEdit(template: EmailTemplate) {
    setEditFormData(template);
    setIsEditing(true);
  }

  async function handleDelete(id: string) {
    // H-10: Soft-delete instead of permanent delete
    await supabase.from('email_templates').update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('organization_id', currentOrgId!);
    setPreviewTemplate(null);
    setDeletingId(null);
    loadTemplates();
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    // Auto-extract merge fields
    const mergeFieldsMatches = (editFormData.body_template || '').match(/{{([^}]+)}}/g);
    const autoMergeFields = mergeFieldsMatches ? Array.from(new Set(mergeFieldsMatches.map(m => m.replace(/[{}]/g, '')))) : [];

    const payload = {
      organization_id: currentOrgId!,
      name: editFormData.name,
      category: editFormData.category || 'General',
      subject_template: editFormData.subject_template || '',
      body_template: editFormData.body_template || '',
      event_type: editFormData.name, // Fallback for schema constraint
      merge_fields: autoMergeFields,
    };

    if (editFormData.id) {
      await supabase.from('email_templates').update(payload).eq('id', editFormData.id).eq('organization_id', currentOrgId!);
    } else {
      await supabase.from('email_templates').insert([payload]);
    }

    setLoading(false);
    setIsEditing(false);
    loadTemplates();
  }

  return (
    <TierGate feature="email_inbox">
      <PageHeader
        title="Email Templates"
        subtitle="Reusable email templates with merge fields for quick, personalized outreach."
        actionLabel="New Template"
        onAction={handleOpenCreate}
      />

      {/* Category filters — L-10: Use canonical Tabs */}
      {categories.length > 1 && (
        <Tabs
          tabs={categories.map((cat) => ({ key: cat, label: cat }))}
          activeTab={selectedCategory}
          onTabChange={setSelectedCategory}
          className="mb-6"
        />
      )}

      {templates.length === 0 && (
        <EmptyState
          message="No templates found"
          description="Create your first email template to speed up outreach."
        />
      )}

      {/* Template grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((template) => (
          <div
            key={template.id}
            className="group rounded-xl border border-border bg-background p-5 transition-colors hover:border-foreground/20 cursor-pointer flex flex-col"
            onClick={() => setPreviewTemplate(template)}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground">{template.name}</h3>
              <span className="inline-flex items-center rounded-full bg-bg-secondary px-2 py-0.5 text-[10px] font-medium text-text-muted">
                {template.category}
              </span>
            </div>
            <p className="text-xs text-text-secondary line-clamp-2 mb-3 flex-1">{template.subject_template}</p>
            <div className="flex flex-wrap gap-1">
              {(template.merge_fields || []).slice(0, 3).map((field) => (
                <Tag key={field} variant="mono">
                  {`{{${field}}}`}
                </Tag>
              ))}
              {(template.merge_fields || []).length > 3 && (
                <span className="text-[10px] text-text-muted">+{(template.merge_fields || []).length - 3} more</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Preview modal */}
      <ModalShell open={!!previewTemplate && !isEditing} onClose={() => setPreviewTemplate(null)} title={previewTemplate?.name ?? 'Template Preview'}>
        {previewTemplate && (
          <div className="space-y-4">
            <div>
              <FormLabel>Subject</FormLabel>
              <FormInput value={previewTemplate.subject_template} readOnly />
            </div>
            <div>
              <FormLabel>Body</FormLabel>
              <div className="rounded-lg border border-border bg-bg-secondary p-4 min-h-[200px]">
                <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                  {previewTemplate.body_template}
                </pre>
              </div>
            </div>
            <div>
              <FormLabel>Merge Fields</FormLabel>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {(previewTemplate.merge_fields || []).map((field) => (
                  <span
                    key={field}
                    className="inline-flex items-center rounded bg-bg-secondary px-2 py-1 text-xs font-mono text-text-secondary"
                  >
                    {`{{${field}}}`}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-border mt-4">
              <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-500/10" onClick={() => setDeletingId(previewTemplate.id)}>Delete</Button>
              <div className="flex gap-3">
                <Button variant="secondary" size="sm" onClick={() => { setPreviewTemplate(null); handleOpenEdit(previewTemplate); }}>
                  Edit
                </Button>
                <Button variant="secondary" size="sm" onClick={() => handleCopy(previewTemplate.body_template)}>
                  {copied ? 'Copied!' : 'Copy Body'}
                </Button>
                <Button size="sm" onClick={() => setPreviewTemplate(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </ModalShell>

      {/* Editor Modal */}
      <ModalShell open={isEditing} onClose={() => setIsEditing(false)} title={editFormData.id ? "Edit Template" : "New Template"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel>Name</FormLabel>
              <FormInput required value={editFormData.name || ''} onChange={e => setEditFormData({...editFormData, name: e.target.value})} />
            </div>
            <div>
              <FormLabel>Category</FormLabel>
              <FormInput required value={editFormData.category || ''} onChange={e => setEditFormData({...editFormData, category: e.target.value})} />
            </div>
          </div>
          <div>
            <FormLabel>Subject Template</FormLabel>
            <FormInput required value={editFormData.subject_template || ''} onChange={e => setEditFormData({...editFormData, subject_template: e.target.value})} />
          </div>
          <div>
            <FormLabel>Body Template (Use {'{{field}}'} for variables)</FormLabel>
            <FormTextarea
              required
              rows={10}
              value={editFormData.body_template || ''}
              onChange={e => setEditFormData({...editFormData, body_template: e.target.value})}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button type="submit" loading={loading}>Save Template</Button>
          </div>
        </form>
      </ModalShell>

      <ConfirmDialog
        open={!!deletingId}
        title="Delete Template"
        message="Are you sure you want to delete this email template? This action cannot be undone."
        variant="danger"
        confirmLabel="Delete"
        onConfirm={() => { if (deletingId) handleDelete(deletingId); }}
        onCancel={() => setDeletingId(null)}
      />
    </TierGate>
  );
}
