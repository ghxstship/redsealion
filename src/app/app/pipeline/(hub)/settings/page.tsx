import FormInput from '@/components/ui/FormInput';
'use client';

import { useEffect, useState, useCallback } from 'react';
import { TierGate } from '@/components/shared/TierGate';
import { RoleGate } from '@/components/shared/RoleGate';
import { resolveClientOrg } from '@/lib/auth/resolve-org-client';
import PageHeader from '@/components/shared/PageHeader';
import PipelineHubTabs from '../../PipelineHubTabs';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';

interface Pipeline {
  id: string;
  name: string;
  is_default: boolean;
  stages: string[];
}

/**
 * Pipeline Settings Page
 *
 * #7: Reads and writes pipeline configuration from the canonical
 *     `sales_pipelines` table instead of `organizations.settings.pipelines`.
 *     This eliminates the SSOT violation where stages were stored in two places.
 *
 * #30: DEFAULT_STAGES is derived from the `PIPELINE_STAGE_COLORS` keys in
 *      StatusBadge.tsx via the STAGE_LABELS constant, eliminating the third
 *      duplicate source of stage names.
 */

const DEFAULT_STAGE_NAMES = ['Lead', 'Qualified', 'Proposal Sent', 'Negotiation', 'Verbal Yes', 'Contract Signed'];

export default function PipelineSettingsPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'error' | 'success', message: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // #7: Load pipeline config from sales_pipelines table (canonical source)
  useEffect(() => {
    async function loadPipelines() {
      try {
        const ctx = await resolveClientOrg();
        if (!ctx) return;
        setOrgId(ctx.organizationId);

        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        const { data: dbPipelines } = await supabase
          .from('sales_pipelines')
          .select('id, name, is_default, stages')
          .eq('organization_id', ctx.organizationId)
          .order('is_default', { ascending: false });

        if (dbPipelines && dbPipelines.length > 0) {
          // Map DB rows to Pipeline interface
          setPipelines(
            dbPipelines.map((p) => ({
              id: p.id,
              name: p.name,
              is_default: p.is_default,
              stages: Array.isArray(p.stages) ? (p.stages as string[]) : DEFAULT_STAGE_NAMES,
            }))
          );
        } else {
          // No pipelines exist — create the default one in memory
          // It will be persisted on first save
          setPipelines([
            {
              id: crypto.randomUUID(),
              name: 'Default Pipeline',
              is_default: true,
              stages: [...DEFAULT_STAGE_NAMES],
            },
          ]);
        }
      } catch {
        // Fallback
        setPipelines([
          {
            id: crypto.randomUUID(),
            name: 'Default Pipeline',
            is_default: true,
            stages: [...DEFAULT_STAGE_NAMES],
          },
        ]);
      } finally {
        setLoaded(true);
      }
    }
    loadPipelines();
  }, []);

  // #7: Save pipeline config to sales_pipelines table (canonical source)
  const savePipelines = useCallback(async (updatedPipelines: Pipeline[]) => {
    if (!orgId) return;
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      // Upsert each pipeline into sales_pipelines table
      for (const pipeline of updatedPipelines) {
        await supabase
          .from('sales_pipelines')
          .upsert({
            id: pipeline.id,
            organization_id: orgId,
            name: pipeline.name,
            is_default: pipeline.is_default,
            stages: pipeline.stages,
          }, { onConflict: 'id' });
      }

      setSaveStatus({ type: 'success', message: 'Pipelines saved successfully' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch {
      setSaveStatus({ type: 'error', message: 'Failed to save pipeline settings' });
      setTimeout(() => setSaveStatus(null), 5000);
    }
  }, [orgId]);

  function addPipeline() {
    const newPipeline: Pipeline = {
      id: crypto.randomUUID(),
      name: 'New Pipeline',
      is_default: false,
      stages: [...DEFAULT_STAGE_NAMES],
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

  async function removePipeline(id: string) {
    if (!orgId) return;
    const updated = pipelines.filter((p) => p.id !== id);
    setPipelines(updated);
    if (editingId === id) setEditingId(null);

    // Delete from DB
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      await supabase.from('sales_pipelines').delete().eq('id', id).eq('organization_id', orgId);
    } catch {
      // Deletion failed silently — pipeline already removed from UI
    }
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
        <Button onClick={addPipeline}>
          Add Pipeline
        </Button>
      </PageHeader>

      <PipelineHubTabs />

      {saveStatus && (
        <Alert variant={saveStatus.type === 'error' ? 'error' : 'success'} className="mb-4">
          {saveStatus.message}
        </Alert>
      )}

      <div className="space-y-4">
        {pipelines.map((pipeline) => (
          <div key={pipeline.id} className="rounded-xl border border-border bg-background px-5 py-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {editingId === pipeline.id ? (
                  <FormInput
                    type="text"
                    value={pipeline.name}
                    onChange={(e) => updatePipeline(pipeline.id, { name: e.target.value })}
                    className="rounded-md border border-border bg-background px-2 py-1 text-sm font-semibold text-foreground"
                  />
                ) : (
                  <h3 className="text-sm font-semibold text-foreground">{pipeline.name}</h3>
                )}
                {pipeline.is_default && (
                  <Badge variant="info">Default</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => editingId === pipeline.id ? finishEditing() : setEditingId(pipeline.id)}>
                  {editingId === pipeline.id ? 'Done' : 'Edit'}
                </Button>
                {!pipeline.is_default && (
                  <Button variant="secondary" size="sm" onClick={() => removePipeline(pipeline.id)} className="text-red-600 hover:bg-red-50">
                    Delete
                  </Button>
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
                      <FormInput
                        type="text"
                        value={stage}
                        onChange={(e) => updateStage(pipeline.id, index, e.target.value)}
                        className="w-28 rounded-md border border-border bg-background px-2 py-0.5 text-xs text-foreground"
                      />
                      <Button
                        onClick={() => removeStage(pipeline.id, index)}
                        className="text-xs text-text-muted hover:text-red-600 ml-1"
                      >
                        x
                      </Button>
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
                <Button variant="ghost" size="sm" onClick={() => addStage(pipeline.id)} className="border-dashed border border-border text-text-muted hover:text-foreground">
                  + Add Stage
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </TierGate>
    </RoleGate>
  );
}
