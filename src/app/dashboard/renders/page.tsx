"use client";

import { useState } from "react";

type JobSource = "ai" | "compose";
type JobStatus = "running" | "completed" | "failed" | "queued";
type FilterTab = "all" | "ai" | "compose" | "failed";

interface RenderJob {
  id: string;
  name: string;
  source: JobSource;
  status: JobStatus;
  progress: number;
  cost: string;
  duration: string;
  createdAt: string;
}

const MOCK_JOBS: RenderJob[] = [
  { id: "j1", name: "TikTok Reel \u2014 Product Launch", source: "ai", status: "running", progress: 67, cost: "12cr", duration: "0:30", createdAt: "2m ago" },
  { id: "j2", name: "YT Intro \u2014 Brand Logo", source: "compose", status: "completed", progress: 100, cost: "5cr", duration: "0:08", createdAt: "15m ago" },
  { id: "j3", name: "IG Story \u2014 Sale Promo", source: "ai", status: "completed", progress: 100, cost: "8cr", duration: "0:15", createdAt: "1h ago" },
  { id: "j4", name: "FB Reel \u2014 Tutorial Clip", source: "compose", status: "failed", progress: 45, cost: "0cr", duration: "0:22", createdAt: "2h ago" },
  { id: "j5", name: "Batch \u2014 5x Product Shots", source: "ai", status: "queued", progress: 0, cost: "25cr", duration: "0:30 est", createdAt: "just now" },
];

const STATUS_CONFIG: Record<JobStatus, { color: string; bg: string; label: string }> = {
  running: { color: "#3b82f6", bg: "rgba(59,130,246,0.08)", label: "Running" },
  completed: { color: "#10b981", bg: "rgba(16,185,129,0.08)", label: "Completed" },
  failed: { color: "#ef4444", bg: "rgba(239,68,68,0.08)", label: "Failed" },
  queued: { color: "#6b7280", bg: "rgba(107,114,128,0.08)", label: "Queued" },
};

const SOURCE_CONFIG: Record<JobSource, { color: string; label: string }> = {
  ai: { color: "#6366f1", label: "AI" },
  compose: { color: "#f59e0b", label: "Compose" },
};

export default function RendersPage() {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [jobs] = useState(MOCK_JOBS);

  const filtered = jobs.filter((j) => {
    if (filter === "all") return true;
    if (filter === "failed") return j.status === "failed";
    return j.source === filter;
  });

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 4 }}>{"\u25EB"} Renders Dashboard</h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>All jobs from AI + Composition pipelines — real-time via SSE</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "4px 10px", background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: 6, fontSize: "0.7rem", color: "var(--text-muted)" }}>
            <span style={{ color: "#10b981" }}>{"\u25CF"}</span> SSE Live
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "4px 10px", background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: 6, fontSize: "0.7rem", color: "var(--text-muted)" }}>
            {"\u{1F514}"} Notify: Push + Email
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, padding: 3, background: "var(--bg-secondary)", borderRadius: 8, width: "fit-content" }}>
        {(["all", "ai", "compose", "failed"] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              padding: "6px 16px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 600,
              cursor: "pointer", border: "none", fontFamily: "inherit",
              background: filter === tab ? (tab === "failed" ? "rgba(239,68,68,0.1)" : "rgba(99,102,241,0.1)") : "transparent",
              color: filter === tab ? (tab === "failed" ? "#ef4444" : "#6366f1") : "var(--text-muted)",
              transition: "all 0.15s",
            }}
          >
            {tab === "all" ? "All" : tab === "failed" ? "Failed" : tab.toUpperCase()}
            {tab === "all" && <span style={{ marginLeft: 4, opacity: 0.5 }}>({jobs.length})</span>}
          </button>
        ))}
      </div>

      {/* Job Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((job) => {
          const sc = STATUS_CONFIG[job.status];
          const src = SOURCE_CONFIG[job.source];
          return (
            <div key={job.id} style={{
              display: "flex", alignItems: "center", gap: 16, padding: 16,
              background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 12,
            }}>
              {/* Source badge */}
              <span style={{ padding: "3px 8px", borderRadius: 4, fontSize: "0.65rem", fontWeight: 700, color: src.color, background: `${src.color}12` }}>
                {src.label}
              </span>

              {/* Job info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>{job.name}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{job.duration} &middot; {job.cost} &middot; {job.createdAt}</div>
              </div>

              {/* Progress */}
              {job.status === "running" && (
                <div style={{ width: 120 }}>
                  <div style={{ height: 4, background: "var(--bg-tertiary)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${job.progress}%`, background: "#3b82f6", borderRadius: 2 }} />
                  </div>
                  <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: 2, textAlign: "right" }}>{job.progress}%</div>
                </div>
              )}

              {/* Status */}
              <span style={{ padding: "4px 10px", borderRadius: 6, fontSize: "0.7rem", fontWeight: 600, background: sc.bg, color: sc.color }}>
                {sc.label}
              </span>

              {/* Actions */}
              <div style={{ display: "flex", gap: 4 }}>
                {job.status === "failed" && (
                  <button style={{ padding: "4px 10px", borderRadius: 4, fontSize: "0.65rem", fontWeight: 600, background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "none", cursor: "pointer" }}>Retry</button>
                )}
                {job.status === "running" && (
                  <button style={{ padding: "4px 10px", borderRadius: 4, fontSize: "0.65rem", fontWeight: 600, background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "none", cursor: "pointer" }}>Cancel</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
