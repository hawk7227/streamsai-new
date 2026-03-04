"use client";

import { GATE_STAGES, type GateStage } from "./tool-data";

interface PreviewGatesProps {
  currentGate: GateStage;
  completedGates: GateStage[];
  onGateClick: (gate: GateStage) => void;
}

export default function StudioPreviewGates({
  currentGate,
  completedGates,
  onGateClick,
}: PreviewGatesProps) {
  return (
    <div className="mb-3.5">
      <label
        className="block text-[9.5px] font-semibold uppercase tracking-wide mb-1"
        style={{ color: "var(--color-t-3)" }}
      >
        Preview Gates
      </label>
      <div className="flex gap-1">
        {GATE_STAGES.map((gate) => {
          const isDone = completedGates.includes(gate.id);
          const isCurrent = currentGate === gate.id;
          const isFuture = !isDone && !isCurrent;

          let borderColor = "var(--color-bdr)";
          let bg = "var(--color-bg-3)";
          let opacity = 1;

          if (isDone) {
            borderColor = "rgba(0,255,136,0.2)";
            opacity = 0.6;
          } else if (isCurrent) {
            borderColor = "var(--color-acc)";
            bg = "var(--color-acc-glow)";
          }

          return (
            <button
              key={gate.id}
              onClick={() => onGateClick(gate.id)}
              className="flex-1 p-2.5 rounded-r1 text-center transition-all duration-fast"
              style={{
                border: `1px solid ${borderColor}`,
                background: bg,
                opacity,
                cursor: "pointer",
              }}
            >
              <div className="text-[10px] font-bold mb-[2px]">
                {isDone ? "✓" : isCurrent ? "→" : ""} {gate.label}
              </div>
              <div className="text-[8px]" style={{ color: "var(--color-t-3)" }}>
                {gate.description}
              </div>
              <div className="text-[9px] font-mono mt-[3px]" style={{ color: "var(--color-acc)" }}>
                {gate.cost}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
