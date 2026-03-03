"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PLATFORM_SAFE_ZONES, PLATFORM_IDS } from "@/lib/safe-zones";
import type { PreviewStage, SceneStatus, PlatformSafeZone } from "@/lib/types";

const STAGES: { key: PreviewStage; label: string; desc: string }[] = [
  { key: "storyboard", label: "Storyboard", desc: "Still frames per scene with safe zone overlays" },
  { key: "animatic", label: "Animatic", desc: "Ken Burns animated slideshow with transitions and captions" },
  { key: "single_scene", label: "Single Scene", desc: "One representative scene at full AI video quality" },
  { key: "full_render", label: "Full Render", desc: "All scenes rendered and stitched. Ready for export." },
];

const MOCK_SCENES: { id: string; name: string; time: string; status: SceneStatus }[] = [
  { id: "s1", name: "Hook", time: "0:00-0:03", status: "approved" },
  { id: "s2", name: "Problem", time: "0:03-0:08", status: "approved" },
  { id: "s3", name: "Solution", time: "0:08-0:18", status: "review" },
  { id: "s4", name: "Social Proof", time: "0:18-0:24", status: "pending" },
  { id: "s5", name: "CTA", time: "0:24-0:30", status: "pending" },
];

const statusConfig: Record<SceneStatus, { color: string; bg: string; label: string }> = {
  approved: { color: "#10b981", bg: "rgba(16,185,129,0.08)", label: "Approved" },
  review: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", label: "Review" },
  pending: { color: "#6366f1", bg: "rgba(99,102,241,0.08)", label: "Pending" },
  generating: { color: "#3b82f6", bg: "rgba(59,130,246,0.08)", label: "Generating" },
  rejected: { color: "#ef4444", bg: "rgba(239,68,68,0.08)", label: "Rejected" },
};

function PhoneMockup({ platform, adMode }: { platform: PlatformSafeZone; adMode: boolean }) {
  const margins = adMode ? platform.ads : platform.organic;
  const isLandscape = platform.canvas.width > platform.canvas.height;
  const phoneW = isLandscape ? 128 : 72;
  const phoneH = isLandscape ? 72 : 128;
  const topPct = (margins.top / platform.canvas.height) * 100;
  const bottomPct = (margins.bottom / platform.canvas.height) * 100;
  const leftPct = (margins.left / platform.canvas.width) * 100;
  const rightPct = (margins.right / platform.canvas.width) * 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
      <div style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--text-muted)" }}>{platform.name}</div>
      <div style={{
        position: "relative", width: phoneW, height: phoneH,
        background: "#000", borderRadius: isLandscape ? 4 : 8,
        overflow: "hidden", border: "1.5px solid var(--border)",
      }}>
        {/* Content bg */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #0a1628, #1a0a2e)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 14, opacity: 0.25 }}>&#9654;</span>
        </div>
        {/* Red zones */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: `${topPct}%`, background: "rgba(255,50,50,0.25)", borderBottom: "1px dashed rgba(255,50,50,0.5)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${bottomPct}%`, background: "rgba(255,50,50,0.25)", borderTop: "1px dashed rgba(255,50,50,0.5)" }} />
        {leftPct > 0 && <div style={{ position: "absolute", left: 0, top: `${topPct}%`, bottom: `${bottomPct}%`, width: `${leftPct}%`, background: "rgba(255,50,50,0.15)", borderRight: "1px dashed rgba(255,50,50,0.4)" }} />}
        {rightPct > 0 && <div style={{ position: "absolute", right: 0, top: `${topPct}%`, bottom: `${bottomPct}%`, width: `${rightPct}%`, background: "rgba(255,50,50,0.15)", borderLeft: "1px dashed rgba(255,50,50,0.4)" }} />}
        {/* Green safe zone */}
        <div style={{ position: "absolute", top: `${topPct}%`, left: `${leftPct}%`, right: `${rightPct}%`, bottom: `${bottomPct}%`, border: "1px solid rgba(16,185,129,0.4)", borderRadius: 1 }} />
      </div>
      <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
        {platform.safeZone.width}x{platform.safeZone.height}
      </div>
    </div>
  );
}

