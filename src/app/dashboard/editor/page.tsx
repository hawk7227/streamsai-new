"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PLATFORM_SAFE_ZONES, PLATFORM_IDS } from "@/lib/safe-zones";

type EditorTab = "overlays" | "captions" | "transitions" | "filters" | "audio" | "motion" | "ai_helper";

const TABS: { key: EditorTab; label: string; icon: string }[] = [
  { key: "overlays", label: "Overlays", icon: "\u2728" },
  { key: "captions", label: "Captions", icon: "\ud83d\udcdd" },
  { key: "transitions", label: "Transitions", icon: "\ud83c\udf00" },
  { key: "filters", label: "Filters", icon: "\ud83c\udfa8" },
  { key: "audio", label: "Audio", icon: "\ud83c\udfb5" },
  { key: "motion", label: "Motion", icon: "\ud83c\udfa5" },
  { key: "ai_helper", label: "AI Helper", icon: "\ud83e\udd16" },
];

const TIMELINE_TRACKS = [
  { label: "\ud83c\udfa5 Video", clips: [
    { name: "Intro", width: "25%", color: "rgba(99,102,241,0.2)", textColor: "#6366f1" },
    { name: "Hero Shot", width: "50%", color: "rgba(59,130,246,0.2)", textColor: "#3b82f6" },
    { name: "Outro", width: "25%", color: "rgba(245,158,11,0.15)", textColor: "#f59e0b" },
  ]},
  { label: "\ud83c\udf99\ufe0f Voice", clips: [
    { name: "", width: "15%", color: "transparent", textColor: "transparent" },
    { name: "Voiceover", width: "70%", color: "rgba(16,185,129,0.1)", textColor: "#10b981" },
  ]},
  { label: "\ud83c\udfb5 Music", clips: [
    { name: "BGM \u2014 Corporate", width: "100%", color: "rgba(239,68,68,0.08)", textColor: "#ef4444" },
  ]},
  { label: "\ud83d\udcdd Captions", clips: [
    { name: "", width: "15%", color: "transparent", textColor: "transparent" },
    { name: "Cap 1", width: "20%", color: "rgba(255,255,255,0.04)", textColor: "var(--text-muted)" },
    { name: "", width: "3%", color: "transparent", textColor: "transparent" },
    { name: "Cap 2", width: "25%", color: "rgba(255,255,255,0.04)", textColor: "var(--text-muted)" },
    { name: "", width: "3%", color: "transparent", textColor: "transparent" },
    { name: "Cap 3", width: "15%", color: "rgba(255,255,255,0.04)", textColor: "var(--text-muted)" },
  ]},
  { label: "\u2728 Effects", clips: [
    { name: "Fade In", width: "15%", color: "rgba(245,158,11,0.06)", textColor: "#f59e0b" },
    { name: "", width: "55%", color: "transparent", textColor: "transparent" },
    { name: "Glitch", width: "8%", color: "rgba(139,92,246,0.08)", textColor: "#8b5cf6" },
    { name: "", width: "7%", color: "transparent", textColor: "transparent" },
    { name: "Fade Out", width: "15%", color: "rgba(245,158,11,0.06)", textColor: "#f59e0b" },
  ]},
];

const PRESETS: { name: string; desc: string; tags: string[] }[] = [
  { name: "Cinematic Documentary", desc: "Film grain + letterbox + slow zoom + warm LUT + subtitle bar captions", tags: ["film grain", "letterbox", "warm LUT", "subtitle bar"] },
  { name: "Music Video", desc: "Glitch + light leaks + bounce captions + pixelize transitions", tags: ["glitch", "light leaks", "bounce", "pixelize"] },
  { name: "Social Hook", desc: "Jump cut + karaoke captions + zoom pulse + bold colors", tags: ["jump cut", "karaoke", "zoom pulse", "bold"] },
  { name: "Corporate Clean", desc: "Smooth dissolves + lower thirds + neutral grade + clean captions", tags: ["dissolve", "lower third", "neutral", "clean"] },
  { name: "Education", desc: "Typewriter captions + highlight box + slow pan + diagram overlays", tags: ["typewriter", "highlight", "slow pan", "diagram"] },
  { name: "Product Showcase", desc: "Ken Burns zoom + minimal captions + white bg + fade transitions", tags: ["ken burns", "minimal", "white bg", "fade"] },
];

