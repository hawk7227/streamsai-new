"use client";

import { useState, useCallback } from "react";
import ToolGrid from "@/components/studio/ToolGrid";
import StudioExecutionModeBar from "@/components/studio/StudioExecutionModeBar";
import PromptPanel from "@/components/studio/PromptPanel";
import StudioSafeZonePanel from "@/components/studio/StudioSafeZonePanel";
import StudioPreviewGates from "@/components/studio/StudioPreviewGates";
import OutputGallery, { type GalleryJob } from "@/components/studio/OutputGallery";
import HybridModePanel, { type HybridStep } from "@/components/studio/HybridModePanel";
import AutoModePanel from "@/components/studio/AutoModePanel";
import type { ToolCodename, ExecutionMode, GateStage } from "@/components/studio/tool-data";

// ── Demo data ──────────────────────────────────────────────────────────
const DEMO_JOBS: GalleryJob[] = [
  { id: "j1", title: "Futuristic city aerial — sunset", tool: "PHOENIX • 4s", type: "video", status: "done", cost: "$0.50" },
  { id: "j2", title: "Product showcase — drone flyover", tool: "TITAN • est 6s", type: "video", status: "running", progress: 67, cost: "$0.30" },
  { id: "j3", title: "Logo design — tech startup", tool: "PRISM", type: "image", status: "done", cost: "$0.08" },
  { id: "j4", title: "Upbeat corporate background", tool: "ECHO • 45s", type: "audio", status: "done", cost: "$0.10" },
  { id: "j5", title: "Voiceover — product intro", tool: "ORACLE", type: "voice", status: "queued", cost: "$0.03" },
];

const DEMO_HYBRID_STEPS: HybridStep[] = [
  { id: "s1", label: "Step 1: Script", icon: "📝", provider: "Claude Sonnet", status: "done", cost: "2cr" },
  {
    id: "s2",
    label: "Step 2: Voice Generation",
    icon: "🎙️",
    provider: "ElevenLabs Turbo",
    status: "awaiting",
    cost: "5cr",
    score: 88,
    duration: "2:14",
    body: "ElevenLabs Turbo voiceover. Duration: 2:14. Voice: Rachel. Quality: 88%.",
  },
  { id: "s3", label: "Step 3: Thumbnail", icon: "🖼️", provider: "FLUX", status: "pending" },
  { id: "s4", label: "Step 4: Video Assembly", icon: "🎬", provider: "PHOENIX", status: "pending" },
];

// ── Page ────────────────────────────────────────────────────────────────
export default function GeneratePage() {
  const [selectedTool, setSelectedTool] = useState<ToolCodename>("PHOENIX");
  const [execMode, setExecMode] = useState<ExecutionMode>("manual");
  const [prompt, setPrompt] = useState(
    "Cinematic aerial shot of a futuristic city at sunset, neon lights, flying vehicles, 4K"
  );
  const [batchCount, setBatchCount] = useState(1);
  const [currentGate, setCurrentGate] = useState<GateStage>("single_scene");
  const [completedGates] = useState<GateStage[]>(["storyboard", "animatic"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<GalleryJob[]>(DEMO_JOBS);
  const [hybridSteps, setHybridSteps] = useState<HybridStep[]>(DEMO_HYBRID_STEPS);

  // ── Handlers ──
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
      // Add to gallery
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

  const handleHybridAction = useCallback((action: string, stepId: string) => {
    setHybridSteps((prev) =>
      prev.map((s) => {
        if (s.id === stepId && action === "approve") return { ...s, status: "done" as const };
        if (s.id === stepId && action === "regen") return { ...s, body: "Regenerating..." };
        return s;
      })
    );
  }, []);

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h1 className="text-[20px] font-extrabold tracking-tight mb-[2px]">
            ✦ AI Media Studio
          </h1>
          <p className="text-[11.5px]" style={{ color: "var(--color-t-2)" }}>
            Generate images, video, audio, voice, and 3D — 50+ concurrent jobs, tab-close safe
          </p>
        </div>
        <div className="flex gap-1.5">
          <button
            className="py-[5px] px-[10px] rounded-r1 text-[10px] font-semibold transition-all duration-fast"
            style={{
              background: "var(--color-bg-4)",
              color: "var(--color-t-2)",
              border: "1px solid var(--color-bdr)",
            }}
          >
            📤 Share
          </button>
          <button
            className="py-[5px] px-[10px] rounded-r1 text-[10px] font-semibold transition-all duration-fast"
            style={{
              background: "var(--color-bg-4)",
              color: "var(--color-t-2)",
              border: "1px solid var(--color-bdr)",
            }}
          >
            🤖 Copilot
          </button>
        </div>
      </div>

      {/* Execution Mode */}
      <StudioExecutionModeBar mode={execMode} onChange={setExecMode} />

      {/* Tool Grid */}
      <ToolGrid selected={selectedTool} onSelect={setSelectedTool} />

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
      <div className="mt-2">
        <StudioPreviewGates
          currentGate={currentGate}
          completedGates={completedGates}
          onGateClick={handleGateClick}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="py-2 px-4 rounded-r1 text-[11px] font-semibold transition-all duration-fast"
          style={{
            background: loading ? "var(--color-bg-4)" : "var(--color-acc)",
            color: loading ? "var(--color-t-3)" : "#000",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: !prompt.trim() ? 0.3 : 1,
          }}
        >
          {loading ? "⟳ Generating..." : "▶ Generate"}
        </button>
        <button
          onClick={() => {
            setBatchCount(50);
          }}
          className="py-2 px-4 rounded-r1 text-[11px] font-semibold transition-all duration-fast"
          style={{
            background: "var(--color-bg-4)",
            color: "var(--color-t-2)",
            border: "1px solid var(--color-bdr)",
            cursor: "pointer",
          }}
        >
          ⚡ Batch 50
        </button>
        <button
          className="py-2 px-4 rounded-r1 text-[11px] font-semibold transition-all duration-fast"
          style={{
            background: "var(--color-bg-4)",
            color: "var(--color-t-2)",
            border: "1px solid var(--color-bdr)",
            cursor: "pointer",
          }}
        >
          📤 Post to Social
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          className="py-3 px-3.5 rounded-r1 text-[11px] mb-3"
          style={{
            background: "rgba(255,68,85,0.08)",
            border: "1px solid rgba(255,68,85,0.15)",
            color: "var(--color-red)",
          }}
        >
          {error}
        </div>
      )}

      {/* Hybrid Mode Panel */}
      {execMode === "hybrid" && (
        <HybridModePanel
          steps={hybridSteps}
          onApprove={(id) => handleHybridAction("approve", id)}
          onEdit={(id) => handleHybridAction("edit", id)}
          onRegen={(id) => handleHybridAction("regen", id)}
          onSkip={(id) => handleHybridAction("skip", id)}
        />
      )}

      {/* Auto Mode Panel */}
      {execMode === "auto" && (
        <AutoModePanel onRun={() => { /* Will wire to real API */ }} />
      )}

      {/* Output Gallery */}
      <div className="mt-3">
        <OutputGallery jobs={jobs} />
      </div>
    </div>
  );
}
