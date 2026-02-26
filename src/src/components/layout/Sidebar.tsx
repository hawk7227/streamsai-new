'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWorkspace } from '@/lib/hooks/useWorkspace';

const navSections = [
  { section: 'CREATE', items: [
    { label: 'Dashboard', href: '/dashboard', icon: '◻' },
    { label: 'Generate', href: '/generate', icon: '✦' },
    { label: 'Pipelines', href: '/pipelines', icon: '⬡' },
    { label: 'Auto', href: '/automations', icon: '⚡' },
  ]},
  { section: 'LIBRARY', items: [
    { label: 'Library', href: '/library', icon: '▤' },
    { label: 'History', href: '/history', icon: '◷' },
  ]},
  { section: 'ACCOUNT', items: [
    { label: 'Settings', href: '/settings', icon: '⚙' },
  ]},
];

const toolItems = [
  { label: 'Script', icon: '📝', tool: 'script', color: '#6366f1' },
  { label: 'Voice', icon: '🎙️', tool: 'voice', color: '#10b981' },
  { label: 'Image', icon: '🖼️', tool: 'image', color: '#f59e0b' },
  { label: 'Video', icon: '🎬', tool: 'video', color: '#ef4444' },
  { label: 'Img→Vid', icon: '🎞️', tool: 'image_to_video', color: '#ec4899' },
  { label: 'Vid→Vid', icon: '🔄', tool: 'video_to_video', color: '#8b5cf6' },
  { label: 'Avatar', icon: '🧑', tool: 'avatar', color: '#06b6d4' },
  { label: 'Edit', icon: '✂️', tool: 'edit', color: '#f97316' },
];

export default function Sidebar({ onCopilotToggle }: { onCopilotToggle?: () => void }) {
  const pathname = usePathname();
  const { limits } = useWorkspace();
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  const bal = limits?.credits_balance ?? 0;
  const cap = limits?.credits_monthly_allowance ?? 2000;
  const pct = cap > 0 ? Math.min((bal / cap) * 100, 100) : 0;

  return (
    <>
      {/* LEFT NAV — 82px open / 36px collapsed */}
      <aside style={{
        width: leftOpen ? 82 : 36, background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
        height: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 50,
        transition: 'width 0.2s ease',
      }}>
        <button onClick={() => setLeftOpen(!leftOpen)} style={{
          padding: '10px 0', width: '100%', background: 'transparent',
          color: 'var(--text-muted)', fontSize: '0.7rem', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>☰</button>

        {leftOpen && (
          <>
            <div style={{ padding: '14px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⚡</div>
            </div>

            <nav style={{ flex: 1, padding: '10px 6px', overflowY: 'auto' }}>
              {navSections.map((g) => (
                <div key={g.section} style={{ marginBottom: 16 }}>
                  {g.items.map((item) => {
                    const active = pathname === item.href || pathname?.startsWith(item.href + '/');
                    return (
                      <Link key={item.href} href={item.href}>
                        <div title={item.label} style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          gap: 2, padding: '8px 4px', borderRadius: 8, marginBottom: 2, cursor: 'pointer', position: 'relative',
                          background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
                          color: active ? 'var(--text-primary)' : 'var(--text-muted)', transition: 'all 0.15s',
                        }}>
                          <span style={{ fontSize: '1rem', opacity: active ? 1 : 0.6 }}>{item.icon}</span>
                          <span style={{ fontSize: '0.55rem', fontWeight: active ? 600 : 400 }}>{item.label}</span>
                          {active && <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 14, background: 'var(--accent)', borderRadius: 2 }} />}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>

            {/* Credit Meter — real-time from useWorkspace */}
            <div style={{ padding: '10px 8px 14px', borderTop: '1px solid var(--border)' }}>
              <div style={{ height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
                <div style={{ width: `${pct}%`, height: '100%', background: pct < 20 ? 'var(--error)' : 'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius: 2, transition: 'width 0.5s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.5rem', color: 'var(--text-muted)' }}>
                <span>{bal.toLocaleString()}</span>
                <span>{cap.toLocaleString()}</span>
              </div>
            </div>
          </>
        )}
      </aside>

      {/* RIGHT TOOLS — 76px open / 36px collapsed */}
      <aside style={{
        width: rightOpen ? 76 : 36, background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
        height: '100vh', position: 'fixed', left: leftOpen ? 82 : 36, top: 0, zIndex: 49,
        transition: 'all 0.2s ease',
      }}>
        <button onClick={() => setRightOpen(!rightOpen)} style={{
          padding: '10px 0', width: '100%', background: 'transparent',
          color: 'var(--text-muted)', fontSize: '0.7rem', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>☰</button>

        {rightOpen && (
          <>
            <div style={{ flex: 1, padding: '10px 6px', overflowY: 'auto' }}>
              {toolItems.map((t) => (
                <Link key={t.tool} href={`/generate?tool=${t.tool}`}>
                  <div title={t.label} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 2, padding: '7px 4px', borderRadius: 8, marginBottom: 2, cursor: 'pointer',
                    background: 'transparent', color: 'var(--text-muted)', transition: 'all 0.15s',
                  }}>
                    <span style={{ fontSize: '0.9rem' }}>{t.icon}</span>
                    <span style={{ fontSize: '0.46rem' }}>{t.label}</span>
                  </div>
                </Link>
              ))}
              <div style={{ height: 1, background: 'var(--border)', margin: '6px 4px' }} />
              <Link href="/pipelines"><div title="Pipeline" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '7px 4px', borderRadius: 8, cursor: 'pointer', color: 'var(--text-muted)' }}><span style={{ fontSize: '0.9rem' }}>⬡</span><span style={{ fontSize: '0.46rem' }}>Pipeline</span></div></Link>
              <Link href="/automations"><div title="Auto" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '7px 4px', borderRadius: 8, cursor: 'pointer', color: 'var(--text-muted)' }}><span style={{ fontSize: '0.9rem' }}>⚡</span><span style={{ fontSize: '0.46rem' }}>Auto</span></div></Link>
            </div>

            <div style={{ padding: '10px 6px 14px', borderTop: '1px solid var(--border)' }}>
              <button onClick={onCopilotToggle} title="AI Copilot" style={{
                width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 2, padding: '10px 4px', borderRadius: 8, cursor: 'pointer', border: 'none',
                background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.15))', color: '#a78bfa',
              }}>
                <span style={{ fontSize: '1rem' }}>🤖</span>
                <span style={{ fontSize: '0.48rem', fontWeight: 500 }}>Copilot</span>
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
