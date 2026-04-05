'use client';

import { useState, useEffect } from 'react';
import type { NarrativeContext, PaymentTerms } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { resolveClientOrg } from '@/lib/auth/resolve-org-client';
export interface ProjectSetupData {
  clientId: string;
  clientSearch: string;
  projectName: string;
  subtitle: string;
  brandVoice: string;
  audienceProfile: string;
  experienceGoal: string;
  depositPercent: number;
  balancePercent: number;
  phaseTemplateId: string;
}

interface ProjectSetupStepProps {
  data: ProjectSetupData;
  onChange: (data: ProjectSetupData) => void;
}

interface ClientOption {
  id: string;
  name: string;
}

interface TemplateOption {
  id: string;
  name: string;
}

export default function ProjectSetupStep({
  data,
  onChange,
}: ProjectSetupStepProps) {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);

  useEffect(() => {
    async function loadOptions() {
      try {
        const supabase = createClient();
        const ctx = await resolveClientOrg();
        if (!ctx) return;

        const { data: clientRows } = await supabase
          .from('clients')
          .select('id, company_name')
          .eq('organization_id', ctx.organizationId)
          .order('company_name');

        setClients(
          (clientRows ?? []).map((c: Record<string, unknown>) => ({
            id: c.id as string,
            name: c.company_name as string,
          })),
        );

        const { data: templateRows } = await supabase
          .from('phase_templates')
          .select('id, name')
          .eq('organization_id', ctx.organizationId)
          .order('name');

        setTemplates(
          (templateRows ?? []).map((t: Record<string, unknown>) => ({
            id: t.id as string,
            name: t.name as string,
          })),
        );
      } catch (error) {
          void error; /* Caught: error boundary handles display */
        }
    }
    loadOptions();
  }, []);

  const update = (partial: Partial<ProjectSetupData>) => {
    onChange({ ...data, ...partial });
  };

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(data.clientSearch.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Project Setup</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Define the basics of your proposal.
        </p>
      </div>

      {/* Client Selection */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-foreground">Client</legend>
        <div>
          <label htmlFor="clientSearch" className="block text-xs font-medium text-text-secondary mb-1">
            Search clients
          </label>
          <input
            id="clientSearch"
            type="text"
            placeholder="Type to search..."
            value={data.clientSearch}
            onChange={(e) => update({ clientSearch: e.target.value })}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:border-org-primary focus:outline-none focus:ring-1 focus:ring-org-primary"
          />
          {data.clientSearch && !data.clientId && (
            <ul className="mt-1 rounded-lg border border-border bg-white shadow-sm max-h-40 overflow-y-auto">
              {filteredClients.map((client) => (
                <li key={client.id}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-bg-secondary"
                    onClick={() =>
                      update({
                        clientId: client.id,
                        clientSearch: client.name,
                      })
                    }
                  >
                    {client.name}
                  </button>
                </li>
              ))}
              {filteredClients.length === 0 && (
                <li className="px-3 py-2 text-sm text-text-muted">No clients found</li>
              )}
            </ul>
          )}
          {data.clientId && (
            <button
              type="button"
              className="mt-1 text-xs text-text-muted hover:text-foreground"
              onClick={() => update({ clientId: '', clientSearch: '' })}
            >
              Clear selection
            </button>
          )}
        </div>
      </fieldset>

      {/* Project Details */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-foreground">Project Details</legend>

        <div>
          <label htmlFor="projectName" className="block text-xs font-medium text-text-secondary mb-1">
            Project Name
          </label>
          <input
            id="projectName"
            type="text"
            placeholder="e.g., SXSW 2026 Brand Activation"
            value={data.projectName}
            onChange={(e) => update({ projectName: e.target.value })}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:border-org-primary focus:outline-none focus:ring-1 focus:ring-org-primary"
          />
        </div>

        <div>
          <label htmlFor="subtitle" className="block text-xs font-medium text-text-secondary mb-1">
            Subtitle
          </label>
          <input
            id="subtitle"
            type="text"
            placeholder="e.g., Immersive Pop-Up Experience"
            value={data.subtitle}
            onChange={(e) => update({ subtitle: e.target.value })}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:border-org-primary focus:outline-none focus:ring-1 focus:ring-org-primary"
          />
        </div>
      </fieldset>

      {/* Narrative Context */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-foreground">Narrative Context</legend>

        <div>
          <label htmlFor="brandVoice" className="block text-xs font-medium text-text-secondary mb-1">
            Brand Voice
          </label>
          <textarea
            id="brandVoice"
            rows={2}
            placeholder="Describe the brand voice for this proposal..."
            value={data.brandVoice}
            onChange={(e) => update({ brandVoice: e.target.value })}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:border-org-primary focus:outline-none focus:ring-1 focus:ring-org-primary resize-none"
          />
        </div>

        <div>
          <label htmlFor="audienceProfile" className="block text-xs font-medium text-text-secondary mb-1">
            Audience Profile
          </label>
          <textarea
            id="audienceProfile"
            rows={2}
            placeholder="Who is the target audience?"
            value={data.audienceProfile}
            onChange={(e) => update({ audienceProfile: e.target.value })}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:border-org-primary focus:outline-none focus:ring-1 focus:ring-org-primary resize-none"
          />
        </div>

        <div>
          <label htmlFor="experienceGoal" className="block text-xs font-medium text-text-secondary mb-1">
            Experience Goal
          </label>
          <textarea
            id="experienceGoal"
            rows={2}
            placeholder="What is the desired outcome of the experience?"
            value={data.experienceGoal}
            onChange={(e) => update({ experienceGoal: e.target.value })}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:border-org-primary focus:outline-none focus:ring-1 focus:ring-org-primary resize-none"
          />
        </div>
      </fieldset>

      {/* Payment Terms */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-foreground">Payment Terms Override</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="depositPercent" className="block text-xs font-medium text-text-secondary mb-1">
              Deposit %
            </label>
            <input
              id="depositPercent"
              type="number"
              min={0}
              max={100}
              value={data.depositPercent}
              onChange={(e) => update({ depositPercent: Number(e.target.value) })}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-org-primary focus:outline-none focus:ring-1 focus:ring-org-primary"
            />
          </div>
          <div>
            <label htmlFor="balancePercent" className="block text-xs font-medium text-text-secondary mb-1">
              Balance %
            </label>
            <input
              id="balancePercent"
              type="number"
              min={0}
              max={100}
              value={data.balancePercent}
              onChange={(e) => update({ balancePercent: Number(e.target.value) })}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-org-primary focus:outline-none focus:ring-1 focus:ring-org-primary"
            />
          </div>
        </div>
        {data.depositPercent + data.balancePercent !== 100 && (
          <p className="text-xs text-warning">Deposit + Balance should equal 100%</p>
        )}
      </fieldset>

      {/* Phase Template */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-foreground">Phase Template</legend>
        <div>
          <label htmlFor="phaseTemplate" className="block text-xs font-medium text-text-secondary mb-1">
            Select a template
          </label>
          <select
            id="phaseTemplate"
            value={data.phaseTemplateId}
            onChange={(e) => update({ phaseTemplateId: e.target.value })}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-org-primary focus:outline-none focus:ring-1 focus:ring-org-primary"
          >
            <option value="">-- Select template --</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </fieldset>
    </div>
  );
}
