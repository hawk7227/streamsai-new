"use client";

import type { ExecutionMode } from "./tool-data";

interface ExecutionModeBarProps {
  mode: ExecutionMode;
  onChange: (mode: ExecutionMode) => void;
}

const MODES: { id: ExecutionMode; icon: string; label: string }[] = [
  { id: "manual", icon: "🖐", label: "Manual" },
  { id: "hybrid", icon: "⚡", label: "Hybrid" },
  { id: "auto", icon: "🤖", label: "Automatic" },
];

const MODE_HINTS: Record<ExecutionMode, string> = {
  manual: "Manual — Generate previews, compare tiers, finalize keepers. You control every step.",
  hybrid: "Hybrid — AI generates each step, pauses for your approval before continuing.",
  auto: "Automatic — AI generates, evaluates, auto-finalizes, and auto-posts. Set budget + quality gate.",
};

const MODE_ACTIVE_STYLES: Record<ExecutionMode, { background: string; color: string }> = {
  manual: { background: "var(--color-bg-5)", color: "var(--color-t-1)" },
  hybrid: { background: "var(--color-acc)", color: "#000" },
  auto: { background: "var(--color-blu)", color: "#fff" },
};

export default function StudioExecutionModeBar({ mode, onChange }: ExecutionModeBarProps) {
  return (
    <div className="mb-3">
      <div
        className="flex rounded-r1 p-[3px] gap-[2px] mb-2"
        style={{
          background: "var(--color-bg-3)",
          border: "1px solid var(--color-bdr)",
        }}
      >
        {MODES.map((m) => {
          const isActive = mode === m.id;
          const activeStyle = MODE_ACTIVE_STYLES[m.id];
          return (
            <button
              key={m.id}
              onClick={() => onChange(m.id)}
              className="flex-1 py-2 rounded-[6px] text-[10px] font-semibold text-center transition-all duration-fast"
              style={{
                background: isActive ? activeStyle.background : "transparent",
                color: isActive ? activeStyle.color : "var(--color-t-3)",
                border: "none",
                cursor: "pointer",
              }}
            >
              {m.icon} {m.label}
            </button>
          );
        })}
      </div>
      <div
        className="text-[10px] py-2 px-2.5 rounded-[7px]"
        style={{
          color: "var(--color-t-3)",
          background: "var(--color-bg-3)",
          borderLeft: "2px solid var(--color-acc)",
        }}
      >
        {MODE_HINTS[mode]}
      </div>
    </div>
  );
}
