'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolUse?: { name: string; result?: string };
}

const SUGGESTIONS = [
  'Generate 5 premium product images',
  'Build a script → voice → video pipeline',
  'Check my credit usage this month',
  'Create a product launch video from an image',
];

export default function CopilotOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'assistant', timestamp: new Date(), content: "Hey! I'm your AI Copilot. I can generate content, build pipelines, check credits, or configure your workspace. What would you like to do?" },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = useCallback(async (text?: string) => {
    const msg = text || input;
    if (!msg.trim() || streaming) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: msg, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setStreaming(true);

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(), role: 'assistant', timestamp: new Date(),
        content: data.content || data.message || 'I encountered an issue processing that request.',
        toolUse: data.tool_use ? { name: data.tool_use.name, result: data.tool_use.result } : undefined,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', timestamp: new Date(), content: 'Sorry, I had trouble connecting. Please try again.' }]);
    }
    setStreaming(false);
  }, [input, streaming, messages]);

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, width: 360, height: '100vh', zIndex: 100,
      background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      animation: 'slideInRight 0.25s ease-out',
      boxShadow: '-8px 0 32px rgba(0,0,0,0.3)',
    }}>
      <style>{`@keyframes slideInRight { from { transform: translateX(360px); } to { transform: translateX(0); } }`}</style>

      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>◈</div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>AI Copilot</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Powered by Claude</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', color: 'var(--text-muted)', fontSize: '1.2rem', padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}>✕</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
            <div style={{
              maxWidth: '85%', padding: '10px 14px', borderRadius: 10,
              background: msg.role === 'user' ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'var(--bg-tertiary)',
              border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
              color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
            }}>
              {msg.toolUse && (
                <div style={{ fontSize: '0.6rem', padding: '3px 6px', borderRadius: 4, marginBottom: 6, background: 'rgba(99,102,241,0.1)', color: 'var(--accent)', fontFamily: "'JetBrains Mono',monospace", display: 'inline-block' }}>
                  ⚡ {msg.toolUse.name}
                </div>
              )}
              <div style={{ fontSize: '0.8rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{msg.content}</div>
            </div>
          </div>
        ))}
        {streaming && (
          <div style={{ display: 'flex', gap: 4, padding: '8px' }}>
            {[0, 1, 2].map(i => <span key={i} className="animate-pulse" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', animationDelay: `${i * 0.15}s` }} />)}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div style={{ padding: '0 16px 8px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => send(s)} style={{
              padding: '6px 10px', borderRadius: 6, fontSize: '0.7rem', background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer',
            }}>{s}</button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask the Copilot..."
            style={{ flex: 1, padding: '10px 12px', fontSize: '0.8rem' }}
          />
          <button onClick={() => send()} disabled={!input.trim() || streaming} style={{
            padding: '10px 16px', borderRadius: 8, fontWeight: 600, fontSize: '0.8rem',
            background: !input.trim() || streaming ? 'var(--bg-tertiary)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            color: !input.trim() || streaming ? 'var(--text-muted)' : 'white',
            cursor: !input.trim() || streaming ? 'not-allowed' : 'pointer',
          }}>Send</button>
        </div>
      </div>
    </div>
  );
}
