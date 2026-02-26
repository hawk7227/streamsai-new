'use client';

import { useState } from 'react';
import StepFlowBar from '@/components/generate/StepFlowBar';
import PreviewRenderer from '@/components/generate/PreviewRenderers';
import type { GenerateStep } from '@/lib/types';

type ToolType = 'image' | 'video' | 'voice' | 'script' | 'image_to_video' | 'video_to_video' | 'avatar' | 'edit';
type QualityTier = 'standard' | 'premium' | 'ultra';
type BatchMode = 'single' | 'multi_provider' | 'bulk' | 'multi_both';

// Real costs from provider research (credits, 1 credit ≈ $0.01)
const COST_MAP: Record<ToolType, Record<QualityTier, { preview: number; final: number; previewLabel: string; finalLabel: string }>> = {
  image: {
    standard: { preview: 1, final: 2, previewLabel: 'GPT Image Mini (Low)', finalLabel: 'GPT Image Mini (Medium)' },
    premium:  { preview: 1, final: 17, previewLabel: 'GPT Image 1 (Low)', finalLabel: 'GPT Image 1 (High)' },
    ultra:    { preview: 2, final: 25, previewLabel: 'GPT Image 1.5 (Low)', finalLabel: 'GPT Image 1.5 (High)' },
  },
  video: {
    standard: { preview: 5, final: 15, previewLabel: 'Sora 2 (480p)', finalLabel: 'Sora 2 (720p)' },
    premium:  { preview: 5, final: 25, previewLabel: 'Sora 2 Pro (480p)', finalLabel: 'Sora 2 Pro (1080p)' },
    ultra:    { preview: 6, final: 16, previewLabel: 'Veo 3.1 Fast', finalLabel: 'Veo 3.1 Standard' },
  },
  voice: {
    standard: { preview: 1, final: 3, previewLabel: 'OpenAI TTS', finalLabel: 'OpenAI TTS HD' },
    premium:  { preview: 2, final: 5, previewLabel: 'ElevenLabs Turbo', finalLabel: 'ElevenLabs Turbo (Final)' },
    ultra:    { preview: 3, final: 8, previewLabel: 'ElevenLabs Multi v2', finalLabel: 'ElevenLabs Multi v2 (Final)' },
  },
  script: {
    standard: { preview: 1, final: 1, previewLabel: 'Claude Haiku', finalLabel: 'Claude Haiku' },
    premium:  { preview: 1, final: 2, previewLabel: 'Claude Sonnet', finalLabel: 'Claude Sonnet' },
    ultra:    { preview: 2, final: 5, previewLabel: 'Claude Opus', finalLabel: 'Claude Opus' },
  },
  image_to_video: {
    standard: { preview: 5, final: 10, previewLabel: 'Kling Turbo (720p)', finalLabel: 'Kling Turbo (1080p)' },
    premium:  { preview: 8, final: 18, previewLabel: 'Kling 2.5 Pro (720p)', finalLabel: 'Kling 2.5 Pro (1080p)' },
    ultra:    { preview: 10, final: 25, previewLabel: 'Luma Ray 2 (720p)', finalLabel: 'Luma Ray 2 (4K)' },
  },
  video_to_video: {
    standard: { preview: 8, final: 15, previewLabel: 'Kling O1 Fast', finalLabel: 'Kling O1 Standard' },
    premium:  { preview: 10, final: 22, previewLabel: 'Kling O1 Pro', finalLabel: 'Kling O1 Pro (HD)' },
    ultra:    { preview: 12, final: 30, previewLabel: 'Kling O1 Max', finalLabel: 'Kling O1 Max (4K)' },
  },
  avatar: {
    standard: { preview: 6, final: 12, previewLabel: 'Kling Avatar Std', finalLabel: 'Kling Avatar Std (HD)' },
    premium:  { preview: 10, final: 20, previewLabel: 'Kling Avatar Pro', finalLabel: 'Kling Avatar Pro (1080p)' },
    ultra:    { preview: 12, final: 28, previewLabel: 'Kling Avatar Pro+', finalLabel: 'Kling Avatar Pro (48fps)' },
  },
  edit: {
    standard: { preview: 2, final: 5, previewLabel: 'Shotstack Preview', finalLabel: 'Shotstack HD' },
    premium:  { preview: 3, final: 8, previewLabel: 'Creatomate Draft', finalLabel: 'Creatomate HD' },
    ultra:    { preview: 5, final: 12, previewLabel: 'Shotstack Pro', finalLabel: 'Shotstack 4K' },
  },
};

