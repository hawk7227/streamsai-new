"use client";

import { useState } from "react";

const S = {
  bg2: "var(--color-bg-2)", bg3: "var(--color-bg-3)", bg4: "var(--color-bg-4)",
  bdr: "var(--color-bdr)", bdr2: "var(--color-bdr-2)",
  t1: "var(--color-t-1)", t2: "var(--color-t-2)", t3: "var(--color-t-3)", t4: "var(--color-t-4)",
  acc: "var(--color-acc)", accg: "var(--color-acc-glow)", blu: "var(--color-blu)",
  mono: "'JetBrains Mono', var(--mono), monospace",
};

type Filter = "all" | "video" | "image" | "audio" | "voice" | "3d";

const ASSETS = [
  { id: "a1", name: "Product launch — cinematic.mp4", type: "video" as const, size: "24.3 MB", date: "2h ago", icon: "🎬", bg: "linear-gradient(135deg,#1a0a2e,#0a1628)" },
  { id: "a2", name: "Logo designs — batch 50", type: "image" as const, size: "12.8 MB", date: "4h ago", icon: "🖼️", bg: "linear-gradient(135deg,#2a1a0a,#0a0a2a)" },
  { id: "a3", name: "Corporate BGM — upbeat.mp3", type: "audio" as const, size: "2.1 MB", date: "1d ago", icon: "🎵", bg: "linear-gradient(135deg,#0a2a1a,#1a0a2e)" },
  { id: "a4", name: "Voiceover — Rachel intro.wav", type: "voice" as const, size: "890 KB", date: "1d ago", icon: "🎙️", bg: "linear-gradient(135deg,#1a2a0a,#0a1628)" },
  { id: "a5", name: "Hero shot — drone flyover.mp4", type: "video" as const, size: "38.1 MB", date: "2d ago", icon: "🎬", bg: "linear-gradient(135deg,#0a1628,#1a2a0a)" },
  { id: "a6", name: "Thumbnail batch — product.png", type: "image" as const, size: "4.5 MB", date: "3d ago", icon: "🖼️", bg: "linear-gradient(135deg,#2a0a1a,#0a2a1a)" },
];

export default function LibraryPage() {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = ASSETS.filter(a => filter === "all" || a.type === filter);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px", marginBottom: 2 }}>📁 Asset Library</h1>
          <p style={{ fontSize: 11.5, color: S.t2 }}>All generated and uploaded media — search, filter, download</p>
        </div>
        <button style={{ padding: "8px 16px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: S.acc, color: "#000", border: "none", cursor: "pointer", fontFamily: "inherit" }}>📤 Upload</button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "inline-flex", background: S.bg3, borderRadius: 7, padding: 2, gap: 1, marginBottom: 16 }}>
        {(["all", "video", "image", "audio", "voice", "3d"] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 13px", borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: "pointer",
              color: filter === f ? "#000" : S.t3, background: filter === f ? S.acc : "transparent",
              border: "none", fontFamily: "inherit", textTransform: "capitalize",
            }}
          >{f === "3d" ? "3D" : f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Total Assets", value: "156" },
          { label: "Storage Used", value: "2.4 GB" },
          { label: "This Month", value: "47 new" },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: 8, textAlign: "center" }}>
            <div style={{ fontSize: 8, fontWeight: 600, color: S.t3, textTransform: "uppercase", marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Asset Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 8 }}>
        {filtered.map(asset => (
          <div key={asset.id} style={{ background: S.bg2, border: `1px solid ${S.bdr}`, borderRadius: 12, overflow: "hidden", cursor: "pointer" }}>
            <div style={{ height: 80, background: asset.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <span style={{ fontSize: 24, opacity: 0.4 }}>{asset.icon}</span>
              <span style={{ position: "absolute", top: 6, right: 6, padding: "1px 5px", borderRadius: 3, fontSize: 7, fontWeight: 600, background: S.accg, color: S.acc, textTransform: "uppercase" }}>{asset.type}</span>
            </div>
            <div style={{ padding: "8px 10px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{asset.name}</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: S.t3 }}>
                <span style={{ fontFamily: S.mono }}>{asset.size}</span>
                <span>{asset.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
