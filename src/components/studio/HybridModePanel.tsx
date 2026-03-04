"use client";

export interface HybridStep {
  id: string;
  label: string;
  icon: string;
  provider: string;
  status: "done" | "awaiting" | "pending";
  cost?: string;
  score?: number;
  duration?: string;
  body?: string;
}

interface HybridModePanelProps {
  steps: HybridStep[];
  onApprove: (stepId: string) => void;
  onEdit: (stepId: string) => void;
  onRegen: (stepId: string) => void;
  onSkip: (stepId: string) => void;
}

export default function HybridModePanel({
  steps,
  onApprove,
  onEdit,
  onRegen,
  onSkip,
}: HybridModePanelProps) {
  const totalSteps = steps.length;
  const completedCount = steps.filter((s) => s.status === "done").length;
  const awaitingStep = steps.find((s) => s.status === "awaiting");
  const progressPercent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  return (
    <div className="mt-4">
      {/* Progress bar */}
      <div
        className="p-[10px] px-3.5 rounded-r1 mb-3"
        style={{
          background: "var(--color-acc-glow)",
          border: "1px solid rgba(0,255,136,0.1)",
        }}
      >
        <div className="flex justify-between text-[11px]">
          <span className="font-semibold">Hybrid Pipeline</span>
          <span style={{ color: "var(--color-amb)" }}>
            {awaitingStep
              ? `Step ${steps.indexOf(awaitingStep) + 1} of ${totalSteps} — Awaiting Approval`
              : completedCount === totalSteps
                ? "Complete"
                : "Processing..."}
          </span>
        </div>
        <div
          className="h-[3px] rounded-[2px] overflow-hidden mt-1.5"
          style={{ background: "var(--color-bg-5)" }}
        >
          <div
            className="h-full rounded-[2px] transition-all"
            style={{
              width: `${progressPercent}%`,
              background: "var(--color-acc)",
              transitionDuration: "500ms",
            }}
          />
        </div>
      </div>

      {/* Steps */}
      {steps.map((step) => {
        if (step.status === "done") {
          return (
            <div
              key={step.id}
              className="py-2 px-3 rounded-[7px] mb-1.5 flex items-center gap-2 text-[11px]"
              style={{
                background: "rgba(0,255,136,0.03)",
                border: "1px solid rgba(0,255,136,0.08)",
              }}
            >
              <span style={{ color: "var(--color-acc)" }}>✓</span>
              <strong>{step.label}</strong>
              <span style={{ color: "var(--color-t-3)" }}>— {step.provider}</span>
              <span className="ml-auto text-[9px]" style={{ color: "var(--color-acc)" }}>
                Approved — {step.cost}
              </span>
            </div>
          );
        }

        if (step.status === "awaiting") {
          return (
            <div
              key={step.id}
              className="rounded-r2 p-3.5 mb-[10px] animate-fade-up"
              style={{
                background: "var(--color-bg-3)",
                border: "1px solid rgba(0,255,136,0.15)",
              }}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-2">
                <span className="text-[12px] font-bold">
                  {step.icon} {step.label}
                </span>
                <span
                  className="text-[9px] font-semibold py-[3px] px-[7px] rounded-[5px]"
                  style={{
                    background: "rgba(255,170,0,0.08)",
                    color: "var(--color-amb)",
                  }}
                >
                  ⏳ Awaiting
                </span>
              </div>

              {/* Body */}
              {step.body && (
                <div
                  className="p-[10px] rounded-[7px] mb-2 text-[11px] leading-relaxed max-h-[100px] overflow-y-auto"
                  style={{
                    background: "var(--color-bg-2)",
                    color: "var(--color-t-2)",
                  }}
                >
                  {step.body}
                </div>
              )}

              {/* Meta chips */}
              <div className="flex gap-1.5 mb-[10px] text-[9px] flex-wrap" style={{ color: "var(--color-t-3)" }}>
                <span className="py-[2px] px-[7px] rounded-[4px]" style={{ background: "var(--color-bg-2)" }}>
                  {step.provider}
                </span>
                {step.cost && (
                  <span className="py-[2px] px-[7px] rounded-[4px]" style={{ background: "var(--color-bg-2)" }}>
                    {step.cost}
                  </span>
                )}
                {step.score !== undefined && (
                  <span className="py-[2px] px-[7px] rounded-[4px]" style={{ background: "var(--color-bg-2)" }}>
                    Score: {step.score}%
                  </span>
                )}
                {step.duration && (
                  <span className="py-[2px] px-[7px] rounded-[4px]" style={{ background: "var(--color-bg-2)" }}>
                    {step.duration}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-1.5">
                <button
                  onClick={() => onApprove(step.id)}
                  className="py-1.5 px-3 rounded-[6px] text-[10px] font-semibold transition-all duration-fast"
                  style={{ background: "var(--color-acc)", color: "#000", border: "none", cursor: "pointer" }}
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => onEdit(step.id)}
                  className="py-1.5 px-3 rounded-[6px] text-[10px] font-semibold transition-all duration-fast"
                  style={{
                    background: "var(--color-bg-4)",
                    color: "var(--color-t-2)",
                    border: "1px solid var(--color-bdr)",
                    cursor: "pointer",
                  }}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => onRegen(step.id)}
                  className="py-1.5 px-3 rounded-[6px] text-[10px] font-semibold transition-all duration-fast"
                  style={{
                    background: "rgba(255,68,85,0.08)",
                    color: "var(--color-red)",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  ↻ Regen
                </button>
                <button
                  onClick={() => onSkip(step.id)}
                  className="py-1.5 px-3 rounded-[6px] text-[10px] font-semibold transition-all duration-fast"
                  style={{
                    background: "transparent",
                    color: "var(--color-t-3)",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Skip →
                </button>
              </div>
            </div>
          );
        }

        // Pending
        return (
          <div
            key={step.id}
            className="py-2 px-3 rounded-[7px] mb-1.5 flex items-center gap-2 text-[11px]"
            style={{
              background: "var(--color-bg-3)",
              border: "1px solid var(--color-bdr)",
              color: "var(--color-t-3)",
            }}
          >
            ○ {step.label} — Waiting
          </div>
        );
      })}
    </div>
  );
}
