"use client";

type VideoMode = "text_to_video" | "image_to_video" | "video_to_video" | "lip_sync";

const MODES: { key: VideoMode; label: string }[] = [
  { key: "text_to_video", label: "Text \u2192 Video" },
  { key: "image_to_video", label: "Image \u2192 Video" },
  { key: "video_to_video", label: "Video \u2192 Video" },
  { key: "lip_sync", label: "Lip Sync" },
];

export default function VideoModeTabs({ mode, onChange }: { mode: VideoMode; onChange: (m: VideoMode) => void }) {
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
      {MODES.map((m) => (
        <button
          key={m.key}
          onClick={() => onChange(m.key)}
          style={{
            padding: "5px 14px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 600,
            cursor: "pointer", border: "1px solid var(--border)", fontFamily: "inherit",
            background: mode === m.key ? "var(--accent)" : "var(--bg-secondary)",
            color: mode === m.key ? "#000" : "var(--text-muted)",
            transition: "all 0.15s",
          }}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
