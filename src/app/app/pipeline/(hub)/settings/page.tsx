'use client';

import { useEffect, useState, useCallback } from 'react';
import { TierGate } from '@/components/shared/TierGate';
import { RoleGate } from '@/components/shared/RoleGate';
import { resolveClientOrg } from '@/lib/auth/resolve-org-client';
import PageHeader from '@/components/shared/PageHeader';
import PipelineHubTabs from '../../PipelineHubTabs';
import Card from '@/components/ui/Card';
interface Pipeline {
  id: string;
  name: string;
  is_default: boolean;
  stages: string[];
}

const DEFAULT_STAGES = ['Lead', 'Qualified', 'Proposal Sent', 'Negotiation', 'Verbal Yes', 'Contract Signed'];

export default function PipelineSettingsPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load pipeline config from org settings
  useEffect(() => {
    async function loadPipelines() {
      try {
        const ctx = await resolveClientOrg();
        if (!ctx) return;
        setOrgId(ctx.organizationId);

        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        const { data: org } = await supabase
          .from('organizations')
          .select('settings')
          .eq('id', ctx.organizationId)
          .single();

        if (org?.settings) {
          const settings = org.settings as Record<string, unknown>;
          const saved = settings.pipelines as Pipeline[] | undefined;
          if (saved && saved.length > 0) {
            setPipelines(saved);
            setLoaded(true);
            return;
          }
        }

        // Default pipeline if none configured
        setPipelines([
          {
            id: crypto.randomUUID(),
            name: 'Default Pipeline',
            is_default: true,
            stages: [...DEFAULT_STAGES],
          },
        ]);
      } catch {
        // Fallback
        setPipelines([
          {
            id: crypto.randomUUID(),
            name: 'Default Pipeline',
            is_default: true,
            stages: [...DEFAULT_STAGES],
          },
        ]);
      } finally {
        setLoaded(true);
      }
    }
    loadPipelines();
  }, []);

  // Save pipeline config to org settings
  const savePipelines = useCallback(async (updatedPipelines: Pipeline[]) => {
    if (!orgId) return;
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      // Fetch current settings to merge
      const { data: org } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', orgId)
        .single();

      const currentSettings = (org?.settings ?? {}) as Record<string, unknown>;
      const newSettings = { ...currentSettings, pipelines: updatedPipelines };

      await supabase
        .from('organizations')
        .update({ settings: newSettings })
        .eq('id', orgId);
    } catch {
      // Silent fail — local state remains
    }
  }, [orgId]);

  function addPipeline() {
    const newPipeline: Pipeline = {
      id: crypto.randomUUID(),
      name: 'New Pipeline',
      is_default: false,
      stages: [...DEFAULT_STAGES],
    };
    const updated = [...pipelines, newPipeline];
    setPipelines(updated);
    setEditingId(newPipeline.id);
    savePipelines(updated);
  }

  function updatePipeline(id: string, updates: Partial<Pipeline>) {
    const updated = pipelines.map((p) => (p.id === id ? { ...p, ...updates } : p));
    setPipelines(updated);
  }

  function finishEditing() {
    setEditingId(null);
    savePipelines(pipelines);
  }

  function removePipeline(id: string) {
    const updated = pipelines.filter((p) => p.id !== id);
    setPipelines(updated);
    if (editingId === id) setEditingId(null);
    savePipelines(updated);
  }

  function addStage(pipelineId: string) {
    const pipeline = pipelines.find((p) => p.id === pipelineId);
    if (!pipeline) return;
    updatePipeline(pipelineId, { stages: [...pipeline.stages, 'New Stage'] });
  }

  function updateStage(pipelineId: string, index: number, value: string) {
    const pipeline = pipelines.find((p) => p.id === pipelineId);
    if (!pipeline) return;
    const stages = [...pipeline.stages];
    stages[index] = value;
    updatePipeline(pipelineId, { stages });
  }

  function removeStage(pipelineId: string, index: number) {
    const pipeline = pipelines.find((p) => p.id === pipelineId);
    if (!pipeline) return;
    const stages = pipeline.stages.filter((_, i) => i !== index);
    updatePipeline(pipelineId, { stages });
  }

  if (!loaded) {
    return (
      <RoleGate allowedRoles={['developer', 'owner', 'admin']}>
      <TierGate feature="multi_pipeline">
<PageHeader
        title="Pipeline Settings"
        subtitle="Loading..."
      />
      </TierGate>
      </RoleGate>
    );
  }

  return (
    <RoleGate allowedRoles={['developer', 'owner', 'admin']}>
    <TierGate feature="multi_pipeline">
<PageHeader
        title="Pipeline Settings"
        subtitle="Configure multiple sales pipelines with custom stages."
      >
        <button
          onClick={addPipeline}
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          Add Pipeline
        </button>
      </PageHeader>

      <PipelineHubTabs />

      <div className="space-y-4">
        {pipelines.map((pipeline) => (
          <div key={pipeline.id} className="rounded-xl border border-border bg-background px-5 py-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {editingId === pipeline.id ? (
                  <input
                    type="text"
                    value={pipeline.name}
                    onChange={(e) => updatePipeline(pipeline.id, { name: e.target.value })}
                    className="rounded-md border border-border bg-background px-2 py-1 text-sm font-semibold text-foreground"
                  />
                ) : (
                  <h3 className="text-sm font-semibold text-foreground">{pipeline.name}</h3>
                )}
                {pipeline.is_default && (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                    Default
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => editingId === pipeline.id ? finishEditing() : setEditingId(pipeline.id)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-bg-secondary transition-colors"
                >
                  {editingId === pipeline.id ? 'Done' : 'Edit'}
                </button>
                {!pipeline.is_default && (
                  <button
                    onClick={() => removePipeline(pipeline.id)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {pipeline.stages.map((stage, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 rounded-lg border border-border bg-bg-secondary px-3 py-1.5"
                >
                  {editingId === pipeline.id ? (
                    <>
                      <input
                        type="text"
                        value={stage}
                        onChange={(e) => updateStage(pipeline.id, index, e.target.value)}
                        className="w-28 rounded-md border border-border bg-background px-2 py-0.5 text-xs text-foreground"
                      />
                      <button
                        onClick={() => removeStage(pipeline.id, index)}
                        className="text-xs text-text-muted hover:text-red-600 ml-1"
                      >
                        x
                      </button>
                    </>
                  ) : (
                    <span className="text-xs font-medium text-text-secondary">{stage}</span>
                  )}
                  {index < pipeline.stages.length - 1 && !editingId && (
                    <span className="text-text-muted ml-1">&rarr;</span>
                  )}
                </div>
              ))}
              {editingId === pipeline.id && (
                <button
                  onClick={() => addStage(pipeline.id)}
                  className="rounded-lg border border-dashed border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:text-foreground hover:border-foreground transition-colors"
                >
                  + Add Stage
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </TierGate>
    </RoleGate>
  );
}
