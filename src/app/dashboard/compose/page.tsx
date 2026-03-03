"use client";

import { useState } from "react";

type Template = { id: string; icon: string; name: string; spec: string };

const TEMPLATES: Template[] = [
  { id: "tiktok_reel", icon: "\u{1F4F1}", name: "TikTok Reel", spec: "9:16 \u2022 15\u201360s" },
  { id: "yt_intro", icon: "\u25B6\uFE0F", name: "YouTube Intro", spec: "16:9 \u2022 5\u201310s" },
  { id: "ig_story", icon: "\u{1F4F8}", name: "IG Story", spec: "9:16 \u2022 15s" },
  { id: "product_demo", icon: "\u{1F6D2}", name: "Product Demo", spec: "16:9 \u2022 30\u2013120s" },
  { id: "data_visual", icon: "\u{1F4CA}", name: "Data Visual", spec: "16:9 \u2022 Custom" },
  { id: "tutorial", icon: "\u{1F393}", name: "Tutorial", spec: "16:9 \u2022 Custom" },
];

interface SceneConfig {
  id: string;
  name: string;
  timeRange: string;
  chips: string[];
}

const DEFAULT_SCENES: SceneConfig[] = [
  { id: "s1", name: "Intro", timeRange: "0:00\u20130:03", chips: ["Logo zoom-in", "Fade from black", "BGM: fade in"] },
  { id: "s2", name: "Hero", timeRange: "0:03\u20130:12", chips: ["hero-shot.mp4", "Ken Burns zoom", "Caption overlay"] },
];

export default function ComposePage() {
  const [selectedTemplate, setSelectedTemplate] = useState("tiktok_reel");
  const [scenes, setScenes] = useState(DEFAULT_SCENES);
  const [assets, setAssets] = useState(["hero-shot.mp4 (4.2MB)", "logo.png (120KB)", "bgm.mp3 (2.1MB)"]);

  const addScene = () => {
    const idx = scenes.length + 1;
    setScenes([...scenes, { id: `s${idx}`, name: `Scene ${idx}`, timeRange: "0:00\u20130:00", chips: [] }]);
  };

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 4 }}>{"\u{1F3AC}"} Composition Studio</h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Programmatic video composition — upload assets, build from templates, Remotion rendering</p>
        </div>
      </div>

      {/* Template Grid */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>Template</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTemplate(t.id)}
              style={{
                padding: 14, borderRadius: 10, textAlign: "center", cursor: "pointer",
                background: selectedTemplate === t.id ? "rgba(99,102,241,0.08)" : "var(--bg-secondary)",
                border: `1px solid ${selectedTemplate === t.id ? "rgba(99,102,241,0.3)" : "var(--border)"}`,
                transition: "all 0.15s", fontFamily: "inherit",
              }}
            >
              <div style={{ fontSize: "1.2rem", marginBottom: 4 }}>{t.icon}</div>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>{t.name}</div>
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{t.spec}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Asset Upload */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>Assets</div>
        <div style={{
          padding: 24, background: "var(--bg-secondary)", border: "1px dashed var(--border)",
          borderRadius: 12, textAlign: "center", cursor: "pointer", marginBottom: 12,
        }}>
          <div style={{ fontSize: "1.5rem", opacity: 0.3, marginBottom: 4 }}>{"\u{1F4C1}"}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Drop files or click to upload</div>
          <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", marginTop: 4 }}>Video, images, audio — up to 500MB</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {assets.map((a, i) => (
            <span key={i} style={{
              padding: "4px 10px", borderRadius: 6, fontSize: "0.7rem", fontWeight: 600,
              background: i === 0 ? "rgba(16,185,129,0.08)" : i === 1 ? "rgba(0,136,255,0.08)" : "rgba(136,85,255,0.08)",
              color: i === 0 ? "#10b981" : i === 1 ? "#0088ff" : "#8855ff",
            }}>
              {a}
            </span>
          ))}
        </div>
      </div>

      {/* Scene Configuration */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>Scene Configuration</div>
        {scenes.map((scene) => (
          <div key={scene.id} style={{
            padding: 14, background: "var(--bg-secondary)", border: "1px solid var(--border)",
            borderRadius: 10, marginBottom: 10,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>{scene.name}</span>
              <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: "0.65rem", background: "var(--bg-tertiary)", color: "var(--text-muted)" }}>{scene.timeRange}</span>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {scene.chips.map((chip, i) => (
                <span key={i} style={{ padding: "3px 8px", borderRadius: 4, fontSize: "0.65rem", background: "var(--bg-tertiary)", color: "var(--text-muted)" }}>
                  {chip}
                </span>
              ))}
            </div>
          </div>
        ))}
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{
            padding: "10px 24px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", border: "none", cursor: "pointer",
          }}>
            {"\u25B6"} Render
          </button>
          <button onClick={addScene} style={{
            padding: "10px 24px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600,
            background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)", cursor: "pointer",
          }}>
            + Add Scene
          </button>
        </div>
      </div>
    </div>
  );
}