export default function PreviewPage() {
  const router = useRouter();
  const [stage, setStage] = useState<PreviewStage>("storyboard");
  const [adMode, setAdMode] = useState(false);
  const [selectedScene, setSelectedScene] = useState("s1");
  const [scenes, setScenes] = useState(MOCK_SCENES);

  const currentStage = STAGES.find((s) => s.key === stage);
  const approvedCount = scenes.filter((s) => s.status === "approved").length;
  const reviewCount = scenes.filter((s) => s.status === "review").length;
  const pendingCount = scenes.filter((s) => s.status === "pending").length;

  const complianceResults = useMemo(() => {
    const results: Record<string, { pass: boolean; note: string }> = {};
    for (const id of PLATFORM_IDS) {
      const platform = PLATFORM_SAFE_ZONES[id];
      if (!platform) continue;
      // Mock: most pass, one warns
      if (id === "yt_shorts") {
        results[id] = { pass: false, note: "Caption L3 12px from bottom zone" };
      } else {
        results[id] = { pass: true, note: "" };
      }
    }
    return results;
  }, []);

  const passCount = Object.values(complianceResults).filter((r) => r.pass).length;
  const totalCount = Object.keys(complianceResults).length;

  function approveAll() {
    setScenes((prev) => prev.map((s) => ({ ...s, status: "approved" as SceneStatus })));
  }

  function advanceGate() {
    const idx = STAGES.findIndex((s) => s.key === stage);
    if (idx < STAGES.length - 1) {
      setStage(STAGES[idx + 1]!.key);
    }
  }

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 4 }}>Preview</h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{currentStage?.desc}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => router.push("/dashboard/generate")}
            style={{ padding: "8px 16px", borderRadius: 8, fontSize: "0.8rem", fontWeight: 600, background: "var(--bg-tertiary)", color: "var(--text-secondary)", border: "1px solid var(--border)", cursor: "pointer" }}
          >
            Back to Studio
          </button>
          <button
            onClick={() => router.push("/dashboard/editor")}
            style={{ padding: "8px 16px", borderRadius: 8, fontSize: "0.8rem", fontWeight: 600, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", border: "none", cursor: "pointer" }}
          >
            View in Editor
          </button>
        </div>
      </div>

      {/* Gate Stage Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {STAGES.map((s, i) => (
          <button
            key={s.key}
            onClick={() => setStage(s.key)}
            style={{
              padding: "8px 16px", borderRadius: 8, fontSize: "0.75rem", fontWeight: 600,
              background: stage === s.key ? "rgba(99,102,241,0.1)" : "var(--bg-tertiary)",
              color: stage === s.key ? "#6366f1" : "var(--text-muted)",
              border: `1px solid ${stage === s.key ? "rgba(99,102,241,0.3)" : "var(--border)"}`,
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            <span style={{ marginRight: 4 }}>{i + 1}</span>{s.label}
          </button>
        ))}
      </div>

      {/* Ad Mode Toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Safe Zone Mode:</span>
        <button
          onClick={() => setAdMode(false)}
          style={{
            padding: "4px 12px", borderRadius: 6, fontSize: "0.7rem", fontWeight: 600,
            background: !adMode ? "rgba(16,185,129,0.1)" : "var(--bg-tertiary)",
            color: !adMode ? "#10b981" : "var(--text-muted)",
            border: `1px solid ${!adMode ? "rgba(16,185,129,0.2)" : "var(--border)"}`,
            cursor: "pointer",
          }}
        >
          Organic
        </button>
        <button
          onClick={() => setAdMode(true)}
          style={{
            padding: "4px 12px", borderRadius: 6, fontSize: "0.7rem", fontWeight: 600,
            background: adMode ? "rgba(239,68,68,0.1)" : "var(--bg-tertiary)",
            color: adMode ? "#ef4444" : "var(--text-muted)",
            border: `1px solid ${adMode ? "rgba(239,68,68,0.2)" : "var(--border)"}`,
            cursor: "pointer",
          }}
        >
          Ads
        </button>
      </div>

      {/* Platform Preview Mockups */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>
          PLATFORM PREVIEWS <span style={{ fontWeight: 400 }}>Red = dead zone, Green = safe zone</span>
        </div>
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
          {PLATFORM_IDS.map((id) => {
            const platform = PLATFORM_SAFE_ZONES[id];
            if (!platform) return null;
            return <PhoneMockup key={id} platform={platform} adMode={adMode} />;
          })}
        </div>
      </div>

      {/* Scene Review Grid */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 10 }}>{currentStage?.label} Scenes</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          {scenes.map((scene) => {
            const cfg = statusConfig[scene.status];
            return (
              <button
                key={scene.id}
                onClick={() => setSelectedScene(scene.id)}
                style={{
                  padding: 12, background: "var(--bg-secondary)",
                  border: `1px solid ${selectedScene === scene.id ? "#6366f1" : "var(--border)"}`,
                  borderRadius: 12, cursor: "pointer", textAlign: "center", transition: "all 0.15s",
                }}
              >
                <div style={{ height: 64, background: "var(--bg-tertiary)", borderRadius: 8, display: "grid", placeItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: "1.2rem", opacity: 0.3 }}>{scene.name.charAt(0)}</span>
                </div>
                <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>{scene.name}</div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{scene.time}</div>
                <div style={{ marginTop: 4 }}>
                  <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: "0.6rem", fontWeight: 600, background: cfg.bg, color: cfg.color }}>
                    {cfg.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scene Actions */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button onClick={approveAll} style={{ padding: "8px 16px", borderRadius: 8, fontSize: "0.75rem", fontWeight: 600, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", border: "none", cursor: "pointer" }}>
          Approve All
        </button>
        <button style={{ padding: "8px 16px", borderRadius: 8, fontSize: "0.75rem", fontWeight: 600, background: "var(--bg-tertiary)", color: "var(--text-secondary)", border: "1px solid var(--border)", cursor: "pointer" }}>
          Re-prompt Selected
        </button>
        <button style={{ padding: "8px 16px", borderRadius: 8, fontSize: "0.75rem", fontWeight: 600, background: "var(--bg-tertiary)", color: "var(--text-secondary)", border: "1px solid var(--border)", cursor: "pointer" }}>
          Reorder Scenes
        </button>
        <button onClick={advanceGate} style={{ padding: "8px 16px", borderRadius: 8, fontSize: "0.75rem", fontWeight: 600, background: "var(--bg-tertiary)", color: "var(--text-secondary)", border: "1px solid var(--border)", cursor: "pointer" }}>
          Next Gate &rarr;
        </button>
      </div>

      {/* Safe Zone Compliance */}
      <div style={{ padding: 16, background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 12, marginBottom: 20 }}>
        <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: 10 }}>
          Safe Zone Compliance
          <span style={{ marginLeft: 8, fontSize: "0.7rem", fontWeight: 500, color: passCount === totalCount ? "#10b981" : "#f59e0b" }}>
            {passCount}/{totalCount} pass
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {Object.entries(complianceResults).map(([id, result]) => {
            const platform = PLATFORM_SAFE_ZONES[id];
            if (!platform) return null;
            return (
              <div key={id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem" }}>
                <span style={{ color: result.pass ? "#10b981" : "#f59e0b" }}>
                  {result.pass ? "\u2713" : "!"}
                </span>
                <span>{platform.name}</span>
                {result.note && <span style={{ fontSize: "0.6rem", color: "#f59e0b" }}>{result.note}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Final CTA Bar */}
      <div style={{
        display: "flex", gap: 12, padding: 16,
        background: "var(--bg-secondary)", border: "1px solid rgba(99,102,241,0.3)",
        borderRadius: 12, alignItems: "center",
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#6366f1" }}>Ready</div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
            {scenes.length} scenes: {approvedCount} approved, {reviewCount} in review, {pendingCount} pending. Safe zone: {passCount}/{totalCount} pass.
          </div>
        </div>
        <button style={{ padding: "8px 16px", borderRadius: 8, fontSize: "0.75rem", fontWeight: 600, background: "var(--bg-tertiary)", color: "var(--text-secondary)", border: "1px solid var(--border)", cursor: "pointer" }}>
          Export All Platforms
        </button>
        <button
          onClick={() => router.push("/dashboard/editor")}
          style={{ padding: "10px 20px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", border: "none", cursor: "pointer" }}
        >
          View in Editor
        </button>
      </div>
    </div>
  );
}
