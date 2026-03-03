"use client";

import { useState, useEffect } from "react";

export default function AutoPanel() {
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState("Ready \u2014 AI generates, evaluates, auto-finalizes, auto-posts.");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const logs = [
      "Generating script with Claude Sonnet...",
      "Script approved (quality: 92%). Generating voice...",
      "Voice generated (ElevenLabs). Generating images...",
      "4/5 images approved (\u226585% gate). Regenerating scene 3...",
      "Scene 3 regenerated (89%). Assembling video...",
      "Video assembled. Running safe zone validation...",
      "All platforms pass. Auto-posting to TikTok, IG Reels...",
      "Complete. 200cr budget \u2014 142cr used. Posted to 2 platforms.",
    ];
    let i = 0;
    const id = setInterval(() => {
      if (i >= logs.length) { clearInterval(id); setRunning(false); return; }
      setProgress(Math.round(((i + 1) / logs.length) * 100));
      setLog(logs[i] ?? "");
      i++;
    }, 1200);
    return () => clearInterval(id);
  }, [running]);

  return (
    <div style={{ padding: 16, background: "rgba(0,136,255,0.03)", border: "1px solid rgba(0,136,255,0.15)", borderRadius: 12, marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0088ff" }}>{"\u{1F916}"} Automatic Mode</span>
        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Budget: 200cr &bull; Gate: &ge;85%</span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, background: "var(--bg-tertiary)", borderRadius: 3, marginBottom: 8, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: "#0088ff", borderRadius: 3, transition: "width 0.5s" }} />
      </div>

      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 8 }}>{log}</div>

      {!running && progress === 0 && (
        <button
          onClick={() => setRunning(true)}
          style={{
            padding: "8px 20px", borderRadius: 8, fontSize: "0.8rem", fontWeight: 600,
            background: "#0088ff", color: "white", border: "none", cursor: "pointer",
          }}
        >
          {"\u25B6"} Start Auto Pipeline
        </button>
      )}
      {running && (
        <button
          onClick={() => setRunning(false)}
          style={{
            padding: "8px 20px", borderRadius: 8, fontSize: "0.8rem", fontWeight: 600,
            background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer",
          }}
        >
          Stop Pipeline
        </button>
      )}
    </div>
  );
}