interface GenerationResult {
  id: string;
  quality_tier: QualityTier;
  status: string;
  prompt: string;
  preview_url: string | null;
  final_url: string | null;
  preview_cost_credits: number;
  final_cost_credits: number;
  provider_key?: string;
}

const tools: { type: ToolType; icon: string; label: string; color: string }[] = [
  { type: 'script', icon: '📝', label: 'Script', color: '#6366f1' },
  { type: 'voice', icon: '🎙️', label: 'Voice', color: '#10b981' },
  { type: 'image', icon: '🖼️', label: 'Image', color: '#f59e0b' },
  { type: 'video', icon: '🎬', label: 'Video', color: '#ef4444' },
  { type: 'image_to_video', icon: '🎞️', label: 'Img→Vid', color: '#ec4899' },
  { type: 'video_to_video', icon: '🔄', label: 'Vid→Vid', color: '#8b5cf6' },
  { type: 'avatar', icon: '🧑', label: 'Avatar', color: '#06b6d4' },
  { type: 'edit', icon: '✂️', label: 'Edit', color: '#f97316' },
];

const qualityTiers: { tier: QualityTier; label: string; desc: string; color: string }[] = [
  { tier: 'standard', label: 'Standard', desc: 'Fast & affordable', color: '#6b6b7b' },
  { tier: 'premium', label: 'Premium', desc: 'Higher quality', color: '#6366f1' },
  { tier: 'ultra', label: 'Ultra', desc: 'Best quality', color: '#f59e0b' },
];