export default function EditorPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<EditorTab>("overlays");
  const [showSafeZone, setShowSafeZone] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState("tiktok");
  const [adMode, setAdMode] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 4 }}>{"\u2702\ufe0f"} Video Editor</h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Overlays, captions, transitions, filters, color grading</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => router.push("/dashboard/preview")}
            style={{ padding: "8px 16px", borderRadius: 8, fontSize: "0.8rem", fontWeight: 600, background: "var(--bg-tertiary)", color: "var(--text-secondary)", border: "1px solid var(--border)", cursor: "pointer" }}
          >
            Back to Preview
          </button>
          <button style={{ padding: "8px 16px", borderRadius: 8, fontSize: "0.8rem", fontWeight: 600, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", border: "none", cursor: "pointer" }}>
            {"\u25b6"} Export
          </button>
        </div>
      </div>

      {/* Video Preview */}
      <div style={{
        height: 280, background: "var(--bg-secondary)", border: "1px solid var(--border)",
        borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 16, position: "relative",
      }}>
        <div style={{ fontSize: "3rem", opacity: 0.15 }}>{"\u25b6"}</div>
        <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8, alignItems: "center" }}>
          <button style={{ padding: "4px 10px", borderRadius: 4, border: "1px solid var(--border)", background: "var(--bg-tertiary)", color: "var(--text-secondary)", fontSize: "0.7rem", cursor: "pointer" }}>{"\u23ee"}</button>
          <button style={{ padding: "4px 12px", borderRadius: 4, background: "#6366f1", color: "white", fontSize: "0.7rem", border: "none", cursor: "pointer" }}>{"\u25b6"}</button>
          <button style={{ padding: "4px 10px", borderRadius: 4, border: "1px solid var(--border)", background: "var(--bg-tertiary)", color: "var(--text-secondary)", fontSize: "0.7rem", cursor: "pointer" }}>{"\u23ed"}</button>
          <span style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "var(--text-muted)" }}>00:04.12 / 00:30.00</span>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        {/* Ruler */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6rem", color: "var(--text-muted)", marginBottom: 8, paddingLeft: 80 }}>
          {["0:00", "0:06", "0:12", "0:18", "0:24", "0:30"].map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
        {/* Tracks */}
        {TIMELINE_TRACKS.map((track) => (
          <div key={track.label} style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
            <div style={{ width: 80, fontSize: "0.65rem", fontWeight: 600, color: "var(--text-muted)", flexShrink: 0 }}>{track.label}</div>
            <div style={{ flex: 1, display: "flex", height: 28, borderRadius: 4, overflow: "hidden" }}>
              {track.clips.map((clip, i) => (
                <div key={i} style={{
                  width: clip.width, background: clip.color, color: clip.textColor,
                  fontSize: "0.6rem", fontWeight: 600, display: "flex", alignItems: "center",
                  justifyContent: "center", borderRadius: 3, margin: "0 1px",
                }}>
                  {clip.name}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Safe Zone Controls */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={() => setShowSafeZone(!showSafeZone)} style={{
          padding: "4px 10px", borderRadius: 6, fontSize: "0.7rem", fontWeight: 600, cursor: "pointer",
          background: showSafeZone ? "rgba(16,185,129,0.1)" : "var(--bg-tertiary)",
          color: showSafeZone ? "#10b981" : "var(--text-muted)",
          border: `1px solid ${showSafeZone ? "rgba(16,185,129,0.2)" : "var(--border)"}`,
        }}>
          {showSafeZone ? "✓ Safe Zone On" : "Safe Zone Off"}
        </button>

        {showSafeZone && (
          <>
            <select value={selectedPlatform} onChange={(e) => setSelectedPlatform(e.target.value)} style={{
              padding: "4px 8px", borderRadius: 6, fontSize: "0.7rem", border: "1px solid var(--border)",
              background: "var(--bg-secondary)", color: "var(--text-primary)",
            }}>
              {PLATFORM_IDS.map((id) => {
                const p = PLATFORM_SAFE_ZONES[id];
                return p ? <option key={id} value={id}>{p.name}</option> : null;
              })}
            </select>

            <div style={{ display: "flex", gap: 3 }}>
              <button onClick={() => setAdMode(false)} style={{
                padding: "3px 8px", borderRadius: 4, fontSize: "0.6rem", fontWeight: 600, cursor: "pointer",
                background: !adMode ? "rgba(16,185,129,0.1)" : "transparent",
                color: !adMode ? "#10b981" : "var(--text-muted)",
                border: `1px solid ${!adMode ? "rgba(16,185,129,0.2)" : "var(--border)"}`,
              }}>Organic</button>
              <button onClick={() => setAdMode(true)} style={{
                padding: "3px 8px", borderRadius: 4, fontSize: "0.6rem", fontWeight: 600, cursor: "pointer",
                background: adMode ? "rgba(239,68,68,0.1)" : "transparent",
                color: adMode ? "#ef4444" : "var(--text-muted)",
                border: `1px solid ${adMode ? "rgba(239,68,68,0.2)" : "var(--border)"}`,
              }}>Ads</button>
            </div>
          </>
        )}
      </div>

      {/* Presets */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {PRESETS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => setActivePreset(activePreset === preset.name ? null : preset.name)}
            style={{
              padding: "8px 12px", borderRadius: 8, flexShrink: 0, textAlign: "left",
              background: activePreset === preset.name ? "rgba(99,102,241,0.08)" : "var(--bg-secondary)",
              border: `1px solid ${activePreset === preset.name ? "rgba(99,102,241,0.3)" : "var(--border)"}`,
              cursor: "pointer", maxWidth: 200, fontFamily: "inherit",
            }}
          >
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: activePreset === preset.name ? "#6366f1" : "var(--text-primary)", marginBottom: 2 }}>{preset.name}</div>
            <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", lineHeight: 1.3 }}>{preset.desc}</div>
          </button>
        ))}
      </div>

      {/* Editor Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 4 }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "8px 14px", borderRadius: "8px 8px 0 0", fontSize: "0.75rem", fontWeight: 600,
              background: activeTab === tab.key ? "var(--bg-secondary)" : "transparent",
              color: activeTab === tab.key ? "#6366f1" : "var(--text-muted)",
              border: activeTab === tab.key ? "1px solid var(--border)" : "1px solid transparent",
              borderBottom: activeTab === tab.key ? "1px solid var(--bg-secondary)" : "1px solid transparent",
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Panel Content */}
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, minHeight: 200 }}>
        {activeTab === "overlays" && (
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: 12 }}>Text &amp; Image Overlays</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {["Logo Watermark", "Lower Third", "Title Card", "Social Handle", "CTA Button", "Custom Text", "Film Grain", "Light Leaks", "Letterbox", "Vignette"].map((name) => (
                <button key={name} style={{ padding: 16, background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: 8, fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", cursor: "pointer", textAlign: "center" }}>
                  + {name}
                </button>
              ))}
            </div>
          </div>
        )}
        {activeTab === "captions" && (
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: 12 }}>Caption Styles</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {["Karaoke Word", "Bounce Pop", "Typewriter", "Fade Slide", "Subtitle Bar", "Highlight Box", "Minimal Clean"].map((name) => (
                <button key={name} style={{ padding: 14, background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: 8, fontSize: "0.7rem", fontWeight: 600, color: "var(--text-secondary)", cursor: "pointer", textAlign: "center" }}>
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}
        {activeTab === "transitions" && (
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: 12 }}>Transition Library</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
              {["Fade", "Dissolve", "Wipe Left", "Wipe Right", "Zoom In", "Zoom Out", "Slide Up", "Slide Down", "Glitch", "Flash"].map((name) => (
                <button key={name} style={{ padding: 10, background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: 8, fontSize: "0.65rem", fontWeight: 600, color: "var(--text-secondary)", cursor: "pointer", textAlign: "center" }}>
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}
        {activeTab === "filters" && (
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: 12 }}>Color Grading &amp; Filters</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
              {["Cinematic", "Warm", "Cool", "Vintage", "B&W", "High Contrast", "Film Grain", "Vignette", "Teal Orange", "Pastel"].map((name) => (
                <button key={name} style={{ padding: 10, background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: 8, fontSize: "0.65rem", fontWeight: 600, color: "var(--text-secondary)", cursor: "pointer", textAlign: "center" }}>
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}
        {activeTab === "audio" && (
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: 12 }}>Audio Mixer</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {[{ label: "Voiceover", val: 85 }, { label: "Music", val: 30 }, { label: "SFX", val: 60 }].map((ch) => (
                <div key={ch.label} style={{ padding: 16, background: "var(--bg-tertiary)", borderRadius: 8 }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, marginBottom: 8 }}>{ch.label}</div>
                  <div style={{ height: 6, background: "var(--bg-primary)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${ch.val}%`, background: "#6366f1", borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: 4 }}>{ch.val}%</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === "motion" && (
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: 12 }}>Camera Motion &amp; Ken Burns</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {["Pan Left", "Pan Right", "Zoom In", "Zoom Out", "Tilt Up", "Tilt Down", "Orbit", "Ken Burns"].map((name) => (
                <button key={name} style={{ padding: 12, background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: 8, fontSize: "0.7rem", fontWeight: 600, color: "var(--text-secondary)", cursor: "pointer", textAlign: "center" }}>
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}
        {activeTab === "ai_helper" && (
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: 12 }}>AI Editing Assistant</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input
                type="text"
                defaultValue="Make this look more cinematic and professional"
                style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-tertiary)", color: "var(--text-primary)", fontSize: "0.8rem" }}
              />
              <button style={{ padding: "10px 16px", borderRadius: 8, fontSize: "0.8rem", fontWeight: 600, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", border: "none", cursor: "pointer" }}>
                {"\u2728"} Suggest
              </button>
            </div>
            <div style={{ padding: 12, background: "var(--bg-tertiary)", borderRadius: 8, fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              AI will analyze your video and suggest edits: color grading, transitions, caption timing, audio ducking, and overlay placement.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
