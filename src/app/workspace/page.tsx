'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// ═══════════════════════════════════════════════════════
// STREAMSAI V3 — COMPLETE WORKSPACE
// Ported from streamsai-v3-demo.html — all features intact
// ═══════════════════════════════════════════════════════

type Tool = 'script' | 'voice' | 'image' | 'video';
type Tier = 'standard' | 'premium' | 'ultra';
type Page = 'gen' | 'pipeline' | 'auto' | 'dash' | 'hist' | 'lib' | 'set';
type BatchMode = 'single' | 'bulk';
type GenStatus = 'queued' | 'running_preview' | 'preview_ready' | 'queued_final' | 'running_final' | 'final_ready' | 'failed';

interface GenResult {
  id: number;
  prompt: string;
  tier: Tier;
  status: GenStatus;
  idx: number;
}

// ═══ PRICING & CONFIG ═══
const PR: Record<Tool, Record<Tier, { pv: number; fn: number; pvL: string; fnL: string; c: string }>> = {
  image: {
    standard: { pv: 1, fn: 2, pvL: 'GPT Image Mini (Low)', fnL: 'GPT Image Mini (Med)', c: '#6b6b7b' },
    premium: { pv: 1, fn: 17, pvL: 'GPT Image 1 (Low)', fnL: 'GPT Image 1 (High)', c: '#6366f1' },
    ultra: { pv: 2, fn: 25, pvL: 'GPT Image 1.5 (Low)', fnL: 'GPT Image 1.5 (High)', c: '#f59e0b' },
  },
  video: {
    standard: { pv: 5, fn: 15, pvL: 'Sora 2 (480p)', fnL: 'Sora 2 (720p)', c: '#6b6b7b' },
    premium: { pv: 5, fn: 25, pvL: 'Sora 2 Pro (480p)', fnL: 'Sora 2 Pro (1080p)', c: '#6366f1' },
    ultra: { pv: 6, fn: 16, pvL: 'Veo 3.1 Fast', fnL: 'Veo 3.1 Std', c: '#f59e0b' },
  },
  voice: {
    standard: { pv: 1, fn: 3, pvL: 'OpenAI TTS', fnL: 'OpenAI TTS HD', c: '#6b6b7b' },
    premium: { pv: 2, fn: 5, pvL: 'ElevenLabs Turbo', fnL: 'ElevenLabs Final', c: '#6366f1' },
    ultra: { pv: 3, fn: 8, pvL: 'ElevenLabs v2', fnL: 'ElevenLabs v2 Final', c: '#f59e0b' },
  },
  script: {
    standard: { pv: 1, fn: 1, pvL: 'Claude Haiku', fnL: 'Claude Haiku', c: '#6b6b7b' },
    premium: { pv: 1, fn: 2, pvL: 'Claude Sonnet', fnL: 'Claude Sonnet', c: '#6366f1' },
    ultra: { pv: 2, fn: 5, pvL: 'Claude Opus', fnL: 'Claude Opus', c: '#f59e0b' },
  },
};

const TM: Record<Tier, { l: string; d: string }> = {
  standard: { l: 'Standard', d: 'Fast & affordable' },
  premium: { l: 'Premium', d: 'Higher quality' },
  ultra: { l: 'Ultra', d: 'Best quality' },
};

const TITLES: Record<Tool, [string, string]> = {
  script: ['📝 Script Generator', 'AI-powered copywriting — Claude Haiku / Sonnet / Opus'],
  voice: ['🎙️ Voice Generator', 'Text-to-speech — OpenAI TTS / ElevenLabs'],
  image: ['🖼️ Image Generator', 'AI image creation — GPT Image Mini / 1 / 1.5'],
  video: ['🎬 Video Generator', 'AI video — Sora 2 / Sora 2 Pro / Veo 3.1'],
};

const GRADIENTS = [
  'linear-gradient(135deg,#667eea,#764ba2)', 'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)', 'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)', 'linear-gradient(135deg,#a18cd1,#fbc2eb)',
  'linear-gradient(135deg,#fccb90,#d57eeb)', 'linear-gradient(135deg,#e0c3fc,#8ec5fc)',
];

const BULK_DEFAULTS: Record<Tool, string[]> = {
  script: ['Write a YouTube script about AI trends, casual tone, 10 min', 'Blog post: 5 ways to improve productivity', 'Product desc for wireless noise-cancelling headphones'],
  voice: ['Welcome to the StreamsAI podcast...', 'This product features advanced noise cancellation...', 'Chapter one: The sun rose over the quiet village...'],
  image: ['Minimalist perfume bottle on marble, soft pink', 'Luxury watch floating in space with star trails', 'Artisan coffee cup with latte art, morning sun'],
  video: ['Product demo: headphones unboxing, cinematic', 'Social media ad: coffee shop ambiance, 15s', 'Drone shot of coastal cliffs at sunset'],
};

const PIPE_STEPS = [
  { t: 'Step 1: Script Generation', p: 'Claude Sonnet (Premium)', tmpl: 'Write a YouTube script about {{topic}} for {{channel}}. Tone: {{tone}}. Length: {{duration}} min.', vars: ['topic', 'channel', 'tone', 'duration'] },
  { t: 'Step 2: Voiceover', p: 'ElevenLabs Turbo (Premium)', tmpl: 'Read the following script with {{tone}} energy:\n\n{{step_1.output}}', vars: ['tone', 'step_1.output'] },
  { t: 'Step 3: Thumbnail', p: 'GPT Image 1 (Premium)', tmpl: 'YouTube thumbnail for "{{topic}}" — bold text, bright colors', vars: ['topic'] },
  { t: 'Step 4: Video Assembly', p: 'Sora 2 Pro (Premium)', tmpl: 'Create B-roll montage matching script about {{topic}}. Style: cinematic', vars: ['topic'] },
];

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

