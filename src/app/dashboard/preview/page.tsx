"use client";

import { useState } from "react";

const S = {
  bg2: "var(--color-bg-2)", bg3: "var(--color-bg-3)", bg4: "var(--color-bg-4)",
  bdr: "var(--color-bdr)", t1: "var(--color-t-1)", t2: "var(--color-t-2)", t3: "var(--color-t-3)",
  acc: "var(--color-acc)", accg: "var(--color-acc-glow)",
};

type Stage = "storyboard" | "animatic" | "single" | "final";
const STAGES: { key: Stage; num: string; label: string }[] = [
  { key: "storyboard", num: "1", label: "Storyboard" },
  { key: "animatic", num: "2", label: "Animatic" },
  { key: "single", num: "3", label: "Single Scene" },
  { key: "final", num: "4", label: "Final Render" },
];

const DEVICES = [
  { name: "TikTok", safe: "960×1390", topH: "8%", botH: "19%", rightW: "11%", bg: "linear-gradient(135deg,#0a1628,#1a0a2e)" },
  { name: "IG Reels", safe: "996×1400", topH: "11%", botH: "16%", rightW: "0%", bg: "linear-gradient(135deg,#1a0a2e,#2a0a1a)" },
  { name: "IG Stories", safe: "1080×1420", topH: "13%", botH: "13%", rightW: "0%", bg: "linear-gradient(135deg,#0a2a1a,#1a0a2e)" },
  { name: "YT Shorts", safe: "900×1160", topH: "20%", botH: "20%", rightW: "6%", bg: "linear-gradient(135deg,#2a1a0a,#0a1a2a)" },
  { name: "YT 16:9", safe: "1720×920", topH: "7%", botH: "7%", rightW: "5%", bg: "linear-gradient(135deg,#0a0a2a,#1a2a0a)", wide: true },
];

export default function PreviewPage() {
  const [stage, setStage] = useState<Stage>("storyboard");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px", marginBottom: 2 }}>👁️ Preview</h1>
          <p style={{ fontSize: 11.5, color: S.t2 }}>Platform safe zone preview across all target devices</p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={{ padding: "5px 12px", borderRadius: 5, fontSize: 9, fontWeight: 700, background: S.bg4, color: S.t2, border: `1px solid ${S.bdr}`, cursor: "pointer", fontFamily: "inherit" }}>Back to Studio</button>
          <button style={{ padding: "5px 12px", borderRadius: 5, fontSize: 9, fontWeight: 700, background: S.acc, color: "#000", border: "none", cursor: "pointer", fontFamily: "inherit" }}>View in Editor</button>
        </div>
      </div>

      {/* Stage Pills */}
      <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
        {STAGES.map(s => {
          const on = stage === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setStage(s.key)}
              style={{
                padding: "6px 14px", borderRadius: 6, fontSize: 9, fontWeight: 600, cursor: "pointer",
                background: on ? S.accg : S.bg3, color: on ? S.acc : S.t3,
                border: `1px solid ${on ? "rgba(0,255,136,.15)" : S.bdr}`,
                fontFamily: "inherit", transition: "150ms",
              }}
            >
              <span style={{ fontSize: 8, fontWeight: 700 }}>{s.num}</span> {s.label}
            </button>
          );
        })}
      </div>

      <div style={{ fontSize: 9, fontWeight: 600, color: S.t3, marginBottom: 6 }}>PLATFORM PREVIEWS <span style={{ fontWeight: 400 }}>Red = dead zone, Green = safe zone</span></div>

      {/* Phone Previews */}
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8, marginBottom: 12 }}>
        {DEVICES.map(d => (
          <div key={d.name} style={{ flexShrink: 0, textAlign: "center" }}>
            <div style={{ fontSize: 8, fontWeight: 600, marginBottom: 3 }}>{d.name}</div>
            <div style={{
              width: d.wide ? 120 : 72, height: d.wide ? 68 : 128,
              borderRadius: 6, overflow: "hidden", position: "relative",
              border: `1px solid ${S.bdr}`, background: d.bg,
            }}>
              {/* Play icon */}
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 14, opacity: 0.25 }}>▶</span>
              </div>
              {/* Top dead zone */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: d.topH, background: "rgba(255,50,50,.3)", borderBottom: "1px dashed rgba(255,50,50,.5)" }} />
              {/* Bottom dead zone */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: d.botH, background: "rgba(255,50,50,.3)", borderTop: "1px dashed rgba(255,50,50,.5)" }} />
              {/* Right dead zone */}
              {d.rightW !== "0%" && (
                <div style={{ position: "absolute", top: d.topH, right: 0, width: d.rightW, bottom: d.botH, background: "rgba(255,50,50,.15)", borderLeft: "1px dashed rgba(255,50,50,.4)" }} />
              )}
              {/* Safe zone */}
              <div style={{
                position: "absolute", top: d.topH, left: "5%", right: d.rightW === "0%" ? "0%" : d.rightW, bottom: d.botH,
                border: "1.5px solid rgba(0,255,136,.5)", borderRadius: 2,
              }} />
            </div>
            <div style={{ fontSize: 7, color: S.t3, marginTop: 2, fontFamily: "'JetBrains Mono', var(--mono), monospace" }}>{d.safe}</div>
          </div>
        ))}
      </div>

      {/* Storyboard Grid */}
      <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 5 }}>
        {stage === "storyboard" && "Storyboard Frames"}
        {stage === "animatic" && "Animatic Preview"}
        {stage === "single" && "Single Scene Test"}
        {stage === "final" && "Final Render"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{
            height: 90, background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
          }}>
            <span style={{ fontSize: 18, opacity: 0.2, marginBottom: 2 }}>🎬</span>
            <span style={{ fontSize: 8, color: S.t3, fontWeight: 600 }}>Scene {i}</span>
            <span style={{ fontSize: 7, color: S.t3 }}>0:{String((i-1)*6).padStart(2,"0")}–0:{String(i*6).padStart(2,"0")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
