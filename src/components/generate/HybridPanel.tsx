"use client";

const PIPELINE_STEPS = [
  { name: "Script Generation", status: "completed", icon: "\u{1F4DD}" },
  { name: "Voice Synthesis", status: "awaiting", icon: "\u{1F399}" },
  { name: "Image Generation", status: "pending", icon: "\u{1F5BC}" },
  { name: "Video Assembly", status: "pending", icon: "\u{1F3AC}" },
];

export default function HybridPanel() {
  const currentIdx = PIPELINE_STEPS.findIndex((s) => s.status === "awaiting");
  const progress = currentIdx >= 0 ? Math.round(((currentIdx) / PIPELINE_STEPS.length) * 100) : 0;

  return (
    <div style={{ padding: 16, background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 12, marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Hybrid Pipeline</span>
        <span style={{ fontSize: "0.75rem", color: "#f59e0b" }}>Step {currentIdx + 1} of {PIPELINE_STEPS.length} &mdash; Awaiting Approval</span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, background: "var(--bg-tertiary)", borderRadius: 3, marginBottom: 12, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: "#10b981", borderRadius: 3, transition: "width 0.3s" }} />
      </div>

      {/* Steps */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {PIPELINE_STEPS.map((step, i) => (
          <div key={step.name} style={{
            padding: 10, borderRadius: 8, textAlign: "center",
            background: step.status === "completed" ? "rgba(16,185,129,0.06)" : step.status === "awaiting" ? "rgba(245,158,11,0.06)" : "var(--bg-tertiary)",
            border: `1px solid ${step.status === "awaiting" ? "rgba(245,158,11,0.2)" : "var(--border)"}`,
          }}>
            <div style={{ fontSize: "0.75rem", marginBottom: 2 }}>{step.icon}</div>
            <div style={{ fontSize: "0.7rem", fontWeight: 600, color: step.status === "completed" ? "#10b981" : step.status === "awaiting" ? "#f59e0b" : "var(--text-muted)" }}>
              {step.name}
            </div>
            <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: 2 }}>
              {step.status === "completed" ? "\u2713 Done" : step.status === "awaiting" ? "Approve?" : "Pending"}
            </div>
            {step.status === "awaiting" && (
              <div style={{ display: "flex", gap: 3, marginTop: 6, justifyContent: "center" }}>
                <button style={{ padding: "2px 6px", borderRadius: 3, fontSize: "0.6rem", fontWeight: 600, background: "rgba(16,185,129,0.1)", color: "#10b981", border: "none", cursor: "pointer" }}>Approve</button>
                <button style={{ padding: "2px 6px", borderRadius: 3, fontSize: "0.6rem", fontWeight: 600, background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "none", cursor: "pointer" }}>Edit</button>
                <button style={{ padding: "2px 6px", borderRadius: 3, fontSize: "0.6rem", fontWeight: 600, background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "none", cursor: "pointer" }}>Regen</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
