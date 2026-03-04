"use client";

import { useState } from "react";

const S = {
  bg2: "var(--color-bg-2)", bg3: "var(--color-bg-3)", bg4: "var(--color-bg-4)",
  bdr: "var(--color-bdr)", t1: "var(--color-t-1)", t2: "var(--color-t-2)", t3: "var(--color-t-3)",
  acc: "var(--color-acc)", blu: "var(--color-blu)", red: "#ef4444",
  mono: "'JetBrains Mono', var(--mono), monospace",
};

type Filter = "all" | "ai" | "compose" | "failed";
type JobStatus = "running" | "queued" | "done" | "failed";

interface Job {
  id: string; title: string; pipeline: "ai" | "compose"; icon: string;
  status: JobStatus; progress?: number; detail: string; cost: string;
  bg?: string;
}

const JOBS: Job[] = [
  { id: "r1", title: "Product launch — cinematic", pipeline: "ai", icon: "🎬", status: "running", progress: 78, detail: "PHOENIX • 3 clips", cost: "$1.50", bg: "linear-gradient(135deg,#1a0a2e,#0a1628)" },
  { id: "r2", title: "TikTok reel — product showcase", pipeline: "compose", icon: "🎬", status: "running", progress: 45, detail: "Remotion • 15s", cost: "—", bg: "linear-gradient(135deg,#0a1628,#1a2a0a)" },
  { id: "r3", title: "Social batch — 50 images", pipeline: "ai", icon: "🎬", status: "queued", detail: "FLUX • 50 jobs", cost: "$1.50" },
  { id: "r4", title: "Explainer video — AI trends", pipeline: "ai", icon: "🎬", status: "done", detail: "TITAN • 4 scenes", cost: "$3.20", bg: "linear-gradient(135deg,#2a1a0a,#0a0a2a)" },
  { id: "r5", title: "YouTube intro — StreamsAI", pipeline: "compose", icon: "🎬", status: "done", detail: "Remotion • 5s", cost: "—" },
  { id: "r6", title: "Thumbnail batch — retry", pipeline: "ai", icon: "🖼️", status: "failed", detail: "PRISM • rate limit", cost: "$0.00" },
];

const STATUS_STYLES: Record<JobStatus, { label: string; color: string; bg: string }> = {
  running: { label: "⟳", color: S.blu, bg: "rgba(59,130,246,.1)" },
  queued: { label: "⏳ Queued", color: "#f59e0b", bg: "rgba(245,158,11,.08)" },
  done: { label: "✓ Done", color: S.acc, bg: "var(--color-acc-glow)" },
  failed: { label: "✕ Failed", color: S.red, bg: "rgba(239,68,68,.08)" },
};

export default function RendersPage() {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = JOBS.filter(j => {
    if (filter === "all") return true;
    if (filter === "failed") return j.status === "failed";
    return j.pipeline === filter;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px", marginBottom: 2 }}>◫ Renders Dashboard</h1>
          <p style={{ fontSize: 11.5, color: S.t2 }}>All jobs from AI + Composition pipelines — real-time via SSE</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {/* SSE indicator */}
          <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "4px 8px", background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: 5, fontSize: 8, color: S.t3 }}>
            <span style={{ color: S.acc }}>●</span> SSE Live
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "4px 8px", background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: 5, fontSize: 8, color: S.t3 }}>
            🔔 Notify: Push + Email
          </div>
          {/* Filter tabs */}
          <div style={{ display: "inline-flex", background: S.bg3, borderRadius: 7, padding: 2, gap: 1 }}>
            {(["all", "ai", "compose", "failed"] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "6px 13px", borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: "pointer",
                  color: filter === f ? "#000" : S.t3,
                  background: filter === f ? S.acc : "transparent",
                  border: "none", fontFamily: "inherit", transition: "150ms",
                  textTransform: "capitalize",
                }}
              >{f === "ai" ? "AI" : f === "compose" ? "Compose" : f === "failed" ? "Failed" : "All"}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 16 }}>
        {[
          { label: "In Progress", value: "3", color: S.blu },
          { label: "Completed", value: "47", color: S.acc },
          { label: "Failed", value: "2", color: S.red },
          { label: "Total Spend", value: "$24.80", color: S.t1 },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: 8, textAlign: "center" }}>
            <div style={{ fontSize: 8, fontWeight: 600, color: S.t3, textTransform: "uppercase", marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Job Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 8 }}>
        {filtered.map(job => {
          const st = STATUS_STYLES[job.status];
          return (
            <div key={job.id} style={{ background: S.bg2, border: `1px solid ${S.bdr}`, borderRadius: 12, overflow: "hidden" }}>
              {/* Thumbnail area */}
              <div style={{
                height: 90, background: job.bg ?? S.bg3, display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
              }}>
                <span style={{ fontSize: 24, opacity: 0.4 }}>{job.icon}</span>
                {/* Pipeline badge */}
                <span style={{
                  position: "absolute", top: 6, left: 6, padding: "1px 5px", borderRadius: 3, fontSize: 7, fontWeight: 700,
                  background: job.pipeline === "ai" ? "rgba(99,102,241,.15)" : "rgba(59,130,246,.15)",
                  color: job.pipeline === "ai" ? "#6366f1" : S.blu,
                }}>{job.pipeline === "ai" ? "AI Pipeline" : "Compose"}</span>
                {/* Status badge */}
                <span style={{
                  position: "absolute", top: 6, right: 6, padding: "1px 5px", borderRadius: 3, fontSize: 7, fontWeight: 700,
                  background: st.bg, color: st.color,
                }}>{job.status === "running" ? `⟳ ${job.progress}%` : st.label}</span>
                {/* Progress bar */}
                {job.status === "running" && job.progress && (
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "rgba(0,0,0,.3)" }}>
                    <div style={{ height: "100%", width: `${job.progress}%`, background: S.acc, borderRadius: "0 2px 2px 0" }} />
                  </div>
                )}
              </div>
              {/* Info */}
              <div style={{ padding: "8px 10px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{job.title}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8.5, color: S.t3 }}>
                  <span>{job.detail}</span>
                  <span style={{ fontFamily: S.mono, fontWeight: 600 }}>{job.cost}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
