"use client";

import { useState } from "react";

const S = {
  bg2: "var(--color-bg-2)", bg3: "var(--color-bg-3)", bg4: "var(--color-bg-4)",
  bdr: "var(--color-bdr)", bdr2: "var(--color-bdr-2)",
  t1: "var(--color-t-1)", t2: "var(--color-t-2)", t3: "var(--color-t-3)", t4: "var(--color-t-4)",
  acc: "var(--color-acc)", blu: "var(--color-blu)", pur: "#8b5cf6",
  r1: 8, r2: 12, mono: "'JetBrains Mono', var(--mono), monospace",
};

const TEMPLATES = [
  { id: "tiktok", icon: "📱", name: "TikTok Reel", spec: "9:16 • 15-60s" },
  { id: "yt_intro", icon: "▶️", name: "YouTube Intro", spec: "16:9 • 5-10s" },
  { id: "ig_story", icon: "📸", name: "IG Story", spec: "9:16 • 15s" },
  { id: "product", icon: "🛒", name: "Product Demo", spec: "16:9 • 30-120s" },
  { id: "data", icon: "📊", name: "Data Visual", spec: "16:9 • Custom" },
  { id: "tutorial", icon: "🎓", name: "Tutorial", spec: "16:9 • Custom" },
];

interface Scene { id: string; name: string; time: string; chips: string[] }

const INITIAL_SCENES: Scene[] = [
  { id: "s1", name: "Scene 1 — Intro", time: "0:00–0:03", chips: ["Logo zoom-in", "Fade from black", "BGM: fade in"] },
  { id: "s2", name: "Scene 2 — Hero", time: "0:03–0:12", chips: ["hero-shot.mp4", "Ken Burns zoom", "Caption overlay"] },
];

export default function ComposePage() {
  const [template, setTemplate] = useState("tiktok");
  const [scenes, setScenes] = useState(INITIAL_SCENES);

  const addScene = () => {
    const n = scenes.length + 1;
    setScenes([...scenes, { id: `s${n}`, name: `Scene ${n}`, time: "0:00–0:00", chips: [] }]);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px", marginBottom: 2 }}>🎬 Composition Studio</h1>
          <p style={{ fontSize: 11.5, color: S.t2 }}>Programmatic video composition — upload assets, build from templates, Remotion rendering</p>
        </div>
      </div>

      {/* Template Grid */}
      <label style={{ display: "block", fontSize: 9.5, fontWeight: 600, color: S.t3, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Template</label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 16 }}>
        {TEMPLATES.map(t => {
          const on = template === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTemplate(t.id)}
              style={{
                padding: 10, borderRadius: S.r1, textAlign: "center", cursor: "pointer",
                background: on ? "var(--color-acc-glow)" : S.bg3,
                border: `1px solid ${on ? S.acc : S.bdr}`,
                fontFamily: "inherit", color: "inherit", transition: "all 150ms",
              }}
            >
              <div style={{ fontSize: 16, marginBottom: 2 }}>{t.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: on ? S.acc : S.t1 }}>{t.name}</div>
              <div style={{ fontSize: 8.5, color: S.t3 }}>{t.spec}</div>
            </button>
          );
        })}
      </div>

      {/* Assets */}
      <label style={{ display: "block", fontSize: 9.5, fontWeight: 600, color: S.t3, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Assets</label>
      <div style={{
        padding: 16, background: S.bg3, border: `1px dashed ${S.bdr2}`, borderRadius: S.r2,
        textAlign: "center", marginBottom: 12, cursor: "pointer",
      }}>
        <div style={{ fontSize: 24, opacity: 0.4, marginBottom: 4 }}>📁</div>
        <div style={{ fontSize: 11, color: S.t3 }}>Drop files or click to upload</div>
        <div style={{ fontSize: 9, color: S.t4, marginTop: 2 }}>Video, images, audio — up to 500MB</div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        <span style={{ padding: "2px 7px", borderRadius: 4, fontSize: 8.5, fontWeight: 600, background: "var(--color-acc-glow)", color: S.acc, fontFamily: S.mono }}>hero-shot.mp4 (4.2MB)</span>
        <span style={{ padding: "2px 7px", borderRadius: 4, fontSize: 8.5, fontWeight: 600, background: "rgba(0,136,255,.08)", color: S.blu, fontFamily: S.mono }}>logo.png (120KB)</span>
        <span style={{ padding: "2px 7px", borderRadius: 4, fontSize: 8.5, fontWeight: 600, background: "rgba(136,85,255,.08)", color: S.pur, fontFamily: S.mono }}>bgm.mp3 (2.1MB)</span>
      </div>

      {/* Scene Configuration */}
      <label style={{ display: "block", fontSize: 9.5, fontWeight: 600, color: S.t3, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Scene Configuration</label>
      {scenes.map(scene => (
        <div key={scene.id} style={{
          background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: S.r1, padding: 10, marginBottom: 10,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600 }}>{scene.name}</span>
            <span style={{ padding: "2px 6px", borderRadius: 4, fontSize: 8.5, background: S.bg4, color: S.t3, fontFamily: S.mono }}>{scene.time}</span>
          </div>
          <div style={{ display: "flex", gap: 6, fontSize: 9, color: S.t3, flexWrap: "wrap" }}>
            {scene.chips.map((chip, i) => (
              <span key={i} style={{ padding: "2px 6px", background: S.bg4, borderRadius: 4 }}>{chip}</span>
            ))}
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button style={{
          padding: "8px 16px", borderRadius: S.r1, fontSize: 11, fontWeight: 600, cursor: "pointer",
          background: S.acc, color: "#000", border: "none", fontFamily: "inherit",
        }}>▶ Render</button>
        <button onClick={addScene} style={{
          padding: "8px 16px", borderRadius: S.r1, fontSize: 11, fontWeight: 600, cursor: "pointer",
          background: S.bg4, color: S.t2, border: `1px solid ${S.bdr}`, fontFamily: "inherit",
        }}>+ Add Scene</button>
      </div>
    </div>
  );
}
