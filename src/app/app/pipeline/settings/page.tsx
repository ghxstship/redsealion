'use client';

import { useState } from 'react';
import { TierGate } from '@/components/shared/TierGate';

interface Pipeline {
  id: string;
  name: string;
  is_default: boolean;
  stages: string[];
}

const DEFAULT_STAGES = ['Lead', 'Qualified', 'Proposal Sent', 'Negotiation', 'Verbal Yes', 'Contract Signed'];

const SAMPLE_PIPELINES: Pipeline[] = [
  {
    id: '1',
    name: 'Default Pipeline',
    is_default: true,
    stages: DEFAULT_STAGES,
  },
  {
    id: '2',
    name: 'Enterprise Sales',
    is_default: false,
    stages: ['Discovery', 'Solution Design', 'Proposal', 'Legal Review', 'Procurement', 'Closed Won'],
  },
];

export default function PipelineSettingsPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>(SAMPLE_PIPELINES);
  const [editingId, setEditingId] = useState<string | null>(null);

  function addPipeline() {
    const newPipeline: Pipeline = {
      id: crypto.randomUUID(),
      name: 'New Pipeline',
      is_default: false,
      stages: [...DEFAULT_STAGES],
    };
    setPipelines((prev) => [...prev, newPipeline]);
    setEditingId(newPipeline.id);
  }

  function updatePipeline(id: string, updates: Partial<Pipeline>) {
    setPipelines((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  }

  function removePipeline(id: string) {
    setPipelines((prev) => prev.filter((p) => p.id !== id));
    if (editingId === id) setEditingId(null);
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

  return (
    <TierGate feature="multi_pipeline">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Pipeline Settings
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Configure multiple sales pipelines with custom stages.
          </p>
        </div>
        <button
          onClick={addPipeline}
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          Add Pipeline
        </button>
      </div>

      <div className="space-y-4">
        {pipelines.map((pipeline) => (
          <div key={pipeline.id} className="rounded-xl border border-border bg-white px-5 py-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {editingId === pipeline.id ? (
                  <input
                    type="text"
                    value={pipeline.name}
                    onChange={(e) => updatePipeline(pipeline.id, { name: e.target.value })}
                    className="rounded-md border border-border bg-white px-2 py-1 text-sm font-semibold text-foreground"
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
                  onClick={() => setEditingId(editingId === pipeline.id ? null : pipeline.id)}
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
                        className="w-28 rounded-md border border-border bg-white px-2 py-0.5 text-xs text-foreground"
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
  );
}
