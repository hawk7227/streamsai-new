"use client";

import { useState } from "react";

const TOOL_SECTIONS: {
  category: string;
  items: { id: string; name: string; icon: string; providers: string; iconBg: string }[];
}[] = [
  {
    category: "CONTENT GENERATION",
    items: [
      { id: "script", name: "Script Writer", icon: "📝", providers: "Claude, GPT-4", iconBg: "rgba(99,102,241,.1)" },
      { id: "voice", name: "Voice Generator", icon: "🎙️", providers: "ElevenLabs, OpenAI TTS", iconBg: "rgba(16,185,129,.1)" },
      { id: "image", name: "Image Generator", icon: "🖼️", providers: "DALL-E 3, Flux, Stability", iconBg: "rgba(245,158,11,.1)" },
      { id: "video", name: "Video Generator", icon: "🎬", providers: "Veo 3, Sora, Runway", iconBg: "rgba(239,68,68,.1)" },
    ],
  },
  {
    category: "POST-PROCESSING",
    items: [
      { id: "video_edit", name: "Video Editor", icon: "✂️", providers: "JSON2Video, Shotstack", iconBg: "rgba(236,72,153,.1)" },
      { id: "image_edit", name: "Image Editor", icon: "🎨", providers: "Resize, filter, watermark", iconBg: "rgba(168,85,247,.1)" },
    ],
  },
  {
    category: "ACTIONS",
    items: [
      { id: "export", name: "Export", icon: "📤", providers: "Save to library / download", iconBg: "rgba(59,130,246,.1)" },
      { id: "webhook", name: "Webhook", icon: "🔗", providers: "Send to external service", iconBg: "rgba(20,184,166,.1)" },
    ],
  },
];

interface ContentToolSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onToolClick?: (toolId: string) => void;
}

export default function ContentToolSidebar({ collapsed, onToggle, onToolClick }: ContentToolSidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (collapsed) {
    return (
      <div
        style={{
          width: 16,
          minWidth: 16,
          flexShrink: 0,
          borderRight: "1px solid var(--color-bdr)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          paddingTop: 12,
          cursor: "pointer",
        }}
        onClick={onToggle}
        title="Expand tools"
      >
        <span style={{ fontSize: 10, color: "var(--color-t-3)" }}>›</span>
      </div>
    );
  }

  return (
    <div
      style={{
        width: 260,
        minWidth: 260,
        flexShrink: 0,
        background: "var(--color-bg-2)",
        borderRight: "1px solid var(--color-bdr)",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div style={{ padding: 16, borderBottom: "1px solid var(--color-bdr)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>⬡ Content Tools</h2>
          <p style={{ fontSize: 10, color: "var(--color-t-3)" }}>Click a tool to set generation type</p>
        </div>
        <button
          onClick={onToggle}
          title="Collapse tools"
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-t-3)", fontSize: 11, padding: 0 }}
        >‹</button>
      </div>

      {/* Tool sections */}
      {TOOL_SECTIONS.map((section) => (
        <div key={section.category}>
          <div
            style={{
              padding: "8px 16px 4px",
              fontSize: 9,
              fontWeight: 700,
              color: "var(--color-t-3)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {section.category}
          </div>
          {section.items.map((item) => {
            const isHovered = hoveredId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onToolClick?.(item.id)}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 16px",
                  width: "100%",
                  cursor: "pointer",
                  transition: "0.12s",
                  borderLeft: `2px solid ${isHovered ? "var(--color-acc)" : "transparent"}`,
                  background: isHovered ? "rgba(255,255,255,0.02)" : "transparent",
                  border: "none",
                  borderLeftWidth: 2,
                  borderLeftStyle: "solid",
                  borderLeftColor: isHovered ? "var(--color-acc)" : "transparent",
                  textAlign: "left",
                  fontFamily: "inherit",
                  color: "inherit",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 14,
                    flexShrink: 0,
                    background: item.iconBg,
                  }}
                >
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: "11.5px", fontWeight: 600 }}>{item.name}</div>
                  <div
                    style={{
                      fontSize: 9,
                      color: "var(--color-t-3)",
                      fontFamily: "'JetBrains Mono', var(--mono), monospace",
                    }}
                  >
                    {item.providers}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
