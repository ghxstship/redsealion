'use client';

import { useState, useEffect, type FormEvent } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { PORTFOLIO_CATEGORIES } from '@/components/admin/portfolio/PortfolioGrid';

export interface PortfolioItem {
  id: string;
  project_name: string;
  project_year: number | null;
  category: string;
  client_name: string | null;
  description: string | null;
  image_url: string | null;
  tags?: string[];
  project_id?: string | null;
  proposal_id?: string | null;
}

interface PortfolioFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  itemToEdit?: PortfolioItem | null;
}

export default function PortfolioFormModal({ open, onClose, onCreated, itemToEdit }: PortfolioFormModalProps) {
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [projectYear, setProjectYear] = useState(String(new Date().getFullYear()));
  const [imageUrl, setImageUrl] = useState('');
  const [tags, setTags] = useState('');
  const [projectId, setProjectId] = useState('');
  const [proposalId, setProposalId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && itemToEdit) {
      setProjectName(itemToEdit.project_name || '');
      setClientName(itemToEdit.client_name || '');
      setCategory(itemToEdit.category || '');
      setDescription(itemToEdit.description || '');
      setProjectYear(String(itemToEdit.project_year || new Date().getFullYear()));
      setImageUrl(itemToEdit.image_url || '');
      setTags(itemToEdit.tags?.join(', ') || '');
      setProjectId(itemToEdit.project_id || '');
      setProposalId(itemToEdit.proposal_id || '');
      setError(null);
    } else if (open) {
      resetForm();
    }
  }, [open, itemToEdit]);

  function resetForm() { 
    setProjectName(''); 
    setClientName(''); 
    setCategory(''); 
    setDescription(''); 
    setProjectYear(String(new Date().getFullYear())); 
    setImageUrl('');
    setTags('');
    setProjectId('');
    setProposalId('');
    setError(null); 
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      const url = itemToEdit ? `/api/portfolio/${itemToEdit.id}` : '/api/portfolio';
      const method = itemToEdit ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_name: projectName,
          client_name: clientName || undefined,
          category,
          description: description || undefined,
          project_year: parseInt(projectYear) || new Date().getFullYear(),
          image_url: imageUrl || undefined,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          project_id: projectId || undefined,
          proposal_id: proposalId || undefined,
        }),
      });
      
      if (!res.ok) { 
        const data = await res.json().catch(() => ({})); 
        throw new Error(data.error || `Failed to ${itemToEdit ? 'update' : 'add'} project`); 
      }
      
      resetForm(); 
      onCreated(); 
      onClose();
    } catch (err) { 
      setError(err instanceof Error ? err.message : 'An error occurred'); 
    } finally { 
      setSubmitting(false); 
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} title={itemToEdit ? "Edit Portfolio Project" : "Add Portfolio Project"}>
      {error && <Alert className="mb-4">{error}</Alert>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Project Name *</FormLabel>
            <FormInput type="text" required value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. Nike Air Max Launch" />
          </div>
          <div>
            <FormLabel>Client</FormLabel>
            <FormInput type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Nike" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Category *</FormLabel>
            <FormSelect required value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select...</option>
              {PORTFOLIO_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </FormSelect>
          </div>
          <div>
            <FormLabel>Year</FormLabel>
            <FormInput type="number" value={projectYear} onChange={(e) => setProjectYear(e.target.value)} min={2000} max={2100} />
          </div>
        </div>
        
        <div>
          <FormLabel>Cover Image URL</FormLabel>
          <FormInput type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
        </div>
        
        <div>
          <FormLabel>Tags (comma separated)</FormLabel>
          <FormInput type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. lighting, outdoor, VIP" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Linked Project ID</FormLabel>
            <FormInput type="text" value={projectId} onChange={(e) => setProjectId(e.target.value)} placeholder="Optional UUID" />
          </div>
          <div>
            <FormLabel>Linked Proposal ID</FormLabel>
            <FormInput type="text" value={proposalId} onChange={(e) => setProposalId(e.target.value)} placeholder="Optional UUID" />
          </div>
        </div>

        <div>
          <FormLabel>Description</FormLabel>
          <FormTextarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Brief project description..." />
        </div>
        
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>{submitting ? 'Saving...' : (itemToEdit ? 'Update Project' : 'Add Project')}</Button>
        </div>
      </form>
    </ModalShell>
  );
}
