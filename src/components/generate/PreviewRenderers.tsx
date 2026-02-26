'use client';

import type { ToolType } from '@/lib/types';

// ---------------------------------------------------------------------------
// Voice: animated waveform bars
// ---------------------------------------------------------------------------
function VoicePreview({ url, isPreview }: { url: string | null; isPreview: boolean }) {
  return (
    <div style={{ position: 'relative', padding: '20px 16px', background: 'var(--bg-tertiary)', borderRadius: 8 }}>
      {isPreview && <div style={{ position: 'absolute', top: 6, right: 8, fontSize: '0.55rem', color: 'var(--warning)', fontWeight: 600 }}>PREVIEW</div>}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 48, justifyContent: 'center' }}>
        {Array.from({ length: 30 }, (_, i) => (
          <div key={i} style={{
            width: 3, borderRadius: 2,
            background: isPreview ? 'var(--accent)' : 'var(--success)',
            height: `${12 + Math.sin(i * 0.5) * 20 + Math.random() * 16}px`,
            animation: url ? `waveBar 0.8s ease-in-out ${i * 0.03}s infinite alternate` : 'none',
            opacity: url ? 1 : 0.3,
          }} />
        ))}
      </div>
      {url && (
        <audio controls src={url} style={{ width: '100%', marginTop: 12, height: 32 }} />
      )}
      <style>{`@keyframes waveBar { from { height: 8px; } to { height: 36px; } }`}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Video / Image-to-Video / Video-to-Video / Avatar: play button + timeline
// ---------------------------------------------------------------------------
function VideoPreview({ url, isPreview, duration }: { url: string | null; isPreview: boolean; duration?: number }) {
  return (
    <div style={{ position: 'relative', background: '#000', borderRadius: 8, overflow: 'hidden', aspectRatio: '16/9' }}>
      {isPreview && <div style={{ position: 'absolute', top: 8, right: 10, fontSize: '0.55rem', color: 'var(--warning)', fontWeight: 600, zIndex: 2, background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4 }}>PREVIEW</div>}
      {url ? (
        <video src={url} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 160 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>▶</div>
        </div>
      )}
      {/* Timeline */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'rgba(255,255,255,0.1)' }}>
        <div style={{ height: '100%', width: url ? '100%' : '0%', background: 'var(--accent)', transition: 'width 0.5s' }} />
      </div>
      {duration && <div style={{ position: 'absolute', bottom: 8, left: 10, fontSize: '0.6rem', color: 'rgba(255,255,255,0.7)', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 4 }}>{duration}s</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Image: blur on preview, sharp on final
// ---------------------------------------------------------------------------
function ImagePreview({ url, isPreview }: { url: string | null; isPreview: boolean }) {
  return (
    <div style={{ position: 'relative', background: 'var(--bg-tertiary)', borderRadius: 8, overflow: 'hidden', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {isPreview && <div style={{ position: 'absolute', top: 8, right: 10, fontSize: '0.55rem', color: 'var(--warning)', fontWeight: 600, zIndex: 2, background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4 }}>PREVIEW</div>}
      {url ? (
        <img src={url} alt="Generated" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: isPreview ? 'blur(2px)' : 'none', transition: 'filter 0.3s' }} />
      ) : (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Generating...</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Script: text lines with highlights
// ---------------------------------------------------------------------------
function ScriptPreview({ url, isPreview, text }: { url: string | null; isPreview: boolean; text?: string }) {
  const lines = text ? text.split('\n').slice(0, 15) : Array.from({ length: 10 }, (_, i) => `Line ${i + 1} of generated script content...`);
  return (
    <div style={{ position: 'relative', background: 'var(--bg-tertiary)', borderRadius: 8, padding: '16px', fontFamily: "'JetBrains Mono',monospace", fontSize: '0.75rem', lineHeight: 1.8, maxHeight: 240, overflowY: 'auto' }}>
      {isPreview && <div style={{ position: 'absolute', top: 8, right: 10, fontSize: '0.55rem', color: 'var(--warning)', fontWeight: 600 }}>PREVIEW</div>}
      {lines.map((line, i) => (
        <div key={i} style={{ padding: '2px 8px', borderRadius: 3, marginBottom: 2, background: i % 3 === 0 ? 'rgba(99,102,241,0.06)' : 'transparent', color: isPreview ? 'var(--text-muted)' : 'var(--text-primary)' }}>
          <span style={{ color: 'var(--text-muted)', marginRight: 12, fontSize: '0.6rem', userSelect: 'none' }}>{String(i + 1).padStart(2, '0')}</span>
          {isPreview && !text ? <span style={{ background: 'var(--bg-hover)', borderRadius: 2, padding: '0 4px' }}>&nbsp;{'█'.repeat(8 + Math.floor(Math.random() * 20))}&nbsp;</span> : line}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main dispatcher
// ---------------------------------------------------------------------------
export default function PreviewRenderer({ type, previewUrl, finalUrl, status, duration, scriptText }: {
  type: ToolType;
  previewUrl: string | null;
  finalUrl: string | null;
  status: string;
  duration?: number;
  scriptText?: string;
}) {
  const isFinal = status === 'final_ready';
  const url = isFinal ? finalUrl : previewUrl;
  const isPreview = !isFinal;

  switch (type) {
    case 'voice':
      return <VoicePreview url={url} isPreview={isPreview} />;
    case 'video':
    case 'image_to_video':
    case 'video_to_video':
    case 'avatar':
    case 'edit':
      return <VideoPreview url={url} isPreview={isPreview} duration={duration ?? undefined} />;
    case 'image':
      return <ImagePreview url={url} isPreview={isPreview} />;
    case 'script':
      return <ScriptPreview url={url} isPreview={isPreview} text={scriptText} />;
    default:
      return <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: '0.8rem' }}>{url ? 'Preview ready' : 'Generating...'}</div>;
  }
}
