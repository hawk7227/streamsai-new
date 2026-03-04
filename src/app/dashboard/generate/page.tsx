"use client";

import { useState, useCallback } from "react";
import ContentToolSidebar from "@/components/studio/ContentToolSidebar";
import PromptPanel from "@/components/studio/PromptPanel";
import StudioSafeZonePanel from "@/components/studio/StudioSafeZonePanel";
import StudioPreviewGates from "@/components/studio/StudioPreviewGates";
import OutputGallery, { type GalleryJob } from "@/components/studio/OutputGallery";
import { type ToolCodename, type GateStage } from "@/components/studio/tool-data";

// ── Demo data ──────────────────────────────────────────────────────────
const DEMO_JOBS: GalleryJob[] = [
  { id: "j1", title: "Futuristic city aerial — sunset", tool: "PHOENIX • 4s", type: "video", status: "done", cost: "$0.50" },
  { id: "j2", title: "Product showcase — drone flyover", tool: "TITAN • est 6s", type: "video", status: "running", progress: 67, cost: "$0.30" },
  { id: "j3", title: "Logo design — tech startup", tool: "PRISM", type: "image", status: "done", cost: "$0.08" },
  { id: "j4", title: "Upbeat corporate background", tool: "ECHO • 45s", type: "audio", status: "done", cost: "$0.10" },
  { id: "j5", title: "Voiceover — product intro", tool: "ORACLE", type: "voice", status: "queued", cost: "$0.03" },
];

// ── Page ────────────────────────────────────────────────────────────────
export default function GeneratePage() {
  const [selectedTool, setSelectedTool] = useState<ToolCodename>("PHOENIX");
  const [toolSidebarCollapsed, setToolSidebarCollapsed] = useState(false);
  const [prompt, setPrompt] = useState(
    "Cinematic aerial shot of a futuristic city at sunset, neon lights, flying vehicles, 4K"
  );
  const [batchCount, setBatchCount] = useState(1);
  const [currentGate, setCurrentGate] = useState<GateStage>("single_scene");
  const [completedGates] = useState<GateStage[]>(["storyboard", "animatic"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<GalleryJob[]>(DEMO_JOBS);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedTool.toLowerCase(),
          prompt: prompt.trim(),
          batch_count: batchCount,
          quality_tiers: ["standard"],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details ?? data.error ?? "Generation failed");
      const newJobs: GalleryJob[] = (data.generations ?? []).map((g: Record<string, string>) => ({
        id: g.id,
        title: prompt.slice(0, 40),
        tool: selectedTool,
        type: "video" as const,
        status: "queued" as const,
        cost: "—",
      }));
      setJobs((prev) => [...newJobs, ...prev]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [prompt, selectedTool, batchCount]);

  const handleGateClick = useCallback((gate: GateStage) => {
    setCurrentGate(gate);
  }, []);

  return (
    <div
      className="animate-fade-up"
      style={{ display: "flex", height: "calc(100vh - 48px)", margin: "-16px -24px -16px -16px", overflow: "hidden" }}
    >
      {/* Content Tool Sidebar — left */}
      <ContentToolSidebar
        collapsed={toolSidebarCollapsed}
        onToggle={() => setToolSidebarCollapsed((p) => !p)}
        onToolClick={(id) => {
          const mapping: Record<string, ToolCodename> = {
            script: "ECHO", voice: "ORACLE", image: "PRISM", video: "PHOENIX",
            video_edit: "PHOENIX", image_edit: "PRISM", export: "FORGE", webhook: "FORGE",
          };
          const codename = mapping[id];
          if (codename) setSelectedTool(codename);
        }}
      />

      {/* Workspace — right, scrollable */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px", marginBottom: 2 }}>
              ✦ AI Media Studio
            </h1>
            <p style={{ fontSize: "11.5px", color: "var(--color-t-2)" }}>
              Generate images, video, audio, voice, and 3D — 50+ concurrent jobs, tab-close safe
            </p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={{ padding: "5px 10px", borderRadius: 8, fontSize: 10, fontWeight: 600, background: "var(--color-bg-4)", color: "var(--color-t-2)", border: "1px solid var(--color-bdr)", cursor: "pointer", fontFamily: "inherit" }}>
              📤 Share
            </button>
            <button style={{ padding: "5px 10px", borderRadius: 8, fontSize: 10, fontWeight: 600, background: "var(--color-bg-4)", color: "var(--color-t-2)", border: "1px solid var(--color-bdr)", cursor: "pointer", fontFamily: "inherit" }}>
              🤖 Copilot
            </button>
          </div>
        </div>

        {/* Prompt Panel */}
        <PromptPanel
          tool={selectedTool}
          prompt={prompt}
          onPromptChange={setPrompt}
          batchCount={batchCount}
          onBatchCountChange={setBatchCount}
        />

        {/* Safe Zones */}
        <StudioSafeZonePanel />

        {/* Preview Gates */}
        <div style={{ marginTop: 8 }}>
          <StudioPreviewGates
            currentGate={currentGate}
            completedGates={completedGates}
            onGateClick={handleGateClick}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            style={{
              padding: "8px 16px", borderRadius: 8, fontSize: 11, fontWeight: 600,
              background: loading ? "var(--color-bg-4)" : "var(--color-acc)",
              color: loading ? "var(--color-t-3)" : "#000",
              border: "none", cursor: loading ? "not-allowed" : "pointer",
              opacity: !prompt.trim() ? 0.3 : 1, fontFamily: "inherit",
            }}
          >
            {loading ? "⟳ Generating..." : "▶ Generate"}
          </button>
          <button
            onClick={() => setBatchCount(50)}
            style={{
              padding: "8px 16px", borderRadius: 8, fontSize: 11, fontWeight: 600,
              background: "var(--color-bg-4)", color: "var(--color-t-2)",
              border: "1px solid var(--color-bdr)", cursor: "pointer", fontFamily: "inherit",
            }}
          >
            ⚡ Batch 50
          </button>
          <button
            style={{
              padding: "8px 16px", borderRadius: 8, fontSize: 11, fontWeight: 600,
              background: "var(--color-bg-4)", color: "var(--color-t-2)",
              border: "1px solid var(--color-bdr)", cursor: "pointer", fontFamily: "inherit",
            }}
          >
            📤 Post to Social
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: "12px 14px", borderRadius: 8, fontSize: 11, marginBottom: 12,
            background: "rgba(255,68,85,0.08)", border: "1px solid rgba(255,68,85,0.15)",
            color: "var(--color-red)",
          }}>
            {error}
          </div>
        )}

        {/* Output Gallery */}
        <div style={{ marginTop: 12 }}>
          <OutputGallery jobs={jobs} />
        </div>
      </div>
    </div>
  );
}
