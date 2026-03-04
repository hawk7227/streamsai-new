"use client";

import { useState } from "react";
import {
  CAMERA_CHIPS,
  VIDEO_SUB_MODES,
  MODEL_ROUTES,
  TOOLS,
  type ToolCodename,
  type VideoSubMode,
} from "./tool-data";

interface PromptPanelProps {
  tool: ToolCodename;
  prompt: string;
  onPromptChange: (value: string) => void;
  batchCount: number;
  onBatchCountChange: (value: number) => void;
}

export default function PromptPanel({
  tool,
  prompt,
  onPromptChange,
  batchCount,
  onBatchCountChange,
}: PromptPanelProps) {
  const [videoSubMode, setVideoSubMode] = useState<VideoSubMode>("text_to_video");
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [modelRoute, setModelRoute] = useState(MODEL_ROUTES[0]);
  const [duration, setDuration] = useState("5s");
  const [extendClip, setExtendClip] = useState(false);
  const [gateMode, setGateMode] = useState("auto");

  const toolDef = TOOLS.find((t) => t.codename === tool);
  const isVideo = toolDef?.category === "video";
  const costPerGen = toolDef?.cost ?? "—";

  // Estimate
  const costNum = parseFloat(costPerGen.replace(/[^0-9.]/g, "")) / 100;
  const totalEstimate = (costNum * batchCount).toFixed(2);

  return (
    <div>
      {/* Video Sub-Modes */}
      {isVideo && (
        <div className="flex gap-1 mb-2">
          {VIDEO_SUB_MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setVideoSubMode(m.id)}
              className="py-[5px] px-3 rounded-[5px] text-[9px] font-bold transition-all duration-fast"
              style={{
                background: videoSubMode === m.id ? "var(--color-acc)" : "var(--color-bg-3)",
                color: videoSubMode === m.id ? "#000" : "var(--color-t-3)",
                border: `1px solid ${videoSubMode === m.id ? "var(--color-acc)" : "var(--color-bdr)"}`,
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {/* Model Route */}
      {isVideo && (
        <div className="flex gap-1.5 mb-2 items-center">
          <label className="m-0 text-[8px] font-semibold min-w-[55px]" style={{ color: "var(--color-t-3)" }}>
            Model Route
          </label>
          <select
            value={modelRoute}
            onChange={(e) => setModelRoute(e.target.value)}
            className="w-[150px] py-[5px] px-2 text-[9px] rounded-[7px] outline-none transition-all duration-fast"
            style={{
              background: "var(--color-bg-3)",
              border: "1px solid var(--color-bdr)",
              color: "var(--color-t-1)",
              fontFamily: "var(--font-sans)",
            }}
          >
            {MODEL_ROUTES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <span className="text-[7.5px]" style={{ color: "var(--color-t-3)" }}>
            Auto routes each shot to optimal model by complexity
          </span>
        </div>
      )}

      {/* Main prompt + settings row */}
      <div className="flex gap-3 mb-2 flex-wrap">
        {/* Prompt column */}
        <div className="flex-1 min-w-[300px]">
          <label className="block text-[9.5px] font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--color-t-3)" }}>
            Prompt
          </label>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Describe what to generate..."
            className="w-full py-[9px] px-[11px] rounded-[7px] text-[12px] outline-none resize-y transition-all duration-fast"
            style={{
              background: "var(--color-bg-3)",
              border: "1px solid var(--color-bdr)",
              color: "var(--color-t-1)",
              fontFamily: "var(--font-sans)",
            }}
          />

          {/* Camera chips */}
          {isVideo && (
            <div className="flex gap-[3px] mt-1 flex-wrap items-center">
              <span className="text-[7px] font-semibold" style={{ color: "var(--color-t-3)" }}>
                Camera:
              </span>
              {CAMERA_CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setSelectedCamera(selectedCamera === chip.id ? null : chip.id)}
                  className="py-[2px] px-[5px] rounded-[3px] text-[7px] transition-all duration-fast"
                  style={{
                    background: selectedCamera === chip.id ? "var(--color-acc-glow)" : "var(--color-bg-3)",
                    border: `1px solid ${selectedCamera === chip.id ? "var(--color-acc)" : "var(--color-bdr)"}`,
                    color: selectedCamera === chip.id ? "var(--color-acc)" : "var(--color-t-2)",
                    cursor: "pointer",
                  }}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {/* Character ref + duration + extend */}
          {isVideo && (
            <div className="flex gap-1 mt-1 items-center">
              <div
                className="w-[22px] h-[22px] rounded-[3px] grid place-items-center text-[8px] cursor-pointer"
                style={{
                  background: "var(--color-bg-3)",
                  border: "1px dashed var(--color-bdr-2)",
                }}
                title="Upload character reference for identity lock"
              >
                👤
              </div>
              <span className="text-[7px]" style={{ color: "var(--color-t-3)" }}>
                Character ref — identity lock across shots
              </span>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="ml-auto w-[60px] py-[2px] text-[8px] rounded-[4px] outline-none"
                style={{
                  background: "var(--color-bg-3)",
                  border: "1px solid var(--color-bdr)",
                  color: "var(--color-t-1)",
                }}
              >
                {["5s", "10s", "15s", "20s", "25s"].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <label className="text-[7px] flex gap-[2px] items-center" style={{ color: "var(--color-t-3)" }}>
                <input
                  type="checkbox"
                  checked={extendClip}
                  onChange={(e) => setExtendClip(e.target.checked)}
                  style={{ accentColor: "var(--color-acc)" }}
                />
                Extend clip
              </label>
            </div>
          )}
        </div>

        {/* Right column — batch + cost + gate */}
        <div className="w-[200px]">
          <label className="block text-[9.5px] font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--color-t-3)" }}>
            Batch Count
          </label>
          <input
            type="number"
            value={batchCount}
            onChange={(e) => onBatchCountChange(Math.max(1, Math.min(100, Number(e.target.value))))}
            min={1}
            max={100}
            className="w-full py-[9px] px-[11px] rounded-[7px] text-[12px] outline-none transition-all duration-fast mb-2"
            style={{
              background: "var(--color-bg-3)",
              border: "1px solid var(--color-bdr)",
              color: "var(--color-t-1)",
              fontFamily: "var(--font-sans)",
            }}
          />

          <label className="block text-[9.5px] font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--color-t-3)" }}>
            Cost Estimate
          </label>
          <div className="text-[14px] font-extrabold font-mono" style={{ color: "var(--color-acc)" }}>
            ~${totalEstimate}
          </div>

          <label className="block text-[9.5px] font-semibold uppercase tracking-wide mb-1 mt-2" style={{ color: "var(--color-t-3)" }}>
            Per-Scene Gate
          </label>
          <select
            value={gateMode}
            onChange={(e) => setGateMode(e.target.value)}
            className="w-full py-[7px] px-[10px] rounded-[7px] text-[10px] outline-none"
            style={{
              background: "var(--color-bg-3)",
              border: "1px solid var(--color-bdr)",
              color: "var(--color-t-1)",
              fontFamily: "var(--font-sans)",
            }}
          >
            <option value="auto">Auto — all scenes</option>
            <option value="gated">Gated — approve each</option>
          </select>
        </div>
      </div>
    </div>
  );
}
