'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

type StepType = 'script' | 'voice' | 'image' | 'video' | 'image_to_video' | 'video_to_video' | 'avatar' | 'edit' | 'export';
type StepStatus = 'pending' | 'running' | 'complete' | 'failed';
type ExecMode = 'manual' | 'hybrid' | 'automatic';

interface PipelineStep {
  id: string; type: StepType; name: string; icon: string;
  prompt: string; status: StepStatus;
  referenceImageUrl: string; referenceVideoUrl: string; referenceAudioUrl: string;
  overlayText: string; qualityTier: string;
  output?: { filename: string; meta: string };
}

interface PipelineVar {
  name: string; label: string; defaultValue: string; type: 'text' | 'number' | 'select';
  options?: string[];
}

const toolPalette: { category: string; items: { type: StepType; name: string; icon: string; providers: string }[] }[] = [
  { category: 'CONTENT', items: [
    { type: 'script', name: 'Script Writer', icon: '📝', providers: 'Claude, GPT-4' },
    { type: 'voice', name: 'Voice Generator', icon: '🎙️', providers: 'ElevenLabs, OpenAI TTS' },
    { type: 'image', name: 'Image Generator', icon: '🖼️', providers: 'DALL-E 3, GPT Image' },
    { type: 'video', name: 'Video Generator', icon: '🎬', providers: 'Sora 2, Veo 3' },
  ]},
  { category: 'TRANSFORM', items: [
    { type: 'image_to_video', name: 'Image→Video', icon: '🎞️', providers: 'Kling 2.5 Turbo Pro' },
    { type: 'video_to_video', name: 'Video→Video', icon: '🔄', providers: 'Kling O1' },
    { type: 'avatar', name: 'Talking Avatar', icon: '🧑', providers: 'Kling Avatar v2' },
  ]},
  { category: 'POST-PROD', items: [
    { type: 'edit', name: 'Video Overlay', icon: '✂️', providers: 'Shotstack' },
    { type: 'export', name: 'Export', icon: '📤', providers: 'Library, Download' },
  ]},
];

const iconForType: Record<string, string> = {
  script: '📝', voice: '🎙️', image: '🖼️', video: '🎬',
  image_to_video: '🎞️', video_to_video: '🔄', avatar: '🧑', edit: '✂️', export: '📤',
};

let stepCounter = 0;

