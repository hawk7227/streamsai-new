"use client";

import { useState } from "react";

type EditorTab = "overlays" | "captions" | "transitions" | "filters" | "audio" | "motion" | "aihelper";

const S = {
  bg2: "var(--color-bg-2)",
  bg3: "var(--color-bg-3)",
  bg4: "var(--color-bg-4)",
  bdr: "var(--color-bdr)",
  bdr2: "var(--color-bdr-2)",
  t1: "var(--color-t-1)",
  t2: "var(--color-t-2)",
  t3: "var(--color-t-3)",
  t4: "var(--color-t-4)",
  acc: "var(--color-acc)",
  accg: "var(--color-acc-glow)",
  blu: "var(--color-blu)",
  pur: "#8b5cf6",
  amb: "#f59e0b",
  red: "#ef4444",
  grn: "#10b981",
  mono: "'JetBrains Mono', var(--mono), monospace",
};

const TABS: { key: EditorTab; label: string }[] = [
  { key: "overlays", label: "Overlays" },
  { key: "captions", label: "Captions" },
  { key: "transitions", label: "Transitions" },
  { key: "filters", label: "Filters" },
  { key: "audio", label: "Audio" },
  { key: "motion", label: "Motion" },
  { key: "aihelper", label: "AI Helper" },
];

const TIMELINE = [
  { label: "🎬 Video", clips: [
    { name: "Intro", w: "25%", bg: "rgba(136,85,255,.2)", c: S.pur },
    { name: "Hero Shot", w: "50%", bg: "rgba(0,136,255,.2)", c: S.blu },
    { name: "Outro", w: "25%", bg: "rgba(255,170,0,.15)", c: S.amb },
  ]},
  { label: "🎙️ Voice", clips: [
    { name: "", w: "15%", bg: "transparent", c: "transparent" },
    { name: "Voiceover", w: "70%", bg: "rgba(0,255,136,.1)", c: S.acc },
  ]},
  { label: "🎵 Music", clips: [
    { name: "BGM — Corporate Upbeat", w: "100%", bg: "rgba(255,68,85,.08)", c: S.red },
  ]},
  { label: "📝 Captions", clips: [
    { name: "", w: "15%", bg: "transparent", c: "transparent" },
    { name: "Cap 1", w: "20%", bg: "rgba(255,255,255,.04)", c: S.t3 },
    { name: "", w: "3%", bg: "transparent", c: "transparent" },
    { name: "Cap 2", w: "25%", bg: "rgba(255,255,255,.04)", c: S.t3 },
    { name: "", w: "3%", bg: "transparent", c: "transparent" },
    { name: "Cap 3", w: "15%", bg: "rgba(255,255,255,.04)", c: S.t3 },
  ]},
  { label: "✨ Effects", clips: [
    { name: "Fade In", w: "15%", bg: "rgba(255,170,0,.06)", c: S.amb },
    { name: "", w: "55%", bg: "transparent", c: "transparent" },
    { name: "Glitch", w: "8%", bg: "rgba(136,85,255,.08)", c: S.pur },
    { name: "", w: "7%", bg: "transparent", c: "transparent" },
    { name: "Fade Out", w: "15%", bg: "rgba(255,170,0,.06)", c: S.amb },
  ]},
];

// ── Tiny grid card helper ──
function Card({ icon, name, desc }: { icon: string; name: string; desc: string }) {
  return (
    <div style={{ padding: 7, background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: 8, cursor: "pointer", transition: "border 150ms" }}>
      <div style={{ fontSize: 11 }}>{icon}</div>
      <div style={{ fontSize: 9.5, fontWeight: 600 }}>{name}</div>
      <div style={{ fontSize: 7.5, color: S.t3 }}>{desc}</div>
    </div>
  );
}

function Chip({ label, active, color }: { label: string; active?: boolean; color?: string }) {
  return (
    <span style={{
      padding: "4px 8px", borderRadius: 4, fontSize: 8, fontWeight: active ? 600 : 400, cursor: "pointer",
      background: active ? S.accg : S.bg3,
      border: `1px solid ${active ? "rgba(0,255,136,.15)" : S.bdr}`,
      color: color ?? (active ? S.acc : S.t2),
    }}>{label}</span>
  );
}

