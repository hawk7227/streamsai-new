"use client";

import { useRouter } from "next/navigation";

const GATES = [
  { key: "storyboard", label: "Storyboard", desc: "Still frames per scene", cost: "Free", icon: "\u{1F5BC}" },
  { key: "animatic", label: "Animatic", desc: "Ken Burns on stills", cost: "$0 extra", icon: "\u{1F3AC}" },
  { key: "single", label: "Single Scene", desc: "1 scene at full quality", cost: "1 scene cost", icon: "\u{1F3AF}" },
  { key: "final", label: "Full Render", desc: "All scenes rendered", cost: "Full cost", icon: "\u{1F680}" },
];

export default function PreviewGates() {
  const router = useRouter();

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8 }}>Preview Gates</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {GATES.map((g) => (
          <button
            key={g.key}
            onClick={() => router.push(`/dashboard/preview?stage=${g.key}`)}
            style={{
              padding: "10px 8px", borderRadius: 8, textAlign: "center", cursor: "pointer",
              background: "var(--bg-secondary)", border: "1px solid var(--border)",
              transition: "all 0.15s", fontFamily: "inherit",
            }}
          >
            <div style={{ fontSize: "0.75rem", marginBottom: 2 }}>{g.icon}</div>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-primary)" }}>{g.label}</div>
            <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>{g.desc}</div>
            <div style={{ fontSize: "0.6rem", color: "#10b981", marginTop: 2 }}>{g.cost}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
