'use client';

import type { GenerateStep } from '@/lib/types';

const STEPS: { key: GenerateStep; label: string; icon: string }[] = [
  { key: 'configure', label: 'Configure', icon: '⚙' },
  { key: 'preview', label: 'Preview', icon: '👁' },
  { key: 'compare', label: 'Compare', icon: '⇔' },
  { key: 'finalize', label: 'Finalize', icon: '✓' },
];

export default function StepFlowBar({ current, onStepClick }: {
  current: GenerateStep;
  onStepClick: (step: GenerateStep) => void;
}) {
  const currentIdx = STEPS.findIndex(s => s.key === current);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28, background: 'var(--bg-secondary)', borderRadius: 10, padding: '6px 8px', border: '1px solid var(--border)' }}>
      {STEPS.map((step, idx) => {
        const isActive = step.key === current;
        const isDone = idx < currentIdx;
        const isClickable = idx <= currentIdx;

        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <button
              onClick={() => isClickable && onStepClick(step.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                borderRadius: 8, cursor: isClickable ? 'pointer' : 'default', border: 'none', flex: 1,
                background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: isActive ? 'var(--accent)' : isDone ? 'var(--success)' : 'var(--text-muted)',
                transition: 'all 0.2s', fontWeight: isActive ? 600 : 400, fontSize: '0.8rem',
              }}
            >
              <span style={{
                width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                background: isActive ? 'var(--accent)' : isDone ? 'var(--success)' : 'var(--bg-tertiary)',
                color: isActive || isDone ? 'white' : 'var(--text-muted)',
              }}>
                {isDone ? '✓' : step.icon}
              </span>
              {step.label}
            </button>
            {idx < STEPS.length - 1 && (
              <div style={{ width: 24, height: 2, background: isDone ? 'var(--success)' : 'var(--border)', flexShrink: 0 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