export default function EditorPage() {
  const [tab, setTab] = useState<EditorTab>("overlays");

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px", marginBottom: 2 }}>✂️ Video Editor</h1>
          <p style={{ fontSize: 11.5, color: S.t2 }}>Overlays, captions, transitions, filters, color grading — shared across both pipelines</p>
        </div>
        <button style={{
          padding: "8px 16px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer",
          background: `linear-gradient(135deg, ${S.acc}, ${S.pur})`, color: "#fff", border: "none",
        }}>▶ Export</button>
      </div>

      {/* Preview Canvas */}
      <div style={{
        height: 220, background: S.bg2, border: `1px solid ${S.bdr}`, borderRadius: 12,
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, position: "relative",
      }}>
        <div style={{ fontSize: 48, opacity: 0.2 }}>▶</div>
        <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8, alignItems: "center", fontSize: 10, color: S.t3 }}>
          <button style={{ fontSize: 9, padding: "3px 8px", borderRadius: 4, border: `1px solid ${S.bdr}`, background: S.bg4, color: S.t2, cursor: "pointer" }}>⏮</button>
          <button style={{ fontSize: 9, padding: "3px 10px", borderRadius: 4, background: S.acc, color: "#000", border: "none", cursor: "pointer" }}>▶</button>
          <button style={{ fontSize: 9, padding: "3px 8px", borderRadius: 4, border: `1px solid ${S.bdr}`, background: S.bg4, color: S.t2, cursor: "pointer" }}>⏭</button>
          <span style={{ fontFamily: S.mono, fontSize: 9 }}>00:04.12 / 00:15.00</span>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 7, color: S.t3, marginBottom: 4, paddingLeft: 60 }}>
          {["0:00","0:03","0:06","0:09","0:12","0:15"].map(t => <span key={t}>{t}</span>)}
        </div>
        {TIMELINE.map(track => (
          <div key={track.label} style={{ display: "flex", alignItems: "center", marginBottom: 3 }}>
            <div style={{ width: 60, fontSize: 8, fontWeight: 600, color: S.t3, flexShrink: 0 }}>{track.label}</div>
            <div style={{ flex: 1, display: "flex", height: 24, borderRadius: 3, overflow: "hidden" }}>
              {track.clips.map((clip, i) => (
                <div key={i} style={{
                  width: clip.w, background: clip.bg, color: clip.c,
                  fontSize: 7, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 2, margin: "0 1px",
                }}>{clip.name}</div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Tab Bar */}
      <div style={{ display: "inline-flex", background: S.bg3, borderRadius: 7, padding: 2, gap: 1, marginBottom: 12 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "6px 13px", borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: "pointer",
              color: tab === t.key ? "#000" : S.t3,
              background: tab === t.key ? S.acc : "transparent",
              border: "none", fontFamily: "inherit", transition: "150ms",
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* ══ PANELS ══ */}
      {tab === "overlays" && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: S.t3, marginBottom: 6 }}>TEXT OVERLAYS</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 5, marginBottom: 12 }}>
            <Card icon="📝" name="Title Card" desc="Static titles + lower thirds" />
            <Card icon="💬" name="Kinetic Type" desc="Words animate: scale, slide, fade, bounce" />
            <Card icon="⏱️" name="Countdown Timer" desc="Animated countdown + progress bars" />
            <Card icon="📢" name="CTA Banner" desc="Animated entry/exit call-to-action" />
            <Card icon="💎" name="Quote Card" desc="Configurable attribution styling" />
            <Card icon="🏷️" name="End Card" desc="Subscribe, like, follow CTAs" />
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: S.t3, marginBottom: 6 }}>IMAGE & GRAPHIC OVERLAYS</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 5, marginBottom: 12 }}>
            <Card icon="🖼️" name="Logo Watermark" desc="Corner-pinned, opacity, scalable" />
            <Card icon="😀" name="Sticker / Emoji" desc="Bounce-in animation" />
            <Card icon="🔲" name="Frame / Letterbox" desc="Borders, vignette frames" />
            <Card icon="💥" name="Action FX" desc="Explosions, flashes, energy bursts" />
            <Card icon="📊" name="HUD Elements" desc="Progress rings, stat counters" />
            <Card icon="🔀" name="Split Screen" desc="2-up, 3-up, picture-in-picture" />
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: S.t3, marginBottom: 6 }}>FILM & TEXTURE OVERLAYS <span style={{ fontSize: 8, fontWeight: 400 }}>(FFmpeg blend modes)</span></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 5, marginBottom: 8 }}>
            <Card icon="🎞️" name="Film Grain" desc="8mm / 16mm / 35mm density" />
            <Card icon="✨" name="Light Leaks" desc="Lens flares + leaks" />
            <Card icon="🧹" name="Dust & Scratch" desc="Vintage film look" />
            <Card icon="📺" name="VHS Retro" desc="Noise, tracking, scan lines" />
            <Card icon="💫" name="Bokeh / Particles" desc="Soft light particle overlays" />
            <Card icon="🌧️" name="Atmospheric" desc="Rain, snow, fog layers" />
          </div>
          <div style={{ padding: "6px 8px", background: S.bg3, borderRadius: 5, fontSize: 8, color: S.t4 }}>
            Blend modes: multiply, screen, overlay, softlight, hardlight, addition, difference, exclusion, burn, dodge, freeze, glow, pinlight, reflect, vividlight
          </div>
        </div>
      )}

      {tab === "captions" && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: S.t3, marginBottom: 6 }}>CAPTION ANIMATION STYLES <span style={{ fontSize: 8, fontWeight: 400 }}>(Whisper word-level timestamps)</span></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 5, marginBottom: 12 }}>
            <Card icon="🔴" name="Word Highlight" desc="Active word changes color" />
            <Card icon="🎤" name="Karaoke" desc="Fill sweeps across each word" />
            <Card icon="⌨️" name="Typewriter" desc="Characters appear one by one" />
            <Card icon="🏀" name="Bounce" desc="Words bounce in with spring physics" />
            <Card icon="🌫️" name="Fade" desc="Words fade in/out per timestamp" />
            <Card icon="➡️" name="Slide" desc="Words slide in from edge" />
            <Card icon="💥" name="Pop" desc="Words pop/scale in with emphasis" />
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: S.t3, marginBottom: 6 }}>CAPTION CUSTOMIZATION</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label style={{ display: "block", fontSize: 9.5, fontWeight: 600, color: S.t3, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Font Family</label>
              <select style={{ width: "100%", padding: "6px 10px", background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: 7, color: S.t1, fontSize: 10, marginBottom: 8 }}>
                <option>Outfit</option><option>Inter</option><option>Montserrat</option><option>JetBrains Mono</option>
              </select>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 9.5, fontWeight: 600, color: S.t3, marginBottom: 4 }}>Size</label>
                  <input type="number" defaultValue={24} style={{ width: "100%", padding: 6, background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: 7, color: S.t1, fontSize: 10 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 9.5, fontWeight: 600, color: S.t3, marginBottom: 4 }}>Weight</label>
                  <select style={{ width: "100%", padding: 6, background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: 7, color: S.t1, fontSize: 10 }}>
                    <option>400</option><option>500</option><option>600</option><option selected>700</option><option>800</option>
                  </select>
                </div>
              </div>
              <label style={{ display: "block", fontSize: 9.5, fontWeight: 600, color: S.t3, marginBottom: 4 }}>Color</label>
              <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                {["#ffffff","#00ff88","#ffcc00","#ff4455","#0088ff"].map(c => (
                  <div key={c} style={{ width: 24, height: 24, borderRadius: 4, background: c, cursor: "pointer", border: c === "#ffffff" ? `2px solid ${S.acc}` : "none" }} />
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 9.5, fontWeight: 600, color: S.t3, marginBottom: 4 }}>Position</label>
              <select style={{ width: "100%", padding: 6, background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: 7, color: S.t1, fontSize: 10, marginBottom: 8 }}>
                <option>Bottom Center</option><option>Top Center</option><option>Center</option><option>Custom Coordinates</option>
              </select>
              <label style={{ display: "block", fontSize: 9.5, fontWeight: 600, color: S.t3, marginBottom: 4 }}>Per-Word Color Override</label>
              <div style={{ display: "flex", gap: 4, marginBottom: 8, alignItems: "center" }}>
                <input type="text" defaultValue="AI, future, power" style={{ flex: 1, padding: 6, background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: 7, color: S.t1, fontSize: 10 }} />
                <div style={{ width: 24, height: 24, borderRadius: 4, background: "#00ff88", cursor: "pointer" }} />
              </div>
              <label style={{ display: "block", fontSize: 9.5, fontWeight: 600, color: S.t3, marginBottom: 4 }}>Line Settings</label>
              <div style={{ display: "flex", gap: 4, fontSize: 9, color: S.t3 }}>
                <span style={{ padding: "3px 6px", background: S.bg3, borderRadius: 3 }}>Max 6 words/line</span>
                <span style={{ padding: "3px 6px", background: S.bg3, borderRadius: 3 }}>Max 3s/line</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "transitions" && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: S.t3, marginBottom: 6 }}>TRANSITIONS <span style={{ fontSize: 8, fontWeight: 400 }}>(FFmpeg xfade — ~50 types, Remotion components)</span></div>
          <div style={{ fontSize: 9, fontWeight: 600, color: S.acc, marginBottom: 4 }}>FADE & DISSOLVE</div>
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 8 }}>
            <Chip label="fade" active /><Chip label="fadeblack" /><Chip label="fadewhite" /><Chip label="fadegrays" /><Chip label="dissolve" /><Chip label="pixelize" />
          </div>
          <div style={{ fontSize: 9, fontWeight: 600, color: S.blu, marginBottom: 4 }}>WIPE</div>
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 8 }}>
            <Chip label="wipeleft" /><Chip label="wiperight" /><Chip label="wipeup" /><Chip label="wipedown" /><Chip label="wipetl" /><Chip label="wipetr" /><Chip label="wipebl" /><Chip label="wipebr" />
          </div>
          <div style={{ fontSize: 9, fontWeight: 600, color: S.pur, marginBottom: 4 }}>SLIDE</div>
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 8 }}>
            <Chip label="slideleft" /><Chip label="slideright" /><Chip label="slideup" /><Chip label="slidedown" /><Chip label="smoothleft" /><Chip label="smoothright" /><Chip label="smoothup" /><Chip label="smoothdown" />
          </div>
          <div style={{ fontSize: 9, fontWeight: 600, color: S.amb, marginBottom: 4 }}>GEOMETRIC</div>
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 8 }}>
            <Chip label="circlecrop" /><Chip label="circleopen" /><Chip label="circleclose" /><Chip label="rectcrop" /><Chip label="diagtl" /><Chip label="diagtr" /><Chip label="diagbl" /><Chip label="diagbr" /><Chip label="radial" /><Chip label="zoomin" />
          </div>
          <div style={{ fontSize: 9, fontWeight: 600, color: S.red, marginBottom: 4 }}>CREATIVE</div>
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 8 }}>
            <Chip label="squeezeh" /><Chip label="squeezev" /><Chip label="hlwind" /><Chip label="hrwind" /><Chip label="vuwind" /><Chip label="vdwind" /><Chip label="coverleft" /><Chip label="coverright" /><Chip label="coverup" /><Chip label="coverdown" /><Chip label="revealright" /><Chip label="revealleft" />
          </div>
          <div style={{ padding: "6px 8px", background: S.bg3, borderRadius: 5, fontSize: 8, color: S.t4, marginTop: 4 }}>
            Duration: 0.5–2.0s configurable per transition. All transitions GPU-accelerated via FFmpeg xfade or Remotion Spring().
          </div>
        </div>
      )}

      {tab === "filters" && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: S.t3, marginBottom: 6 }}>BASIC ADJUSTMENTS <span style={{ fontSize: 8, fontWeight: 400 }}>(FFmpeg eq/colorbalance)</span></div>
          <div style={{ marginBottom: 12, padding: 10, background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: 8 }}>
            {["Brightness","Contrast","Saturation","Gamma","Hue Rotation","Temperature","Exposure"].map(label => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <label style={{ minWidth: 80, margin: 0, fontSize: 8 }}>{label}</label>
                <input type="range" min={-100} max={100} defaultValue={0} style={{ flex: 1, accentColor: S.acc, height: 3 }} />
                <span style={{ fontSize: 8, color: S.acc, fontFamily: S.mono, width: 28, textAlign: "right" }}>0</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: S.t3, marginBottom: 6 }}>3-WAY COLOR WHEELS</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 12 }}>
            {["Shadows","Midtones","Highlights"].map(label => (
              <div key={label} style={{ textAlign: "center", padding: 10, background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: 8 }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: "conic-gradient(red,yellow,lime,aqua,blue,magenta,red)", opacity: 0.5, margin: "0 auto 4px" }} />
                <div style={{ fontSize: 8.5, fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: S.t3, marginBottom: 6 }}>LUT PRESETS <span style={{ fontSize: 8, fontWeight: 400 }}>(FFmpeg lut3d — .cube files)</span></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(80px,1fr))", gap: 4, marginBottom: 8 }}>
            {[
              { name: "Teal Orange", bg: "linear-gradient(135deg,#1a4a5a,#5a3a1a)", active: true },
              { name: "Bleach Bypass", bg: "linear-gradient(135deg,#3a3a3a,#1a1a1a)" },
              { name: "Sepia", bg: "linear-gradient(135deg,#4a3a2a,#2a1a0a)" },
              { name: "Faded Film", bg: "linear-gradient(135deg,#5a4a3a,#3a2a1a)" },
              { name: "Kodak Emu", bg: "linear-gradient(135deg,#3a5a3a,#1a2a1a)" },
              { name: "Fuji Emu", bg: "linear-gradient(135deg,#5a5a6a,#2a2a3a)" },
              { name: "Clean Bright", bg: "linear-gradient(135deg,#f0f0f0,#d0d0d0)" },
              { name: "Moody", bg: "linear-gradient(135deg,#2a2a3a,#0a0a1a)" },
              { name: "TikTok", bg: "linear-gradient(135deg,#ff6688,#ffaa44)" },
              { name: "Instagram", bg: "linear-gradient(135deg,#ffcc88,#ff8844)" },
              { name: "YouTube", bg: "linear-gradient(135deg,#4488ff,#2244aa)" },
              { name: "High Contrast", bg: "linear-gradient(135deg,#3a4a5a,#1a2a3a)" },
            ].map(lut => (
              <div key={lut.name} style={{ padding: 4, background: S.bg3, border: `1px solid ${lut.active ? S.acc : S.bdr}`, borderRadius: 5, textAlign: "center", cursor: "pointer" }}>
                <div style={{ height: 24, borderRadius: 3, marginBottom: 2, background: lut.bg }} />
                <div style={{ fontSize: 7.5, fontWeight: 600 }}>{lut.name}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: S.t3, marginBottom: 6 }}>STYLIZED EFFECTS</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(110px,1fr))", gap: 4 }}>
            <Card icon="⬛" name="B&W" desc="Full / selective desat" />
            <Card icon="📺" name="VHS Retro" desc="rgbashift + noise + bleed" />
            <Card icon="⚡" name="Glitch" desc="RGB shift + displacement" />
            <Card icon="🔅" name="Vignette" desc="Darkened edges" />
            <Card icon="🔍" name="Sharpen" desc="Unsharp mask filter" />
            <Card icon="🌫️" name="Soft Focus" desc="Gaussian / box / motion blur" />
          </div>
        </div>
      )}

      {tab === "audio" && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: S.t3, marginBottom: 6 }}>TRACK MIXER</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 12 }}>
            {[
              { label: "🎙️ Voiceover", vol: 85, color: S.grn },
              { label: "🎵 Background Music", vol: 30, color: S.blu },
              { label: "🔊 Sound Effects", vol: 60, color: S.pur },
            ].map(ch => (
              <div key={ch.label} style={{ padding: 10, background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: 8 }}>
                <div style={{ fontSize: 9.5, fontWeight: 600, marginBottom: 6 }}>{ch.label}</div>
                <div style={{ height: 4, background: S.bg4, borderRadius: 2, overflow: "hidden", marginBottom: 4 }}>
                  <div style={{ height: "100%", width: `${ch.vol}%`, background: ch.color, borderRadius: 2 }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: S.t3 }}>
                  <span>{ch.vol}%</span>
                  <span style={{ cursor: "pointer" }}>🔇 Mute</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: S.t3, marginBottom: 6 }}>AUTO DUCKING</div>
          <div style={{ padding: 10, background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: 8, marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 6, fontSize: 8, color: S.t2, marginBottom: 4 }}>
              <span>When voiceover active → reduce music to</span>
              <span style={{ color: S.acc, fontFamily: S.mono, fontWeight: 700 }}>15%</span>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <Chip label="Fade: 500ms" active /><Chip label="Fade: 1s" /><Chip label="Fade: 2s" />
            </div>
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: S.t3, marginBottom: 6 }}>AUDIO EFFECTS</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 5 }}>
            <Card icon="🔊" name="Normalize" desc="Consistent loudness (LUFS)" />
            <Card icon="🎛️" name="EQ" desc="Bass/mid/treble bands" />
            <Card icon="🔇" name="Noise Reduction" desc="Remove bg noise" />
            <Card icon="🎚️" name="Compressor" desc="Dynamic range control" />
            <Card icon="🏔️" name="Reverb" desc="Room, hall, cathedral" />
            <Card icon="🔈" name="De-esser" desc="Reduce sibilance" />
          </div>
        </div>
      )}

      {tab === "motion" && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: S.t3, marginBottom: 6 }}>CAMERA MOTION <span style={{ fontSize: 8, fontWeight: 400 }}>(Remotion transforms + FFmpeg zoompan)</span></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 5, marginBottom: 12 }}>
            <Card icon="⬅️" name="Pan Left" desc="Slow horizontal drift left" />
            <Card icon="➡️" name="Pan Right" desc="Slow horizontal drift right" />
            <Card icon="⬆️" name="Tilt Up" desc="Vertical camera lift" />
            <Card icon="⬇️" name="Tilt Down" desc="Vertical camera drop" />
            <Card icon="🔍" name="Zoom In" desc="Smooth scale 1.0→1.3x" />
            <Card icon="🔎" name="Zoom Out" desc="Scale 1.3x→1.0" />
            <Card icon="🔄" name="Orbit" desc="Circular around center" />
            <Card icon="📸" name="Ken Burns" desc="Classic zoom + pan combo" />
            <Card icon="🤝" name="Stabilize" desc="VidStab post-process" />
            <Card icon="🎯" name="Follow Subject" desc="AI track + reframe" />
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: S.t3, marginBottom: 6 }}>KEYFRAME EASING</div>
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            <Chip label="linear" /><Chip label="ease-in" active /><Chip label="ease-out" /><Chip label="ease-in-out" /><Chip label="spring()" /><Chip label="cubic-bezier" />
          </div>
        </div>
      )}

      {tab === "aihelper" && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: S.t3, marginBottom: 6 }}>AI EDITING ASSISTANT</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              type="text"
              defaultValue="Make this look more cinematic and professional"
              style={{ flex: 1, padding: "9px 11px", background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: 7, color: S.t1, fontSize: 12 }}
            />
            <button style={{
              padding: "8px 16px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer",
              background: `linear-gradient(135deg, ${S.acc}, ${S.pur})`, color: "#fff", border: "none",
            }}>✨ Suggest</button>
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: S.t3, marginBottom: 6 }}>QUICK ACTIONS</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 5 }}>
            <Card icon="🎬" name="Auto Edit" desc="AI picks cuts, transitions, and pacing" />
            <Card icon="📝" name="Auto Captions" desc="Whisper transcribe → animated captions" />
            <Card icon="🎨" name="Auto Grade" desc="Match reference image color" />
            <Card icon="🎵" name="Auto Music" desc="Pick BGM that fits the mood + auto-duck" />
            <Card icon="✂️" name="Smart Trim" desc="Remove silence and dead air" />
            <Card icon="📐" name="Auto Reframe" desc="16:9 → 9:16 with subject tracking" />
          </div>
        </div>
      )}
    </div>
  );
}