export default function PipelineBuilderPage() {
  const params = useParams();
  const pipelineId = params?.id as string;
  const isNewPipeline = pipelineId === 'new';

  const [name, setName] = useState('Untitled Pipeline');
  const [mode, setMode] = useState<ExecMode>('manual');
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isNewPipeline);
  const [saving, setSaving] = useState(false);

  const [variables, setVariables] = useState<PipelineVar[]>([]);
  const [varValues, setVarValues] = useState<Record<string, string>>({});

  const selectedStep = steps.find(s => s.id === selectedStepId);

  // Load existing pipeline from DB
  useEffect(() => {
    if (isNewPipeline) return;
    (async () => {
      try {
        const res = await fetch(`/api/pipelines/${pipelineId}`);
        if (!res.ok) { setLoading(false); return; }
        const data = await res.json();
        setName(data.name || 'Untitled Pipeline');
        setMode(data.execution_mode || 'manual');
        setVariables(data.variables || []);
        if (data.steps?.length) {
          setSteps(data.steps.map((s: Record<string, unknown>, idx: number) => ({
            id: `step-${++stepCounter}`,
            type: s.step_type as StepType,
            name: s.name || String(s.step_type),
            icon: iconForType[s.step_type as string] || '⬡',
            prompt: (s.prompt_template as string) || '',
            status: 'pending' as StepStatus,
            referenceImageUrl: ((s.config as Record<string, unknown>)?.reference_image_url as string) || '',
            referenceVideoUrl: ((s.config as Record<string, unknown>)?.reference_video_url as string) || '',
            referenceAudioUrl: ((s.config as Record<string, unknown>)?.reference_audio_url as string) || '',
            overlayText: ((s.config as Record<string, unknown>)?.overlay_text as string) || '',
            qualityTier: (s.provider_tier as string) || 'standard',
          })));
        }
      } catch { /* pipeline not found, start fresh */ }
      setLoading(false);
    })();
  }, [pipelineId, isNewPipeline]);

  const addStep = useCallback((type: StepType, toolName: string, icon: string) => {
    const newStep: PipelineStep = {
      id: `step-${++stepCounter}`, type, name: toolName, icon,
      prompt: '', status: 'pending',
      referenceImageUrl: '', referenceVideoUrl: '', referenceAudioUrl: '',
      overlayText: '', qualityTier: 'standard',
    };
    setSteps(prev => [...prev, newStep]);
    setSelectedStepId(newStep.id);
  }, []);

  const removeStep = useCallback((id: string) => {
    setSteps(prev => prev.filter(s => s.id !== id));
    if (selectedStepId === id) setSelectedStepId(null);
  }, [selectedStepId]);

  const updateStep = useCallback((id: string, field: keyof PipelineStep, value: string) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }, []);

  const addVariable = useCallback(() => {
    const n = `var_${variables.length + 1}`;
    setVariables(prev => [...prev, { name: n, label: `Variable ${prev.length + 1}`, defaultValue: '', type: 'text' }]);
  }, [variables.length]);

  const updateVariable = useCallback((idx: number, field: keyof PipelineVar, value: string) => {
    setVariables(prev => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v));
  }, []);

  const removeVariable = useCallback((idx: number) => {
    setVariables(prev => prev.filter((_, i) => i !== idx));
  }, []);

  // Save pipeline to DB
  const savePipeline = useCallback(async () => {
    setSaving(true);
    setRunError(null);
    const payload = {
      name,
      execution_mode: mode,
      variables,
      steps: steps.map(s => ({
        step_type: s.type,
        name: s.name,
        provider_tier: s.qualityTier,
        prompt_template: s.prompt,
        require_approval_even_in_auto: false,
        config: {
          reference_image_url: s.referenceImageUrl || undefined,
          reference_video_url: s.referenceVideoUrl || undefined,
          reference_audio_url: s.referenceAudioUrl || undefined,
          overlay_text: s.overlayText || undefined,
        },
      })),
    };
    try {
      const url = isNewPipeline ? '/api/pipelines' : `/api/pipelines/${pipelineId}`;
      const method = isNewPipeline ? 'POST' : 'PUT';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Save failed'); }
    } catch (e) {
      setRunError((e as Error).message);
    }
    setSaving(false);
  }, [name, mode, variables, steps, pipelineId, isNewPipeline]);

  // Run pipeline via real API
  const runPipeline = useCallback(async () => {
    if (steps.length === 0) return;
    setRunning(true);
    setRunError(null);

    // Reset all steps to pending
    setSteps(prev => prev.map(s => ({ ...s, status: 'pending' as StepStatus, output: undefined })));

    try {
      // Save first if needed
      if (isNewPipeline) {
        setRunError('Please save the pipeline before running');
        setRunning(false);
        return;
      }

      const res = await fetch(`/api/pipelines/${pipelineId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variable_values: varValues }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `Execution failed: ${res.status}`);
      }

      const result = await res.json();

      // Mark all steps complete based on API response
      setSteps(prev => prev.map((s, idx) => ({
        ...s,
        status: idx < (result.steps_completed || 0) ? 'complete' as StepStatus : 'failed' as StepStatus,
      })));
    } catch (e) {
      setRunError((e as Error).message);
      // Mark remaining steps as failed
      setSteps(prev => prev.map(s => s.status === 'pending' ? { ...s, status: 'failed' as StepStatus } : s));
    }
    setRunning(false);
  }, [steps.length, pipelineId, isNewPipeline, varValues]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading pipeline...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', height: 'calc(100vh - 64px)', margin: '-32px -40px', overflow: 'hidden' }}>
      {/* Left: Tool Palette */}
      <div style={{ width: 220, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)', overflowY: 'auto', padding: '16px 10px', flexShrink: 0 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 14, padding: '0 6px' }}>Add Steps</div>
        {toolPalette.map(cat => (
          <div key={cat.category} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: '0.55rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 6px', marginBottom: 4 }}>{cat.category}</div>
            {cat.items.map((item, i) => (
              <button key={`${cat.category}-${i}`} onClick={() => addStep(item.type, item.name, item.icon)} style={{
                width: '100%', padding: '7px 8px', borderRadius: 7, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 7,
                background: 'var(--bg-tertiary)', border: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left',
              }}>
                <span style={{ fontSize: '0.85rem' }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 500 }}>{item.name}</div>
                  <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>{item.providers}</div>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Center: Canvas */}
      <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <input value={name} onChange={e => setName(e.target.value)} style={{ fontSize: '1.15rem', fontWeight: 700, background: 'transparent', border: 'none', padding: 0, color: 'var(--text-primary)', outline: 'none', width: 300 }} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 7, padding: 2 }}>
              {(['manual', 'hybrid', 'automatic'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)} style={{
                  padding: '4px 10px', borderRadius: 5, fontSize: '0.65rem', fontWeight: 500,
                  background: mode === m ? 'var(--accent)' : 'transparent',
                  color: mode === m ? 'white' : 'var(--text-secondary)', textTransform: 'capitalize', cursor: 'pointer', border: 'none',
                }}>{m}</button>
              ))}
            </div>
            <button onClick={savePipeline} disabled={saving} style={{
              padding: '6px 14px', borderRadius: 7, fontSize: '0.72rem', fontWeight: 600, border: 'none',
              background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: saving ? 'wait' : 'pointer',
            }}>{saving ? 'Saving...' : '💾 Save'}</button>
            <button onClick={runPipeline} disabled={steps.length === 0 || running || isNewPipeline} style={{
              padding: '6px 14px', borderRadius: 7, fontSize: '0.72rem', fontWeight: 600, border: 'none',
              background: steps.length === 0 || running || isNewPipeline ? 'var(--bg-tertiary)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color: steps.length === 0 || running || isNewPipeline ? 'var(--text-muted)' : 'white',
              cursor: steps.length === 0 || running || isNewPipeline ? 'not-allowed' : 'pointer',
            }}>{running ? '⟳ Running...' : '▶ Run'}</button>
          </div>
        </div>

        {/* Error banner */}
        {runError && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>{runError}</span>
            <button onClick={() => setRunError(null)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        {/* Variable Inputs */}
        {variables.length > 0 && (
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>Pipeline Variables</span>
              <button onClick={addVariable} style={{ fontSize: '0.62rem', color: 'var(--accent)', background: 'transparent', cursor: 'pointer', border: 'none' }}>+ Add</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
              {variables.map((v, idx) => (
                <div key={`var-${idx}`} style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 3 }}>
                    <input value={v.label} onChange={e => updateVariable(idx, 'label', e.target.value)} style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-muted)', background: 'transparent', border: 'none', padding: 0, width: 80 }} />
                    <code style={{ fontSize: '0.5rem', color: '#a78bfa' }}>{`{{${v.name}}}`}</code>
                  </div>
                  {v.type === 'select' ? (
                    <select value={varValues[v.name] ?? v.defaultValue} onChange={e => setVarValues(prev => ({ ...prev, [v.name]: e.target.value }))} style={{ width: '100%', fontSize: '0.75rem' }}>
                      {v.options?.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input value={varValues[v.name] ?? v.defaultValue} onChange={e => setVarValues(prev => ({ ...prev, [v.name]: e.target.value }))} placeholder={`${v.label}...`} style={{ width: '100%', fontSize: '0.75rem' }} />
                  )}
                  <button onClick={() => removeVariable(idx)} style={{ position: 'absolute', top: -2, right: 0, background: 'transparent', color: 'var(--text-muted)', fontSize: '0.65rem', cursor: 'pointer', border: 'none' }}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}
        {variables.length === 0 && (
          <button onClick={addVariable} style={{ fontSize: '0.7rem', color: 'var(--accent)', background: 'transparent', border: '1px dashed var(--border)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', marginBottom: 16, display: 'block' }}>+ Add Pipeline Variables</button>
        )}

        {/* Steps */}
        {steps.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180, border: '2px dashed var(--border)', borderRadius: 12, color: 'var(--text-muted)', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: '1.5rem' }}>⬡</div>
            <div style={{ fontSize: '0.8rem' }}>Add steps from the left panel</div>
          </div>
        ) : (
          <div>
            {steps.map((step, idx) => (
              <div key={step.id}>
                <div onClick={() => setSelectedStepId(step.id)} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 10,
                  background: selectedStepId === step.id ? 'rgba(99,102,241,0.06)' : 'var(--bg-secondary)',
                  border: `1px solid ${selectedStepId === step.id ? 'var(--accent)' : 'var(--border)'}`,
                  cursor: 'pointer',
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', fontWeight: 700,
                    background: step.status === 'complete' ? '#10b981' : step.status === 'running' ? '#3b82f6' : step.status === 'failed' ? '#ef4444' : 'var(--bg-tertiary)',
                    color: step.status !== 'pending' ? 'white' : 'var(--text-muted)',
                  }}>
                    {step.status === 'complete' ? '✓' : step.status === 'running' ? '⟳' : step.status === 'failed' ? '✕' : idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: '0.85rem' }}>{step.icon}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{step.name}</span>
                      <span style={{
                        fontSize: '0.55rem', padding: '1px 6px', borderRadius: 4, fontWeight: 500,
                        background: step.status === 'complete' ? 'rgba(16,185,129,0.1)' : step.status === 'running' ? 'rgba(59,130,246,0.1)' : step.status === 'failed' ? 'rgba(239,68,68,0.1)' : 'var(--bg-tertiary)',
                        color: step.status === 'complete' ? '#10b981' : step.status === 'running' ? '#3b82f6' : step.status === 'failed' ? '#ef4444' : 'var(--text-muted)',
                      }}>{step.status}</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {step.prompt ? step.prompt.slice(0, 80) + (step.prompt.length > 80 ? '...' : '') : 'No prompt configured'}
                    </div>
                    {step.output && <div style={{ fontSize: '0.6rem', color: 'var(--success)', marginTop: 3 }}>✓ {step.output.filename} — {step.output.meta}</div>}
                  </div>
                  <button onClick={e => { e.stopPropagation(); removeStep(step.id); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', padding: '2px 6px' }}>✕</button>
                </div>
                {idx < steps.length - 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
                    <div style={{ width: 2, height: 16, background: step.status === 'complete' ? '#10b981' : 'var(--border)' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Step Config Panel */}
      {selectedStep && (
        <div style={{ width: 280, background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border)', overflowY: 'auto', padding: '16px 14px', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Configure Step</div>
            <button onClick={() => setSelectedStepId(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '8px 10px', background: 'var(--bg-tertiary)', borderRadius: 8 }}>
            <span style={{ fontSize: '1rem' }}>{selectedStep.icon}</span>
            <div><div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{selectedStep.name}</div><div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{selectedStep.type}</div></div>
          </div>

          {/* Prompt Template */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Prompt Template</label>
            <textarea value={selectedStep.prompt} onChange={e => updateStep(selectedStep.id, 'prompt', e.target.value)} rows={5}
              placeholder={'Write prompt here...\nUse {{topic}}, {{channel}} variables\nUse {{prev_output}} for previous step output'}
              style={{ width: '100%', fontSize: '0.75rem', fontFamily: "'JetBrains Mono',monospace" }} />
            {variables.length > 0 && (
              <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: 3 }}>
                Available: {variables.map(v => `{{${v.name}}}`).join(', ')}, {'{{prev_output}}'}
              </div>
            )}
          </div>

          {/* Reference inputs — wired to state */}
          {(selectedStep.type === 'image_to_video' || selectedStep.type === 'avatar') && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Reference Image URL</label>
              <input value={selectedStep.referenceImageUrl} onChange={e => updateStep(selectedStep.id, 'referenceImageUrl', e.target.value)}
                placeholder="https://... or {{prev_output}}" style={{ width: '100%', fontSize: '0.75rem' }} />
            </div>
          )}
          {selectedStep.type === 'avatar' && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Audio URL</label>
              <input value={selectedStep.referenceAudioUrl} onChange={e => updateStep(selectedStep.id, 'referenceAudioUrl', e.target.value)}
                placeholder="https://... or {{prev_output}}" style={{ width: '100%', fontSize: '0.75rem' }} />
            </div>
          )}
          {selectedStep.type === 'video_to_video' && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Reference Video URL</label>
              <input value={selectedStep.referenceVideoUrl} onChange={e => updateStep(selectedStep.id, 'referenceVideoUrl', e.target.value)}
                placeholder="https://... or {{prev_output}}" style={{ width: '100%', fontSize: '0.75rem' }} />
            </div>
          )}
          {selectedStep.type === 'edit' && (
            <>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Source Video URL</label>
                <input value={selectedStep.referenceVideoUrl} onChange={e => updateStep(selectedStep.id, 'referenceVideoUrl', e.target.value)}
                  placeholder="https://... or {{prev_output}}" style={{ width: '100%', fontSize: '0.75rem' }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Text Overlay</label>
                <input value={selectedStep.overlayText} onChange={e => updateStep(selectedStep.id, 'overlayText', e.target.value)}
                  placeholder="Brand name, CTA, etc." style={{ width: '100%', fontSize: '0.75rem' }} />
              </div>
            </>
          )}

          {/* Quality Tier */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Quality Tier</label>
            <select value={selectedStep.qualityTier} onChange={e => updateStep(selectedStep.id, 'qualityTier', e.target.value)} style={{ width: '100%', fontSize: '0.75rem' }}>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="ultra">Ultra</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
