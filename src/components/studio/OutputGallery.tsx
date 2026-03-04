"use client";

import type { JobStatus } from "./tool-data";

export interface GalleryJob {
  id: string;
  title: string;
  tool: string;
  type: "video" | "image" | "audio" | "voice";
  status: JobStatus;
  progress?: number;
  cost: string;
  duration?: string;
}

interface OutputGalleryProps {
  jobs: GalleryJob[];
}

const STATUS_CONFIG: Record<JobStatus, { label: string; className: string; bg: string; color: string }> = {
  done: { label: "✓ Done", className: "", bg: "rgba(0,255,136,0.08)", color: "var(--color-acc)" },
  running: { label: "⟳", className: "animate-pulse-live", bg: "rgba(0,136,255,0.08)", color: "var(--color-blu)" },
  queued: { label: "⏳ Queued", className: "", bg: "rgba(255,170,0,0.06)", color: "var(--color-amb)" },
  failed: { label: "✕ Failed", className: "", bg: "rgba(255,68,85,0.08)", color: "var(--color-red)" },
};

const TYPE_ICONS: Record<string, string> = {
  video: "🎬",
  image: "🖼️",
  audio: "🎵",
  voice: "🎙️",
};

export default function OutputGallery({ jobs }: OutputGalleryProps) {
  return (
    <div>
      <div className="text-[12px] font-bold mb-2">
        Output Gallery{" "}
        <span className="text-[9px] font-medium" style={{ color: "var(--color-t-3)" }}>
          — loads previous work on page open
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-[10px]">
        {jobs.map((job) => {
          const statusCfg = STATUS_CONFIG[job.status];
          return (
            <div
              key={job.id}
              className="rounded-r2 overflow-hidden cursor-pointer transition-all duration-fast"
              style={{
                background: "var(--color-bg-2)",
                border: "1px solid var(--color-bdr)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-bdr)")}
            >
              {/* Thumbnail area */}
              <div
                className="h-[120px] relative flex items-center justify-center"
                style={{
                  background: job.status === "done"
                    ? "linear-gradient(135deg, #1a0a2e, #0a1628)"
                    : "var(--color-bg-3)",
                }}
              >
                <span className="text-[28px] opacity-35">
                  {TYPE_ICONS[job.type] ?? "🎬"}
                </span>

                {/* Badge */}
                <span
                  className="absolute top-1.5 left-1.5 text-[7.5px] font-bold py-[2px] px-1.5 rounded-[4px] uppercase tracking-wide"
                  style={{
                    background: "rgba(136,85,255,0.12)",
                    color: "var(--color-pur)",
                  }}
                >
                  AI {job.type.charAt(0).toUpperCase() + job.type.slice(1)}
                </span>

                {/* Status */}
                <span
                  className={`absolute top-1.5 right-1.5 text-[8px] font-semibold py-[2px] px-1.5 rounded-[4px] ${statusCfg.className}`}
                  style={{
                    background: statusCfg.bg,
                    color: statusCfg.color,
                  }}
                >
                  {statusCfg.label}{job.status === "running" && job.progress !== undefined ? ` ${job.progress}%` : ""}
                </span>

                {/* Progress bar */}
                {job.status === "running" && job.progress !== undefined && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: "rgba(0,0,0,0.3)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${job.progress}%`,
                        background: "var(--color-acc)",
                        transitionDuration: "500ms",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="py-[10px] px-3">
                <div
                  className="text-[11.5px] font-semibold mb-[2px] overflow-hidden text-ellipsis whitespace-nowrap"
                >
                  {job.title}
                </div>
                <div className="flex justify-between text-[9px]" style={{ color: "var(--color-t-3)" }}>
                  <span>{job.tool}{job.duration ? ` • ${job.duration}` : ""}</span>
                  <span>{job.cost}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