export default function WorkspacePage() {
  // ─── State ───
  const [page, setPage] = useState<Page>('gen');
  const [tool, setTool] = useState<Tool>('script');
  const [tiers, setTiers] = useState<Tier[]>(['standard', 'premium', 'ultra']);
  const [mode, setMode] = useState<BatchMode>('bulk');
  const [bulkPrompts, setBulkPrompts] = useState<string[]>(BULK_DEFAULTS.script);
  const [singlePrompt, setSinglePrompt] = useState(BULK_DEFAULTS.script[0]);
  const [credits, setCredits] = useState(1500);
  const maxCredits = 2000;
  const [results, setResults] = useState<GenResult[]>([]);
  const [flowStep, setFlowStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [dbGate, setDbGate] = useState<'idle' | 'checking' | 'pass' | 'warn'>('idle');
  const [toast, setToast] = useState('');
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotMsgs, setCopilotMsgs] = useState<{ role: 'ai' | 'user'; text: string }[]>([
    { role: 'ai', text: "Hey! I can help you generate content, build pipelines, check usage, and optimize prompts. What do you need?" },
  ]);
  const [copilotInput, setCopilotInput] = useState('');
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [pipeStep, setPipeStep] = useState(0);
  const [pipeRunning, setPipeRunning] = useState(false);
  const [pipeNodes, setPipeNodes] = useState([
    { status: 'ready' }, { status: 'waiting' }, { status: 'waiting' }, { status: 'waiting' },
  ]);
  const [pipeOutput, setPipeOutput] = useState(false);
  const [negPrompt, setNegPrompt] = useState('blurry, low quality, watermark');
  const resultIdRef = useRef(0);

  // ─── Helpers ───
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }, []);

  const selectTool = useCallback((t: Tool) => {
    setTool(t);
    setBulkPrompts([...BULK_DEFAULTS[t]]);
    setSinglePrompt(BULK_DEFAULTS[t][0]);
    setResults([]);
    setFlowStep(1);
    setDbGate('idle');
    setPage('gen');
  }, []);

  const toggleTier = useCallback((t: Tier) => {
    setTiers(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }, []);

  // ─── Cost Calculations ───
  const promptCount = mode === 'bulk' ? bulkPrompts.length : 1;
  const tierCount = tiers.length;
  const totalJobs = promptCount * tierCount;
  let pvTotal = 0, fnTotal = 0;
  tiers.forEach(t => { pvTotal += PR[tool][t].pv; fnTotal += PR[tool][t].fn; });
  pvTotal *= promptCount; fnTotal *= promptCount;
  const savings = fnTotal > 0 ? Math.round((1 - pvTotal / fnTotal) * 100) : 0;
  const batchLabel = promptCount > 1 && tierCount > 1 ? 'multi both' : promptCount > 1 ? 'bulk' : tierCount > 1 ? 'multi provider' : 'single';

  // ─── Generate ───
  const doGenerate = useCallback(() => {
    const prompts = mode === 'bulk' ? bulkPrompts.filter(p => p.trim()) : [singlePrompt.trim() || 'Generate'];
    if (!prompts.length || !tiers.length) return;

    setDbGate('checking');
    setTimeout(() => {
      const hasWeak = prompts.some(p => p.length < 15);
      setDbGate(hasWeak ? 'warn' : 'pass');

      const newResults: GenResult[] = [];
      let id = resultIdRef.current;
      prompts.forEach(pr => {
        tiers.forEach(tier => {
          newResults.push({ id: id++, prompt: pr, tier, status: 'queued', idx: id });
        });
      });
      resultIdRef.current = id;
      setResults(newResults);
      setFlowStep(2);
      setGenerating(true);

      // Simulate generation
      let i = 0;
      const iv = setInterval(() => {
        if (i < newResults.length) {
          newResults[i].status = 'running_preview';
          if (i > 0) newResults[i - 1].status = newResults[i - 1].id % 9 === 8 ? 'failed' : 'preview_ready';
          setResults([...newResults]);
          i++;
        } else {
          clearInterval(iv);
          newResults.forEach(r => { if (r.status === 'running_preview') r.status = 'preview_ready'; });
          setResults([...newResults]);
          setFlowStep(3);
          setGenerating(false);
          let cost = 0;
          newResults.forEach(r => { cost += PR[tool][r.tier].pv; });
          setCredits(prev => prev - cost);
          showToast(`✓ ${newResults.filter(r => r.status === 'preview_ready').length} previews ready — ${cost}cr`);
        }
      }, 400);
    }, 800);
  }, [mode, bulkPrompts, singlePrompt, tiers, tool, showToast]);

  const finalizeOne = useCallback((id: number) => {
    setResults(prev => {
      const next = [...prev];
      const r = next.find(x => x.id === id);
      if (!r || r.status !== 'preview_ready') return prev;
      r.status = 'running_final';
      setFlowStep(4);
      setTimeout(() => {
        setResults(p => {
          const n = [...p];
          const item = n.find(x => x.id === id);
          if (item) item.status = 'final_ready';
          return n;
        });
        const cost = PR[tool][r.tier].fn;
        setCredits(prev => prev - cost);
        showToast(`✓ Finalized — ${cost}cr`);
      }, 1200);
      return next;
    });
  }, [tool, showToast]);

  const finalizeAll = useCallback(() => {
    const ready = results.filter(r => r.status === 'preview_ready');
    ready.forEach((r, i) => {
      setTimeout(() => finalizeOne(r.id), i * 500);
    });
  }, [results, finalizeOne]);

  // ─── Pipeline ───
  const runPipeline = useCallback(() => {
    if (pipeRunning) return;
    setPipeRunning(true);
    setPipeOutput(false);
    const nodes = [{ status: 'ready' }, { status: 'waiting' }, { status: 'waiting' }, { status: 'waiting' }];
    let i = 0;
    const iv = setInterval(() => {
      if (i < 4) {
        if (i > 0) nodes[i - 1].status = 'done';
        nodes[i].status = 'running';
        setPipeNodes([...nodes]);
        i++;
      } else {
        clearInterval(iv);
        nodes[3].status = 'done';
        setPipeNodes([...nodes]);
        setPipeOutput(true);
        setPipeRunning(false);
        setCredits(prev => prev - 49);
        showToast('✓ Pipeline complete — 49cr');
      }
    }, 1500);
  }, [pipeRunning, showToast]);

  // ─── Copilot ───
  const sendCopilot = useCallback(() => {
    if (!copilotInput.trim()) return;
    const msg = copilotInput;
    setCopilotMsgs(prev => [...prev, { role: 'user' as const, text: msg }]);
    setCopilotInput('');
    setTimeout(() => {
      setCopilotMsgs(prev => [...prev, {
        role: 'ai' as const,
        text: `Processing "${msg}"... I'll run Don't Build check first, then generate previews across your selected tiers. Check the Generate page for results.`,
      }]);
    }, 800);
  }, [copilotInput]);

  const showAR = tool === 'image' || tool === 'video';
  const showDur = tool === 'video';
  const showVoice = tool === 'voice';
  const showNeg = tool === 'image' || tool === 'video';

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#06060c', color: '#eaeaf2', fontFamily: "'Outfit', system-ui, sans-serif", overflow: 'hidden' }}>

      {/* ═══ LEFT SIDEBAR ═══ */}
      <div style={{ width: leftOpen ? 82 : 36, minWidth: leftOpen ? 82 : 36, background: '#0c0c16', borderRight: '1px solid rgba(255,255,255,.06)', display: 'flex', flexDirection: 'column', transition: 'width .25s, min-width .25s', flexShrink: 0 }}>
        <button onClick={() => setLeftOpen(!leftOpen)} style={{ width: '100%', padding: '6px 0', display: 'flex', justifyContent: 'center', cursor: 'pointer', color: '#3a3a50', fontSize: 11, border: 'none', background: 'transparent', fontFamily: 'inherit' }}>☰</button>
        {leftOpen && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 4px 10px', gap: 6 }}>
              <div style={{ width: 22, height: 22, borderRadius: 5, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'grid', placeItems: 'center', fontSize: 9, color: 'white', fontWeight: 900 }}>⚡</div>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '-.3px' }}>StreamsAI</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {([
                { id: 'dash' as Page, icon: '◫', label: 'Dashboard' },
                { id: 'gen' as Page, icon: '✦', label: 'Generate' },
                { id: 'pipeline' as Page, icon: '⬡', label: 'Pipelines' },
              ]).map(item => (
                <div key={item.id} onClick={() => setPage(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', fontSize: 11, color: page === item.id ? '#eaeaf2' : '#5c5c72', cursor: 'pointer', borderLeft: `2px solid ${page === item.id ? '#6366f1' : 'transparent'}`, background: page === item.id ? 'rgba(99,102,241,.05)' : 'transparent', fontWeight: 500, transition: '.12s' }}>
                  <span style={{ fontSize: 12, minWidth: 14, textAlign: 'center' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
              <div style={{ padding: '6px 10px', fontSize: 8, fontWeight: 600, color: '#3a3a50', textTransform: 'uppercase', letterSpacing: '.06em' }}>Content</div>
              {([
                { id: 'hist' as Page, icon: '↻', label: 'History' },
                { id: 'lib' as Page, icon: '▤', label: 'Library' },
              ]).map(item => (
                <div key={item.id} onClick={() => setPage(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', fontSize: 11, color: page === item.id ? '#eaeaf2' : '#5c5c72', cursor: 'pointer', borderLeft: `2px solid ${page === item.id ? '#6366f1' : 'transparent'}`, background: page === item.id ? 'rgba(99,102,241,.05)' : 'transparent', fontWeight: 500 }}>
                  <span style={{ fontSize: 12 }}>{item.icon}</span><span>{item.label}</span>
                </div>
              ))}
              <div style={{ padding: '6px 10px', fontSize: 8, fontWeight: 600, color: '#3a3a50', textTransform: 'uppercase', letterSpacing: '.06em' }}>Account</div>
              <div onClick={() => setPage('set')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', fontSize: 11, color: page === 'set' ? '#eaeaf2' : '#5c5c72', cursor: 'pointer', borderLeft: `2px solid ${page === 'set' ? '#6366f1' : 'transparent'}`, fontWeight: 500 }}>
                <span style={{ fontSize: 12 }}>⚙</span><span>Settings</span>
              </div>
            </div>
            <div style={{ margin: 4, padding: 6, background: '#12121e', borderRadius: 5, border: '1px solid rgba(255,255,255,.06)' }}>
              <div style={{ fontSize: 7, color: '#5c5c72', fontWeight: 600, textTransform: 'uppercase', textAlign: 'center', marginBottom: 2 }}>Credits</div>
              <div style={{ height: 2, background: '#222234', borderRadius: 2, overflow: 'hidden', marginBottom: 2 }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius: 2, width: `${Math.max(0, (credits / maxCredits) * 100)}%`, transition: 'width .8s' }} />
              </div>
              <div style={{ fontSize: 8, fontWeight: 600, display: 'flex', justifyContent: 'space-between', color: '#a0a0b8' }}>
                <span>{(maxCredits - credits).toLocaleString()}</span><span>{maxCredits.toLocaleString()}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ═══ RIGHT SIDEBAR (Tools) ═══ */}
      <div style={{ width: rightOpen ? 76 : 36, minWidth: rightOpen ? 76 : 36, background: '#0c0c16', borderRight: '1px solid rgba(255,255,255,.06)', display: 'flex', flexDirection: 'column', transition: 'width .25s, min-width .25s', flexShrink: 0, order: -1 }}>
        {/* Actually right sidebar should be AFTER main. Let me fix order */}
      </div>

      {/* ═══ MAIN AREA ═══ */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 30px 50px' }}>

        {/* ─── GENERATE PAGE ─── */}
        {page === 'gen' && (
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.4px', marginBottom: 2 }}>{TITLES[tool][0]}</div>
            <div style={{ fontSize: 12, color: '#a0a0b8', marginBottom: 20 }}>{TITLES[tool][1]}</div>

            {/* Flow Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 16, padding: '10px 14px', background: '#0c0c16', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12 }}>
              {['Configure', 'Preview', 'Compare', 'Finalize'].map((label, i) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
                  {i > 0 && <span style={{ margin: '0 6px', color: '#3a3a50', fontSize: 12 }}>→</span>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 500, color: i + 1 < flowStep ? '#10b981' : i + 1 === flowStep ? '#eaeaf2' : '#5c5c72' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${i + 1 < flowStep ? '#10b981' : i + 1 === flowStep ? '#6366f1' : '#3a3a50'}`, background: i + 1 < flowStep ? '#10b981' : i + 1 === flowStep ? '#6366f1' : 'transparent', display: 'grid', placeItems: 'center', fontSize: 8.5, fontWeight: 700, color: i + 1 <= flowStep ? '#fff' : '#5c5c72', boxShadow: i + 1 === flowStep ? '0 0 8px rgba(99,102,241,.3)' : 'none' }}>
                      {i + 1 < flowStep ? '✓' : i + 1}
                    </div>
                    <span>{label}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Don't Build Gate */}
            {dbGate === 'checking' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, marginBottom: 12, background: '#12121e', border: '1px solid rgba(255,255,255,.06)', color: '#5c5c72', fontSize: 11 }}>
                <div style={{ width: 16, height: 16, border: '2px solid #222234', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin .6s linear infinite' }} />
                Don&apos;t Build checking prompt quality...
              </div>
            )}
            {dbGate === 'pass' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, marginBottom: 12, background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.15)', color: '#10b981', fontSize: 11 }}>
                <span style={{ fontSize: 14 }}>✅</span>
                <div><strong>Don&apos;t Build: PASS</strong> — All prompts are clear and specific <span style={{ fontSize: 9, color: '#5c5c72', marginLeft: 8 }}>0.3s, 0cr</span></div>
              </div>
            )}
            {dbGate === 'warn' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, marginBottom: 12, background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.15)', color: '#f59e0b', fontSize: 11 }}>
                <span style={{ fontSize: 14 }}>⚠️</span>
                <div><strong>Don&apos;t Build: WARNING</strong> — Some prompts are vague. Consider adding more detail.</div>
              </div>
            )}

            {/* Config Area */}
            {results.length === 0 && (
              <div>
                {/* Mode Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ display: 'inline-flex', background: '#12121e', borderRadius: 7, padding: 2, gap: 1 }}>
                    {(['single', 'bulk'] as const).map(m => (
                      <button key={m} onClick={() => setMode(m)} style={{ padding: '5px 12px', borderRadius: 5, fontSize: 11, fontWeight: 500, color: mode === m ? '#fff' : '#5c5c72', cursor: 'pointer', border: 'none', background: mode === m ? '#6366f1' : 'transparent', fontFamily: 'inherit' }}>
                        {m === 'single' ? 'Single' : 'Bulk'}
                      </button>
                    ))}
                  </div>
                  {mode === 'bulk' && <span style={{ fontSize: 11, color: '#a0a0b8' }}>{promptCount} prompts × {tierCount} tiers = <strong>{totalJobs} previews</strong></span>}
                </div>

                {/* Prompts */}
                {mode === 'single' ? (
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: '#a0a0b8', marginBottom: 4 }}>Prompt</label>
                    <textarea value={singlePrompt} onChange={e => setSinglePrompt(e.target.value)} rows={2} style={{ width: '100%', padding: '9px 11px', background: '#12121e', border: '1px solid rgba(255,255,255,.06)', borderRadius: 7, color: '#eaeaf2', fontFamily: 'inherit', fontSize: 12, resize: 'vertical', outline: 'none' }} />
                  </div>
                ) : (
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: '#a0a0b8', marginBottom: 4 }}>Bulk Prompts</label>
                    {bulkPrompts.map((p, i) => (
                      <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 10, color: '#5c5c72', minWidth: 16, textAlign: 'right', marginTop: 10, fontFamily: "'IBM Plex Mono', monospace" }}>{i + 1}.</span>
                        <textarea value={p} onChange={e => { const next = [...bulkPrompts]; next[i] = e.target.value; setBulkPrompts(next); }} rows={2} style={{ flex: 1, padding: '9px 11px', background: '#12121e', border: '1px solid rgba(255,255,255,.06)', borderRadius: 7, color: '#eaeaf2', fontFamily: 'inherit', fontSize: 12, resize: 'vertical', outline: 'none' }} />
                        {bulkPrompts.length > 1 && (
                          <button onClick={() => setBulkPrompts(prev => prev.filter((_, j) => j !== i))} style={{ padding: '2px 6px', borderRadius: 4, fontSize: 9, background: 'rgba(239,68,68,.06)', color: '#ef4444', border: 'none', cursor: 'pointer', marginTop: 5 }}>✕</button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => setBulkPrompts(prev => [...prev, ''])} style={{ padding: '5px 10px', borderRadius: 5, fontSize: 10.5, color: '#5c5c72', cursor: 'pointer', border: 'none', background: 'transparent', fontFamily: 'inherit' }}>+ Add</button>
                  </div>
                )}

                {/* Negative Prompt */}
                {showNeg && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: '#a0a0b8', marginBottom: 4 }}>Negative Prompt</label>
                    <input type="text" value={negPrompt} onChange={e => setNegPrompt(e.target.value)} style={{ width: '100%', padding: '9px 11px', background: '#12121e', border: '1px solid rgba(255,255,255,.06)', borderRadius: 7, color: '#eaeaf2', fontFamily: 'inherit', fontSize: 12, outline: 'none' }} />
                  </div>
                )}

                {/* Tool Options */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  {showAR && (
                    <div>
                      <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: '#a0a0b8', marginBottom: 4 }}>Aspect Ratio</label>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {['16:9', '1:1', '9:16'].map((ar, i) => (
                          <button key={ar} style={{ padding: '4px 11px', borderRadius: 4, fontSize: 10.5, background: i === 0 ? '#6366f1' : '#12121e', color: i === 0 ? '#fff' : '#5c5c72', border: `1px solid ${i === 0 ? '#6366f1' : 'rgba(255,255,255,.06)'}`, cursor: 'pointer', fontFamily: 'inherit' }}>{ar}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {showDur && (
                    <div>
                      <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: '#a0a0b8', marginBottom: 4 }}>Duration: 5s</label>
                      <input type="range" min={2} max={20} defaultValue={5} style={{ width: 110 }} />
                    </div>
                  )}
                  {showVoice && (
                    <div>
                      <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: '#a0a0b8', marginBottom: 4 }}>Voice</label>
                      <select style={{ padding: '4px 8px', fontSize: 11, background: '#12121e', border: '1px solid rgba(255,255,255,.06)', borderRadius: 7, color: '#eaeaf2', fontFamily: 'inherit' }}>
                        <option>Alloy</option><option>Echo</option><option>Nova</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Quality Tiers */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <label style={{ fontSize: 10.5, fontWeight: 600, color: '#a0a0b8', margin: 0 }}>Quality Tiers</label>
                  <span style={{ fontSize: 8.5, padding: '2px 6px', borderRadius: 3, background: '#222234', color: '#5c5c72', fontFamily: "'IBM Plex Mono', monospace" }}>{batchLabel}</span>
                </div>
                <p style={{ fontSize: 10, color: '#5c5c72', marginBottom: 8 }}>Select tiers to compare — preview cost only, finalize keepers</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                  {(['standard', 'premium', 'ultra'] as const).map(ti => {
                    const pp = PR[tool][ti];
                    const sel = tiers.includes(ti);
                    return (
                      <div key={ti} onClick={() => toggleTier(ti)} style={{ padding: 11, textAlign: 'left', borderRadius: 10, background: sel ? `color-mix(in srgb, ${pp.c} 5%, #0c0c16)` : '#0c0c16', border: `2px solid ${sel ? pp.c : 'rgba(255,255,255,.06)'}`, cursor: 'pointer', transition: '.12s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: sel ? pp.c : '#eaeaf2' }}>{TM[ti].l}</span>
                          <div style={{ width: 13, height: 13, borderRadius: 3, border: `2px solid ${sel ? pp.c : '#3a3a50'}`, background: sel ? pp.c : 'transparent', display: 'grid', placeItems: 'center', fontSize: 8, color: '#fff' }}>{sel ? '✓' : ''}</div>
                        </div>
                        <div style={{ fontSize: 9.5, color: '#5c5c72', marginBottom: 6 }}>{TM[ti].d}</div>
                        <div style={{ display: 'flex', gap: 12, fontSize: 9.5 }}>
                          <div><span style={{ color: '#10b981', fontWeight: 600 }}>Preview: {pp.pv}cr</span><div style={{ fontSize: 8.5, color: '#3a3a50', fontFamily: "'IBM Plex Mono', monospace", marginTop: 1 }}>{pp.pvL}</div></div>
                          <div><span style={{ color: '#a0a0b8' }}>Final: {pp.fn}cr</span><div style={{ fontSize: 8.5, color: '#3a3a50', fontFamily: "'IBM Plex Mono', monospace", marginTop: 1 }}>{pp.fnL}</div></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Cost Bar */}
                <div style={{ background: '#0c0c16', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 1 }}>
                      Preview: <span style={{ color: '#10b981' }}>{pvTotal}cr</span>
                      <span style={{ fontSize: 10, color: '#5c5c72', fontWeight: 400 }}>({totalJobs} jobs)</span>
                      {savings > 0 && <span style={{ fontSize: 9.5, padding: '2px 6px', borderRadius: 3, background: 'rgba(16,185,129,.1)', color: '#10b981', fontWeight: 600 }}>Save {savings}%</span>}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#5c5c72' }}>Full: {fnTotal}cr — preview first, finalize keepers</div>
                  </div>
                  <button onClick={doGenerate} disabled={totalJobs === 0 || generating} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 7, fontSize: 11.5, fontWeight: 600, cursor: totalJobs === 0 ? 'not-allowed' : 'pointer', border: 'none', fontFamily: 'inherit', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', opacity: totalJobs === 0 ? .35 : 1 }}>
                    {generating ? '⟳ Generating…' : `Generate ${totalJobs} Preview${totalJobs > 1 ? 's' : ''}`}
                  </button>
                </div>
              </div>
            )}

            {/* Results */}
            {results.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700 }}>Results ({results.length})</h3>
                  {results.filter(r => r.status === 'preview_ready').length > 1 && (
                    <button onClick={finalizeAll} style={{ padding: '5px 10px', borderRadius: 7, fontSize: 10.5, fontWeight: 600, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                      ⬆ Finalize All ({results.filter(r => r.status === 'preview_ready').length})
                    </button>
                  )}
                </div>

                {/* Group by prompt if bulk */}
                {(() => {
                  const groups: Record<string, GenResult[]> = {};
                  results.forEach(r => { if (!groups[r.prompt]) groups[r.prompt] = []; groups[r.prompt].push(r); });
                  return Object.entries(groups).map(([prompt, items]) => (
                    <div key={prompt}>
                      {mode === 'bulk' && (
                        <div style={{ fontSize: 11, fontWeight: 600, padding: '6px 10px', background: '#12121e', borderRadius: 6, borderLeft: '3px solid #6366f1', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                          &ldquo;{prompt.length > 50 ? prompt.slice(0, 50) + '…' : prompt}&rdquo;
                          <span style={{ fontSize: 9, color: '#5c5c72' }}>{items.length} tiers</span>
                        </div>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, 1fr)`, gap: 10, marginBottom: 16 }}>
                        {items.map(r => {
                          const pp = PR[tool][r.tier];
                          const isProcessing = ['queued', 'running_preview', 'queued_final', 'running_final'].includes(r.status);
                          return (
                            <div key={r.id} style={{ borderRadius: 12, overflow: 'hidden', background: '#0c0c16', border: '1px solid rgba(255,255,255,.06)' }}>
                              {/* Preview Visual */}
                              <div style={{ height: 150, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ position: 'absolute', inset: 0, background: GRADIENTS[r.idx % GRADIENTS.length], opacity: r.status === 'preview_ready' ? 0.5 : 1 }} />
                                {isProcessing && <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,6,12,.7)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 4 }}>
                                  <div style={{ width: 20, height: 20, border: '2px solid #222234', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin .6s linear infinite' }} />
                                  <div style={{ fontSize: 9, color: '#5c5c72', marginTop: 4 }}>{r.status.replace(/_/g, ' ')}...</div>
                                </div>}
                                <div style={{ position: 'absolute', top: 6, left: 6, fontSize: 7.5, fontWeight: 700, padding: '2px 5px', borderRadius: 3, background: 'rgba(0,0,0,.5)', color: 'white', textTransform: 'uppercase', letterSpacing: '.04em', zIndex: 3 }}>{r.tier}</div>
                                <div style={{ position: 'absolute', top: 6, right: 6, fontSize: 8.5, fontWeight: 600, padding: '2px 6px', borderRadius: 3, zIndex: 3, background: `${r.status === 'preview_ready' ? '#f59e0b' : r.status === 'final_ready' ? '#10b981' : r.status === 'failed' ? '#ef4444' : '#3b82f6'}18`, color: r.status === 'preview_ready' ? '#f59e0b' : r.status === 'final_ready' ? '#10b981' : r.status === 'failed' ? '#ef4444' : '#3b82f6' }}>
                                  {r.status === 'preview_ready' ? 'preview' : r.status === 'final_ready' ? 'final ✓' : r.status === 'failed' ? 'failed' : r.status.replace(/_/g, ' ')}
                                </div>
                              </div>
                              {/* Info */}
                              <div style={{ padding: '10px 12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}>{TM[r.tier].l}</span>
                                  <span style={{ fontSize: 8.5, color: '#3a3a50', fontFamily: "'IBM Plex Mono', monospace" }}>{r.status === 'final_ready' ? pp.fnL : pp.pvL}</span>
                                </div>
                                <div style={{ fontSize: 9.5, color: '#5c5c72', margin: '4px 0 7px', display: 'flex', gap: 12 }}>
                                  <span>Pv: <span style={{ color: '#10b981' }}>{pp.pv}cr ✓</span></span>
                                  <span>Fn: {pp.fn}cr</span>
                                </div>
                                {r.status === 'preview_ready' && (
                                  <button onClick={() => finalizeOne(r.id)} style={{ width: '100%', padding: 7, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'inherit', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}>⬆ Finalize {pp.fn}cr</button>
                                )}
                                {r.status === 'final_ready' && (
                                  <div style={{ width: '100%', padding: 7, borderRadius: 6, fontSize: 11, fontWeight: 600, textAlign: 'center', background: 'rgba(16,185,129,.1)', color: '#10b981' }}>✓ Final Ready</div>
                                )}
                                {r.status === 'failed' && (
                                  <div style={{ width: '100%', padding: 7, borderRadius: 6, fontSize: 11, fontWeight: 600, textAlign: 'center', background: 'rgba(239,68,68,.08)', color: '#ef4444' }}>Failed</div>
                                )}
                                {isProcessing && (
                                  <div style={{ width: '100%', padding: 7, borderRadius: 6, fontSize: 11, fontWeight: 600, textAlign: 'center', background: '#222234', color: '#5c5c72' }}>{r.status.replace(/_/g, ' ')}…</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        )}

        {/* ─── PIPELINE PAGE ─── */}
        {page === 'pipeline' && (
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.4px', marginBottom: 2 }}>⬡ Pipeline Builder</div>
            <div style={{ fontSize: 12, color: '#a0a0b8', marginBottom: 20 }}>Chain tools into automated content workflows — each step feeds into the next</div>

            {/* Pipeline Flow */}
            <div style={{ background: '#0c0c16', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 13, fontWeight: 700 }}>YouTube Content Pipeline</h3>
                  <p style={{ fontSize: 10, color: '#5c5c72' }}>Generates complete video package: script → voiceover → thumbnail → video</p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{ fontSize: 8.5, padding: '2px 6px', borderRadius: 3, background: '#222234', color: '#5c5c72', fontFamily: "'IBM Plex Mono', monospace" }}>4 steps</span>
                  <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: 'rgba(16,185,129,.1)', color: '#10b981', fontWeight: 600 }}>Active</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', margin: '12px 0' }}>
                {['📝 Script', '🎙️ Voice', '🖼️ Thumbnail', '🎬 Video'].map((label, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                    {i > 0 && <span style={{ fontSize: 14, color: '#3a3a50', margin: '0 4px' }}>→</span>}
                    <div onClick={() => setPipeStep(i)} style={{ padding: '10px 14px', background: pipeStep === i ? 'rgba(99,102,241,.06)' : '#12121e', border: `1px solid ${pipeStep === i ? '#6366f1' : 'rgba(255,255,255,.06)'}`, borderRadius: 8, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      {label}
                      <span style={{ fontSize: 8, padding: '2px 5px', borderRadius: 3, background: pipeNodes[i].status === 'done' ? 'rgba(16,185,129,.1)' : pipeNodes[i].status === 'running' ? 'rgba(59,130,246,.1)' : '#222234', color: pipeNodes[i].status === 'done' ? '#10b981' : pipeNodes[i].status === 'running' ? '#3b82f6' : '#5c5c72' }}>
                        {pipeNodes[i].status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step Config */}
            <div style={{ background: '#0c0c16', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h3 style={{ fontSize: 12, fontWeight: 700 }}>{PIPE_STEPS[pipeStep].t}</h3>
                <span style={{ fontSize: 8.5, padding: '2px 6px', borderRadius: 3, background: '#222234', color: '#5c5c72', fontFamily: "'IBM Plex Mono', monospace" }}>{PIPE_STEPS[pipeStep].p}</span>
              </div>
              <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: '#a0a0b8', marginBottom: 4 }}>Prompt Template</label>
              <textarea rows={2} defaultValue={PIPE_STEPS[pipeStep].tmpl} style={{ width: '100%', padding: '9px 11px', background: '#12121e', border: '1px solid rgba(255,255,255,.06)', borderRadius: 7, color: '#eaeaf2', fontFamily: 'inherit', fontSize: 11, marginBottom: 8, resize: 'vertical', outline: 'none' }} />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {PIPE_STEPS[pipeStep].vars.map(v => (
                  <span key={v} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 3, background: 'rgba(99,102,241,.1)', color: '#6366f1' }}>{`{{${v}}}`}</span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={runPipeline} disabled={pipeRunning} style={{ padding: '5px 10px', borderRadius: 7, fontSize: 10.5, fontWeight: 600, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', opacity: pipeRunning ? .5 : 1 }}>▶ Run Full Pipeline</button>
                <button onClick={() => showToast(`✓ Step ${pipeStep + 1} running...`)} style={{ padding: '5px 10px', borderRadius: 7, fontSize: 10.5, fontWeight: 600, border: '1px solid rgba(255,255,255,.06)', background: '#222234', color: '#a0a0b8', cursor: 'pointer', fontFamily: 'inherit' }}>▶ Run This Step Only</button>
              </div>
            </div>

            {/* Pipeline Output */}
            {pipeOutput && (
              <div>
                <h3 style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Pipeline Output</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {[
                    { icon: '📝', name: 'Script', desc: '1,247 words. Hook: "What if AI is about to change everything..."', cost: '2cr' },
                    { icon: '🎙️', name: 'Voice', desc: '4:32 audio, ElevenLabs Turbo. Natural pacing.', cost: '5cr' },
                    { icon: '🖼️', name: 'Thumbnail', desc: '1024×576 image. Bold "AI TRENDS 2026" text.', cost: '17cr' },
                    { icon: '🎬', name: 'Video', desc: '10s B-roll clip, 1080p. Cinematic tech montage.', cost: '25cr' },
                  ].map(s => (
                    <div key={s.name} style={{ background: '#0c0c16', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>{s.icon} {s.name}</div>
                      <div style={{ fontSize: 9, color: '#5c5c72', lineHeight: 1.5 }}>{s.desc}</div>
                      <div style={{ marginTop: 6, fontSize: 9, color: '#10b981' }}>✓ {s.cost}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, padding: '10px 14px', background: '#12121e', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>Total Pipeline Cost: <span style={{ color: '#6366f1' }}>49cr</span></span>
                  <button style={{ padding: '5px 10px', borderRadius: 7, fontSize: 10.5, fontWeight: 600, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>📦 Export Package</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── AUTOMATIC PAGE ─── */}
        {page === 'auto' && (
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.4px', marginBottom: 2 }}>⚡ Automatic Mode</div>
            <div style={{ fontSize: 12, color: '#a0a0b8', marginBottom: 20 }}>Set triggers, rules, and schedules — StreamsAI generates content without you</div>

            <h3 style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Active Automations</h3>
            {[
              { icon: '📅', name: 'Weekly Social Batch', desc: 'Every Monday 9am → 5 images (Premium) + 5 scripts (Standard)', on: true },
              { icon: '🔗', name: 'Shopify New Product', desc: 'Webhook: new product → thumbnail (Ultra) + description (Premium)', on: true },
              { icon: '📊', name: 'Auto-Finalize 85%+', desc: 'Previews scoring ≥ 85% quality auto-finalize. Below → queue for review.', on: true },
              { icon: '🛑', name: 'Credit Guard', desc: 'If credits < 100 → pause all automations, send email alert', on: false },
            ].map((rule, i) => (
              <RuleCard key={i} {...rule} />
            ))}

            <h3 style={{ fontSize: 12, fontWeight: 700, margin: '16px 0 8px' }}>Create New Automation</h3>
            <div style={{ background: '#0c0c16', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: '#a0a0b8', marginBottom: 4 }}>Trigger Type</label>
                  <select style={{ width: '100%', padding: '7px 10px', fontSize: 11, background: '#12121e', border: '1px solid rgba(255,255,255,.06)', borderRadius: 7, color: '#eaeaf2', fontFamily: 'inherit' }}>
                    <option>Schedule (Cron)</option><option>Webhook (HTTP POST)</option><option>Credit Balance</option><option>Pipeline Complete</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: '#a0a0b8', marginBottom: 4 }}>Schedule</label>
                  <input type="text" defaultValue="0 9 * * MON" style={{ width: '100%', padding: '7px 10px', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", background: '#12121e', border: '1px solid rgba(255,255,255,.06)', borderRadius: 7, color: '#eaeaf2', outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => showToast('✓ Automation saved')} style={{ padding: '5px 10px', borderRadius: 7, fontSize: 10.5, fontWeight: 600, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>💾 Save Automation</button>
                <button onClick={() => showToast('✓ Test run started')} style={{ padding: '5px 10px', borderRadius: 7, fontSize: 10.5, fontWeight: 600, border: '1px solid rgba(255,255,255,.06)', background: '#222234', color: '#a0a0b8', cursor: 'pointer', fontFamily: 'inherit' }}>🧪 Test Run</button>
                <span style={{ fontSize: 9, color: '#5c5c72' }}>Est. cost per run: ~12cr</span>
              </div>
            </div>
          </div>
        )}

        {/* ─── DASHBOARD ─── */}
        {page === 'dash' && (
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 2 }}>Dashboard</div>
            <div style={{ fontSize: 12, color: '#a0a0b8', marginBottom: 20 }}>Welcome back</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                { label: 'Generations', value: '247', color: '#eaeaf2' },
                { label: 'Credits', value: credits.toLocaleString(), color: '#6366f1' },
                { label: 'Pipelines', value: '18', color: '#eaeaf2' },
                { label: 'Saved', value: '$142', color: '#10b981' },
              ].map(s => (
                <div key={s.label} style={{ background: '#0c0c16', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 9, color: '#5c5c72' }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── STUB PAGES ─── */}
        {page === 'hist' && <div><div style={{ fontSize: 20, fontWeight: 800, marginBottom: 2 }}>History</div><div style={{ fontSize: 12, color: '#a0a0b8' }}>Past generations</div></div>}
        {page === 'lib' && <div><div style={{ fontSize: 20, fontWeight: 800, marginBottom: 2 }}>Library</div><div style={{ fontSize: 12, color: '#a0a0b8' }}>Assets</div></div>}
        {page === 'set' && <div><div style={{ fontSize: 20, fontWeight: 800, marginBottom: 2 }}>Settings</div><div style={{ fontSize: 12, color: '#a0a0b8' }}>Account</div></div>}
      </div>

      {/* ═══ RIGHT SIDEBAR (Tools) ═══ */}
      <div style={{ width: rightOpen ? 76 : 36, minWidth: rightOpen ? 76 : 36, background: '#0c0c16', borderLeft: '1px solid rgba(255,255,255,.06)', display: 'flex', flexDirection: 'column', transition: 'width .25s, min-width .25s', flexShrink: 0 }}>
        <button onClick={() => setRightOpen(!rightOpen)} style={{ width: '100%', padding: '6px 0', display: 'flex', justifyContent: 'center', cursor: 'pointer', color: '#3a3a50', fontSize: 11, border: 'none', background: 'transparent', fontFamily: 'inherit' }}>☰</button>
        {rightOpen && (
          <>
            <div style={{ padding: '4px 8px', fontSize: 8, fontWeight: 600, color: '#3a3a50', textTransform: 'uppercase' }}>Tools</div>
            {([
              { t: 'script' as Tool, icon: '📝', label: 'Script', c: '#6366f1' },
              { t: 'voice' as Tool, icon: '🎙️', label: 'Voice', c: '#10b981' },
              { t: 'image' as Tool, icon: '🖼️', label: 'Image', c: '#f59e0b' },
              { t: 'video' as Tool, icon: '🎬', label: 'Video', c: '#ef4444' },
            ]).map(item => (
              <div key={item.t} onClick={() => { selectTool(item.t); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', fontSize: 11, fontWeight: tool === item.t && page === 'gen' ? 600 : 500, color: tool === item.t && page === 'gen' ? '#eaeaf2' : '#5c5c72', cursor: 'pointer', borderLeft: `2px solid ${tool === item.t && page === 'gen' ? item.c : 'transparent'}`, background: tool === item.t && page === 'gen' ? `color-mix(in srgb, ${item.c} 4%, transparent)` : 'transparent' }}>
                <span style={{ fontSize: 14 }}>{item.icon}</span><span>{item.label}</span>
              </div>
            ))}
            <div style={{ height: 1, background: 'rgba(255,255,255,.06)', margin: '4px 6px' }} />
            <div style={{ padding: '4px 8px', fontSize: 8, fontWeight: 600, color: '#3a3a50', textTransform: 'uppercase' }}>Modes</div>
            <div onClick={() => setPage('pipeline')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', fontSize: 11, fontWeight: page === 'pipeline' ? 600 : 500, color: page === 'pipeline' ? '#eaeaf2' : '#5c5c72', cursor: 'pointer', borderLeft: `2px solid ${page === 'pipeline' ? '#10b981' : 'transparent'}` }}>
              <span style={{ fontSize: 14 }}>⬡</span><span>Pipeline</span>
            </div>
            <div onClick={() => setPage('auto')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', fontSize: 11, fontWeight: page === 'auto' ? 600 : 500, color: page === 'auto' ? '#eaeaf2' : '#5c5c72', cursor: 'pointer', borderLeft: `2px solid ${page === 'auto' ? '#3b82f6' : 'transparent'}` }}>
              <span style={{ fontSize: 14 }}>⚡</span><span>Automatic</span>
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,.06)', margin: '4px 6px' }} />
            <div onClick={() => setCopilotOpen(!copilotOpen)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', fontSize: 11, fontWeight: 500, color: copilotOpen ? '#eaeaf2' : '#5c5c72', cursor: 'pointer', borderLeft: `2px solid ${copilotOpen ? '#8b5cf6' : 'transparent'}` }}>
              <span style={{ fontSize: 14 }}>🤖</span><span>Copilot</span>
            </div>
          </>
        )}
      </div>

      {/* ═══ AI COPILOT OVERLAY ═══ */}
      {copilotOpen && (
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 360, background: '#0c0c16', borderLeft: '1px solid rgba(255,255,255,.06)', zIndex: 100, display: 'flex', flexDirection: 'column', animation: 'slideR .25s ease' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 14 }}>🤖</span> AI Copilot</h3>
            <button onClick={() => setCopilotOpen(false)} style={{ background: 'none', border: 'none', color: '#5c5c72', cursor: 'pointer', fontSize: 16, fontFamily: 'inherit', padding: 4 }}>✕</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
            {copilotMsgs.map((msg, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 12, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.role === 'ai' && <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', fontSize: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white' }}>🤖</div>}
                <div style={{ borderRadius: 10, padding: '8px 12px', fontSize: 11.5, lineHeight: 1.6, maxWidth: '85%', background: msg.role === 'ai' ? '#12121e' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: msg.role === 'ai' ? '#a0a0b8' : 'white' }}>{msg.text}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', gap: 6 }}>
            <input type="text" value={copilotInput} onChange={e => setCopilotInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendCopilot()} placeholder="Ask anything..." style={{ flex: 1, padding: '9px 11px', background: '#12121e', border: '1px solid rgba(255,255,255,.06)', borderRadius: 7, color: '#eaeaf2', fontFamily: 'inherit', fontSize: 11, outline: 'none' }} />
            <button onClick={sendCopilot} style={{ padding: '5px 10px', borderRadius: 7, fontSize: 10.5, fontWeight: 600, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Send</button>
          </div>
        </div>
      )}

      {/* ═══ TOAST ═══ */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 16, right: 16, padding: '9px 14px', borderRadius: 7, fontSize: 11, fontWeight: 500, zIndex: 200, background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.25)', color: '#10b981', fontFamily: 'inherit', animation: 'fadeIn .3s' }}>{toast}</div>
      )}

      {/* ═══ GLOBAL ANIMATIONS ═══ */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideR { from { transform: translateX(100%); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: .4 } }
        @keyframes glow { 0%,100% { box-shadow: 0 0 6px rgba(99,102,241,.15) } 50% { box-shadow: 0 0 16px rgba(99,102,241,.3) } }
        ::selection { background: rgba(99,102,241,.3) }
        ::-webkit-scrollbar { width: 4px }
        ::-webkit-scrollbar-thumb { background: #222234; border-radius: 2px }
      `}</style>
    </div>
  );
}

// ═══ Rule Card Component ═══
function RuleCard({ icon, name, desc, on: initialOn }: { icon: string; name: string; desc: string; on: boolean }) {
  const [on, setOn] = useState(initialOn);
  return (
    <div style={{ background: '#12121e', border: '1px solid rgba(255,255,255,.06)', borderRadius: 8, padding: 14, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 600 }}>{name}</div>
          <div style={{ fontSize: 10, color: '#5c5c72', marginTop: 1 }}>{desc}</div>
        </div>
      </div>
      <button onClick={() => setOn(!on)} style={{ width: 34, height: 18, borderRadius: 9, background: on ? '#10b981' : '#222234', cursor: 'pointer', position: 'relative', border: 'none', transition: '.2s' }}>
        <div style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 14, height: 14, borderRadius: '50%', background: 'white', transition: '.2s' }} />
      </button>
    </div>
  );
}
