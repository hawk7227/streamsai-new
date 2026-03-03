"use client";

const CAMERAS = [
  { key: "static", label: "Static" },
  { key: "pan_l", label: "Pan L" },
  { key: "pan_r", label: "Pan R" },
  { key: "tilt_up", label: "Tilt" },
  { key: "zoom_in", label: "Zoom" },
  { key: "dolly", label: "Dolly" },
  { key: "orbit", label: "Orbit" },
];

export default function CameraControls({ camera, onChange, duration, onDurationChange, extendClip, onExtendChange }: {
  camera: string;
  onChange: (c: string) => void;
  duration: number;
  onDurationChange: (d: number) => void;
  extendClip: boolean;
  onExtendChange: (v: boolean) => void;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)" }}>Camera:</span>
        {CAMERAS.map((c) => (
          <button
            key={c.key}
            onClick={() => onChange(c.key)}
            style={{
              padding: "3px 8px", borderRadius: 4, fontSize: "0.7rem", fontWeight: 600,
              cursor: "pointer", border: "1px solid var(--border)", fontFamily: "inherit",
              background: camera === c.key ? "var(--accent)" : "var(--bg-secondary)",
              color: camera === c.key ? "#000" : "var(--text-secondary)",
              transition: "all 0.15s",
            }}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <select
          value={duration}
          onChange={(e) => onDurationChange(Number(e.target.value))}
          style={{ padding: "4px 8px", fontSize: "0.75rem", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
        >
          {[5, 10, 15, 20, 25].map((d) => (
            <option key={d} value={d}>{d}s</option>
          ))}
        </select>
        <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", gap: 4, alignItems: "center", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={extendClip}
            onChange={(e) => onExtendChange(e.target.checked)}
            style={{ accentColor: "var(--accent)" }}
          />
          Extend clip
        </label>
      </div>
    </div>
  );
}
