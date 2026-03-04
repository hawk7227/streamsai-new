"use client";

import { useState } from "react";

const S = {
  bg2: "var(--color-bg-2)", bg3: "var(--color-bg-3)", bg4: "var(--color-bg-4)",
  bdr: "var(--color-bdr)", t1: "var(--color-t-1)", t2: "var(--color-t-2)", t3: "var(--color-t-3)",
  acc: "var(--color-acc)", mono: "'JetBrains Mono', var(--mono), monospace",
};

const SCENES = [
  { id: "S1", name: "Hook", time: "0:00-0:03" },
  { id: "S2", name: "Problem", time: "0:03-0:08" },
  { id: "S3", name: "Solution", time: "0:08-0:18" },
  { id: "S4", name: "Social", time: "0:18-0:24" },
  { id: "S5", name: "CTA", time: "0:24-0:30" },
];

const SCRIPT = `SCENE 1 - HOOK (0:00-0:03)
[WIDE] Creator at blank screen.
VO: Creating video shouldn't take hours.
---
SCENE 2 - PROBLEM (0:03-0:08)
[MONTAGE] Traditional editing timeline.
VO: Traditional tools slow you down.
---
SCENE 3 - SOLUTION (0:08-0:18)
[SCREEN REC] StreamsAI dashboard. Prompt, video generates.
VO: Professional video from a single prompt.
---
SCENE 4 - SOCIAL (0:18-0:24)
[SPLIT] Posting to Instagram, TikTok, YouTube.
VO: Post everywhere. Automatically.
---
SCENE 5 - CTA (0:24-0:30)
[LOGO] StreamsAI. VO: Start creating. For free.`;

const btn = (primary?: boolean) => ({
  padding: "5px 12px", borderRadius: 5, fontSize: 9, fontWeight: 700 as const, cursor: "pointer" as const,
  background: primary ? S.acc : S.bg4, color: primary ? "#000" : S.t2,
  border: primary ? "none" : `1px solid ${S.bdr}`, fontFamily: "inherit",
});

export default function ScriptPage() {
  const [brief, setBrief] = useState("30s product launch for StreamsAI. Show platform generating content. End with CTA.");
  const [script, setScript] = useState(SCRIPT);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px", marginBottom: 2 }}>📝 Script Editor</h1>
          <p style={{ fontSize: 11.5, color: S.t2 }}>AI script generation to storyboard to video. End-to-end pipeline.</p>
        </div>
        <button style={{ ...btn(true), padding: "8px 16px", fontSize: 11 }}>Generate Storyboard</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 230px", gap: 12 }}>
        {/* Left — Editor */}
        <div>
          <label style={{ display: "block", fontSize: 9.5, fontWeight: 600, color: S.t3, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Brief</label>
          <textarea
            rows={2}
            value={brief}
            onChange={e => setBrief(e.target.value)}
            style={{ width: "100%", padding: "7px 10px", background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: 7, color: S.t1, fontSize: 10, resize: "vertical", fontFamily: "inherit", marginBottom: 8 }}
          />
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <button style={btn(true)}>AI Generate</button>
            <button style={btn()}>Templates</button>
            <button style={btn()}>Import</button>
          </div>
          <label style={{ display: "block", fontSize: 9.5, fontWeight: 600, color: S.t3, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Script (split on ---)</label>
          <textarea
            rows={12}
            value={script}
            onChange={e => setScript(e.target.value)}
            style={{ width: "100%", padding: "7px 10px", background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: 7, color: S.t1, fontSize: 10, lineHeight: 1.7, resize: "vertical", fontFamily: S.mono }}
          />
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <button style={btn()}>Auto Captions</button>
            <button style={btn()}>B-Roll</button>
            <button style={btn()}>Translate</button>
          </div>
        </div>

        {/* Right — Scenes + Settings */}
        <div>
          <label style={{ display: "block", fontSize: 9.5, fontWeight: 600, color: S.t3, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Scenes</label>
          {SCENES.map(s => (
            <div key={s.id} style={{ padding: 5, background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: 5, marginBottom: 4 }}>
              <div style={{ fontSize: 9, fontWeight: 600 }}>{s.id} {s.name}</div>
              <div style={{ fontSize: 7, color: S.t3 }}>{s.time}</div>
            </div>
          ))}

          <label style={{ display: "block", fontSize: 9.5, fontWeight: 600, color: S.t3, marginBottom: 4, marginTop: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>Settings</label>
          <div style={{ fontSize: 8, color: S.t3, display: "flex", flexDirection: "column", gap: 3 }}>
            {[
              { label: "Lang", options: ["English", "Spanish", "French", "Japanese"] },
              { label: "Voice", options: ["Rachel", "Josh", "Bella"] },
              { label: "B-Roll", options: ["AI Gen", "Stock", "Upload"] },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "3px 5px", background: S.bg3, borderRadius: 3, alignItems: "center" }}>
                <span>{row.label}</span>
                <select style={{ width: 60, padding: 2, fontSize: 8, background: S.bg4, border: `1px solid ${S.bdr}`, borderRadius: 3, color: S.t1 }}>
                  {row.options.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 5px", background: S.bg3, borderRadius: 3 }}>
              <span>Captions</span><span style={{ color: S.acc }}>On</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
