"use client";

export type ExecutionMode = "manual" | "hybrid" | "auto";

const MODES: { key: ExecutionMode; icon: string; label: string; desc: string; color: string; bg: string }[] = [
  { key: "manual", icon: "\u{1F590}", label: "Manual", desc: "Generate previews, compare tiers, finalize keepers. You control every step.", color: "var(--text-primary)", bg: "var(--bg-tertiary)" },
  { key: "hybrid", icon: "\u26A1", label: "Hybrid", desc: "AI generates and evaluates. You approve at each gate before the next step.", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  { key: "auto", icon: "\u{1F916}", label: "Automatic", desc: "AI generates, evaluates, auto-finalizes, and auto-posts. Set budget + quality gate.", color: "#0088ff", bg: "rgba(0,136,255,0.12)" },
];

export default function ExecutionModeBar({ mode, onChange }: { mode: ExecutionMode; onChange: (m: ExecutionMode) => void }) {
  const current = MODES.find((m) => m.key === mode);

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 4, padding: 3, background: "var(--bg-secondary)", borderRadius: 10, border: "1px solid var(--border)", marginBottom: 8 }}>
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => onChange(m.key)}
            style={{
              flex: 1, padding: "8px 12px", borderRadius: 8, fontSize: "0.8rem", fontWeight: 600,
              cursor: "pointer", border: "none", fontFamily: "inherit", textAlign: "center",
              background: mode === m.key ? m.bg : "transparent",
              color: mode === m.key ? m.color : "var(--text-muted)",
              transition: "all 0.15s",
            }}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>
      {current && (
        <div style={{
          fontSize: "0.8rem", color: "var(--text-muted)", padding: "8px 12px",
          background: "var(--bg-secondary)", borderRadius: 8, borderLeft: `2px solid ${current.color}`,
        }}>
          <strong>{current.label}</strong> &mdash; {current.desc}
        </div>
      )}
    </div>
  );
}