export default function GeneratePage() {
  const [selectedTool, setSelectedTool] = useState<ToolType>('image');
  const [generateStep, setGenerateStep] = useState<GenerateStep>('configure');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedQuality, setSelectedQuality] = useState<QualityTier[]>(['standard']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [finalizingId, setFinalizingId] = useState<string | null>(null);

  // Bulk mode
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkPrompts, setBulkPrompts] = useState<string[]>(['']);

  // Tool-specific settings
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [duration, setDuration] = useState(5);
  const [voiceId, setVoiceId] = useState('alloy');

  const toggleQuality = (tier: QualityTier) => {
    setSelectedQuality((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier],
    );
  };

  // Determine batch mode
  const promptCount = bulkMode ? bulkPrompts.filter((p) => p.trim()).length : 1;
  const tierCount = selectedQuality.length;
  const totalJobs = promptCount * tierCount;
  const batchMode: BatchMode =
    promptCount > 1 && tierCount > 1 ? 'multi_both' :
    promptCount > 1 ? 'bulk' :
    tierCount > 1 ? 'multi_provider' : 'single';

  // Calculate costs
  const previewCostPerPrompt = selectedQuality.reduce((sum, tier) => sum + COST_MAP[selectedTool][tier].preview, 0);
  const finalCostPerPrompt = selectedQuality.reduce((sum, tier) => sum + COST_MAP[selectedTool][tier].final, 0);
  const totalPreviewCost = previewCostPerPrompt * promptCount;
  const totalFinalCost = finalCostPerPrompt * promptCount;
  const savings = totalFinalCost > 0 ? Math.round((1 - totalPreviewCost / totalFinalCost) * 100) : 0;

  // Bulk prompt management
  const addBulkPrompt = () => setBulkPrompts((prev) => [...prev, '']);
  const removeBulkPrompt = (idx: number) => setBulkPrompts((prev) => prev.filter((_, i) => i !== idx));
  const updateBulkPrompt = (idx: number, val: string) => setBulkPrompts((prev) => prev.map((p, i) => i === idx ? val : p));

  const handleGenerate = async () => {
    const activePrompts = bulkMode ? bulkPrompts.filter((p) => p.trim()) : [prompt.trim()];
    if (activePrompts.length === 0 || selectedQuality.length === 0) return;
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const body: Record<string, unknown> = {
        type: selectedTool,
        prompt: activePrompts[0],
        quality_tiers: selectedQuality,
        batch_mode: batchMode,
        negative_prompt: negativePrompt.trim() || undefined,
        aspect_ratio: ['image', 'video'].includes(selectedTool) ? aspectRatio : undefined,
        duration: ['video', 'voice'].includes(selectedTool) ? duration : undefined,
        voice_id: selectedTool === 'voice' ? voiceId : undefined,
      };
      if (activePrompts.length > 1) body.prompts = activePrompts;

      const res = await fetch('/api/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || 'Generation failed');
      setResults(data.generations || []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async (generationId: string) => {
    setFinalizingId(generationId);
    try {
      const res = await fetch(`/api/generations/${generationId}/finalize`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Finalize failed');
      setResults((prev) => prev.map((r) => r.id === generationId ? { ...r, status: 'queued_final' } : r));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setFinalizingId(null);
    }
  };

  const handleFinalizeAll = async () => {
    const previewReady = results.filter((r) => r.status === 'preview_ready');
    for (const r of previewReady) await handleFinalize(r.id);
  };

  const statusColors: Record<string, string> = {
    queued: '#6b6b7b', running_preview: '#3b82f6', preview_ready: '#f59e0b',
    queued_final: '#8b5cf6', running_final: '#6366f1', final_ready: '#10b981',
    failed: '#ef4444', cancelled: '#6b6b7b',
  };

  // Group results by prompt for multi_both/bulk display
  const groupedResults: Record<string, GenerationResult[]> = {};
  for (const r of results) {
    const key = r.prompt || 'default';
    if (!groupedResults[key]) groupedResults[key] = [];
    groupedResults[key].push(r);
  }
  const promptGroups = Object.entries(groupedResults);
  const hasMultipleGroups = promptGroups.length > 1;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 4 }}>Generate</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Create content with AI — previews are cheap, only pay full price for keepers
        </p>
      </div>

      {/* 4-Step Flow Bar */}
      <StepFlowBar current={generateStep} onStepClick={setGenerateStep} />

      {/* Tool Selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 28 }}>
        {tools.map((t) => (
          <button key={t.type} onClick={() => setSelectedTool(t.type)} style={{
            padding: '16px 12px', borderRadius: 10, textAlign: 'center', cursor: 'pointer',
            background: selectedTool === t.type ? `${t.color}12` : 'var(--bg-secondary)',
            border: `1px solid ${selectedTool === t.type ? t.color : 'var(--border)'}`,
            transition: 'all 0.15s',
          }}>
            <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>{t.icon}</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: selectedTool === t.type ? t.color : 'var(--text-primary)' }}>{t.label}</div>
          </button>
        ))}
      </div>

      {/* Single / Bulk Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-secondary)', borderRadius: 8, padding: 3 }}>
          <button onClick={() => setBulkMode(false)} style={{
            padding: '6px 16px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 500,
            background: !bulkMode ? 'var(--accent)' : 'transparent',
            color: !bulkMode ? 'white' : 'var(--text-secondary)', cursor: 'pointer',
          }}>Single Prompt</button>
          <button onClick={() => setBulkMode(true)} style={{
            padding: '6px 16px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 500,
            background: bulkMode ? 'var(--accent)' : 'transparent',
            color: bulkMode ? 'white' : 'var(--text-secondary)', cursor: 'pointer',
          }}>Bulk Prompts</button>
        </div>
        {bulkMode && (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {promptCount} prompt{promptCount !== 1 ? 's' : ''} × {tierCount} tier{tierCount !== 1 ? 's' : ''} = <strong>{totalJobs} preview{totalJobs !== 1 ? 's' : ''}</strong>
          </span>
        )}
      </div>

      {/* Prompt Input(s) */}
      {!bulkMode ? (
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Prompt</label>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={`Describe the ${selectedTool} you want to create...`} rows={4} style={{ width: '100%', fontSize: '0.9rem', resize: 'vertical' }} />
        </div>
      ) : (
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
            Bulk Prompts — each generates across all selected tiers
          </label>
          {bulkPrompts.map((bp, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', minWidth: 20, marginTop: 10, textAlign: 'right' }}>{idx + 1}.</span>
              <textarea
                value={bp}
                onChange={(e) => updateBulkPrompt(idx, e.target.value)}
                placeholder={`Prompt ${idx + 1}...`}
                rows={2}
                style={{ flex: 1, fontSize: '0.85rem', resize: 'vertical' }}
              />
              {bulkPrompts.length > 1 && (
                <button onClick={() => removeBulkPrompt(idx)} style={{
                  padding: '4px 8px', borderRadius: 6, fontSize: '0.7rem', marginTop: 4,
                  background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', border: 'none',
                }}>✕</button>
              )}
            </div>
          ))}
          <button onClick={addBulkPrompt} style={{
            padding: '6px 14px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 500,
            background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer',
          }}>+ Add Prompt</button>
        </div>
      )}

      {(selectedTool === 'image' || selectedTool === 'video') && (
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Negative Prompt <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
          <input value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} placeholder="Things to avoid..." style={{ width: '100%' }} />
        </div>
      )}

      {/* Tool-Specific Settings */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {(selectedTool === 'image' || selectedTool === 'video') && (
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Aspect Ratio</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {['16:9', '1:1', '9:16'].map((ar) => (
                <button key={ar} onClick={() => setAspectRatio(ar)} style={{
                  padding: '6px 14px', borderRadius: 6, fontSize: '0.75rem',
                  background: aspectRatio === ar ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: aspectRatio === ar ? 'white' : 'var(--text-secondary)', cursor: 'pointer',
                }}>{ar}</button>
              ))}
            </div>
          </div>
        )}
        {selectedTool === 'video' && (
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Duration: {duration}s</label>
            <input type="range" min={2} max={20} value={duration} onChange={(e) => setDuration(Number(e.target.value))} style={{ width: 140 }} />
          </div>
        )}
        {selectedTool === 'voice' && (
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Voice</label>
            <select value={voiceId} onChange={(e) => setVoiceId(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, fontSize: '0.8rem' }}>
              {['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'].map((v) => (
                <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Quality Tiers with Preview/Final Pricing */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Quality Tiers</label>
          <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 4, background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
            Mode: {batchMode.replace(/_/g, ' ')}
          </span>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 12 }}>
          {tierCount > 1
            ? 'Compare across tiers — same prompt rendered by different providers simultaneously'
            : 'Select tiers to compare — you only pay preview cost now, upgrade the ones you like'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {qualityTiers.map((q) => {
            const costs = COST_MAP[selectedTool][q.tier];
            const selected = selectedQuality.includes(q.tier);
            return (
              <button key={q.tier} onClick={() => toggleQuality(q.tier)} style={{
                padding: '14px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                background: selected ? `${q.color}10` : 'var(--bg-secondary)',
                border: `1px solid ${selected ? q.color : 'var(--border)'}`,
                transition: 'all 0.15s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: selected ? q.color : 'var(--text-primary)' }}>{q.label}</span>
                  <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${selected ? q.color : 'var(--text-muted)'}`, background: selected ? q.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'white' }}>
                    {selected ? '✓' : ''}
                  </div>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 6 }}>{q.desc}</div>
                <div style={{ display: 'flex', gap: 12, fontSize: '0.7rem' }}>
                  <div>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>Preview: {costs.preview}cr</span>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>{costs.previewLabel}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Final: {costs.final}cr</span>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>{costs.finalLabel}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cost Summary + Generate Button */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                Preview Cost: <span style={{ color: '#10b981' }}>{totalPreviewCost} credits</span>
                {totalJobs > 1 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}> ({totalJobs} jobs)</span>}
              </span>
              {savings > 0 && selectedQuality.length > 0 && (
                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: 600 }}>
                  Save {savings}% vs full render
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Full render of all {totalJobs} would cost {totalFinalCost}cr — preview first, finalize keepers
            </div>
          </div>
          <button onClick={handleGenerate} disabled={
            (bulkMode ? bulkPrompts.filter((p) => p.trim()).length === 0 : !prompt.trim()) || selectedQuality.length === 0 || loading
          } style={{
            padding: '12px 32px', borderRadius: 10, fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap',
            background: loading ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: loading ? 'var(--text-muted)' : 'white',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: (bulkMode ? bulkPrompts.filter((p) => p.trim()).length === 0 : !prompt.trim()) || selectedQuality.length === 0 ? 0.5 : 1,
          }}>
            {loading ? `⟳ Generating ${totalJobs} preview${totalJobs > 1 ? 's' : ''}...` : `Generate ${totalJobs} Preview${totalJobs > 1 ? 's' : ''}`}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '0.8rem', marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              Results <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>({results.length} generations)</span>
            </h2>
            {results.filter((r) => r.status === 'preview_ready').length > 1 && (
              <button onClick={handleFinalizeAll} style={{
                padding: '8px 16px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', cursor: 'pointer',
              }}>
                ⬆ Finalize All Previews ({results.filter((r) => r.status === 'preview_ready').length})
              </button>
            )}
          </div>

          {/* Render grouped by prompt for bulk, flat for single */}
          {promptGroups.map(([promptText, groupResults]) => (
            <div key={promptText} style={{ marginBottom: hasMultipleGroups ? 24 : 0 }}>
              {hasMultipleGroups && (
                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 10, padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: 8, borderLeft: '3px solid var(--accent)' }}>
                  &ldquo;{promptText.length > 80 ? promptText.slice(0, 80) + '...' : promptText}&rdquo;
                  <span style={{ float: 'right', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                    {groupResults.length} tier{groupResults.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(groupResults.length, 3)}, 1fr)`, gap: 16 }}>
                {groupResults.map((result) => {
                  const costs = COST_MAP[selectedTool][result.quality_tier];
                  const isPreviewReady = result.status === 'preview_ready';
                  const isFinalReady = result.status === 'final_ready';
                  const isProcessing = ['queued', 'running_preview', 'queued_final', 'running_final'].includes(result.status);

                  return (
                    <div key={result.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                      {/* Preview area — tool-specific renderers */}
                      <div style={{ position: 'relative' }}>
                        {result.preview_url || result.status === 'preview_ready' || result.status === 'final_ready' ? (
                          <PreviewRenderer
                            type={selectedTool}
                            previewUrl={result.preview_url}
                            finalUrl={result.final_url}
                            status={result.status}
                          />
                        ) : isProcessing ? (
                          <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)' }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', marginBottom: 8, animation: 'spin 1s linear infinite' }} />
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{result.status.replace(/_/g, ' ')}</div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)' }}>
                            <div style={{ fontSize: '2rem' }}>{tools.find((t) => t.type === selectedTool)?.icon}</div>
                          </div>
                        )}
                        <div style={{ position: 'absolute', top: 8, right: 8, fontSize: '0.6rem', fontWeight: 600, padding: '3px 8px', borderRadius: 4, background: `${statusColors[result.status] || '#6b6b7b'}20`, color: statusColors[result.status] || '#6b6b7b' }}>
                          {result.status.replace(/_/g, ' ')}
                        </div>
                      </div>

                      <div style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'capitalize' }}>{result.quality_tier}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{costs.previewLabel}</span>
                        </div>

                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 12, display: 'flex', gap: 12 }}>
                          <span>Preview: <span style={{ color: '#10b981' }}>{costs.preview}cr ✓</span></span>
                          <span>Final: <span style={{ color: 'var(--text-secondary)' }}>{costs.final}cr</span></span>
                        </div>

                        {isPreviewReady && (
                          <button onClick={() => handleFinalize(result.id)} disabled={finalizingId === result.id} style={{
                            width: '100%', padding: '10px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600,
                            background: finalizingId === result.id ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: finalizingId === result.id ? 'var(--text-muted)' : 'white',
                            cursor: finalizingId === result.id ? 'not-allowed' : 'pointer',
                          }}>
                            {finalizingId === result.id ? 'Finalizing...' : `⬆ Finalize for ${costs.final}cr`}
                          </button>
                        )}
                        {isFinalReady && (
                          <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(16,185,129,0.1)', borderRadius: 8, fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
                            ✓ Final Ready
                          </div>
                        )}
                        {result.status === 'failed' && (
                          <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(239,68,68,0.1)', borderRadius: 8, fontSize: '0.8rem', color: '#ef4444' }}>
                            Failed — credits refunded
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* How It Works */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginTop: 8 }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 16 }}>How Preview → Final Works</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { step: '1️⃣', title: 'Preview (Cheap)', desc: 'Fast/low-quality providers: 480p video, low-res images. 67-97% cheaper.' },
            { step: '2️⃣', title: 'Compare & Pick', desc: 'Compare across tiers and prompts. Only winners move forward.' },
            { step: '3️⃣', title: 'Finalize (Full)', desc: 'Re-render at max quality. HD images, 1080p video. Pay only for keepers.' },
            { step: '⚡', title: 'Bulk Mode', desc: 'Multiple prompts × multiple tiers = all combos generated in parallel.' },
          ].map((item) => (
            <div key={item.title}>
              <div style={{ fontSize: '1.2rem', marginBottom: 6 }}>{item.step}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
