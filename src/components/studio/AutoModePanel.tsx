"use client";

import { useState } from "react";

interface AutoModePanelProps {
  onRun: () => void;
}

export default function AutoModePanel({ onRun }: AutoModePanelProps) {
  const [budget, setBudget] = useState(200);
  const [qualityGate, setQualityGate] = useState(85);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState("Ready — AI generates, evaluates, auto-finalizes, auto-posts.");

  const handleRun = () => {
    setRunning(true);
    setProgress(0);
    setLog("Initializing auto pipeline...");

    // Simulate progress for demo
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 15;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setLog("✓ Pipeline complete — 3 videos, 12 images generated. 2 auto-posted.");
        setRunning(false);
      } else if (p > 60) {
        setLog(`Evaluating outputs… ${Math.round(p)}% — auto-finalizing scores ≥${qualityGate}%`);
      } else if (p > 30) {
        setLog(`Generating batch… ${Math.round(p)}%`);
      } else {
        setLog(`Planning shots… ${Math.round(p)}%`);
      }
      setProgress(Math.min(p, 100));
    }, 800);

    onRun();
  };

  return (
    <div className="mt-4">
      {/* Progress panel */}
      <div
        className="p-[10px] px-3.5 rounded-r1 mb-3"
        style={{
          background: "rgba(0,136,255,0.05)",
          border: "1px solid rgba(0,136,255,0.15)",
        }}
      >
        <div className="flex justify-between text-[11px]">
          <span className="font-semibold" style={{ color: "var(--color-blu)" }}>
            🤖 Automatic Mode
          </span>
          <span className="text-[10px]" style={{ color: "var(--color-t-3)" }}>
            Budget: {budget}cr • Gate: ≥{qualityGate}%
          </span>
        </div>
        <div
          className="h-[3px] rounded-[2px] overflow-hidden mt-1.5"
          style={{ background: "var(--color-bg-5)" }}
        >
          <div
            className="h-full rounded-[2px] transition-all"
            style={{
              width: `${progress}%`,
              background: "var(--color-blu)",
              transitionDuration: "500ms",
            }}
          />
        </div>
        <div className="text-[9px] mt-1" style={{ color: "var(--color-t-3)" }}>
          {log}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-3 items-end">
        <div>
          <label
            className="block text-[9.5px] font-semibold uppercase tracking-wide mb-1"
            style={{ color: "var(--color-t-3)" }}
          >
            Budget (credits)
          </label>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            min={10}
            max={10000}
            className="w-[120px] py-[7px] px-[10px] rounded-[7px] text-[10px] outline-none"
            style={{
              background: "var(--color-bg-3)",
              border: "1px solid var(--color-bdr)",
              color: "var(--color-t-1)",
              fontFamily: "var(--font-sans)",
            }}
          />
        </div>
        <div>
          <label
            className="block text-[9.5px] font-semibold uppercase tracking-wide mb-1"
            style={{ color: "var(--color-t-3)" }}
          >
            Quality Gate (%)
          </label>
          <input
            type="number"
            value={qualityGate}
            onChange={(e) => setQualityGate(Number(e.target.value))}
            min={0}
            max={100}
            className="w-[120px] py-[7px] px-[10px] rounded-[7px] text-[10px] outline-none"
            style={{
              background: "var(--color-bg-3)",
              border: "1px solid var(--color-bdr)",
              color: "var(--color-t-1)",
              fontFamily: "var(--font-sans)",
            }}
          />
        </div>
        <button
          onClick={handleRun}
          disabled={running}
          className="py-2 px-4 rounded-r1 text-[11px] font-semibold transition-all duration-fast"
          style={{
            background: running ? "var(--color-bg-4)" : "var(--color-blu)",
            color: running ? "var(--color-t-3)" : "#fff",
            border: "none",
            cursor: running ? "not-allowed" : "pointer",
            opacity: running ? 0.6 : 1,
          }}
        >
          {running ? "⟳ Running..." : "🤖 Run Full Auto Pipeline"}
        </button>
      </div>
    </div>
  );
}
