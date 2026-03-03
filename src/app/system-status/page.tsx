"use client";

import { useState, useEffect, useCallback } from "react";

interface ServiceHealth {
  name: string;
  status: "healthy" | "degraded" | "down" | "unconfigured";
  latencyMs: number | null;
  details: string;
}

interface SystemStatus {
  status: "healthy" | "degraded" | "down";
  timestamp: string;
  responseTimeMs: number;
  version: string;
  environment: string;
  region: string;
  services: ServiceHealth[];
  env: { valid: boolean; configuredCount: number; missingCount: number };
  summary: { total: number; healthy: number; degraded: number; down: number; unconfigured: number };
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  healthy: { bg: "rgba(16,185,129,0.08)", text: "#10b981", border: "rgba(16,185,129,0.3)" },
  degraded: { bg: "rgba(245,158,11,0.08)", text: "#f59e0b", border: "rgba(245,158,11,0.3)" },
  down: { bg: "rgba(239,68,68,0.08)", text: "#ef4444", border: "rgba(239,68,68,0.3)" },
  unconfigured: { bg: "rgba(107,114,128,0.08)", text: "#6b7280", border: "rgba(107,114,128,0.3)" },
};

const REFRESH_INTERVAL = 10_000; // 10s auto-refresh per build constitution

export default function SystemStatusPage() {
  const [data, setData] = useState<SystemStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/system-status", { cache: "no-store" });
      if (!res.ok && res.status !== 207 && res.status !== 503) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json: SystemStatus = await res.json();
      setData(json);
      setError(null);
      setLastRefresh(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => void fetchStatus(), REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [autoRefresh, fetchStatus]);

  const overallColor = data ? STATUS_COLORS[data.status] ?? STATUS_COLORS.down : STATUS_COLORS.down;
  const isFailRed = data?.status === "down" || data?.status === "degraded";

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 4, color: "white" }}>System Status</h1>
          <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>
            Admin-only &middot; Auto-refresh {REFRESH_INTERVAL / 1000}s &middot; Fail-red compliance
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{
            padding: "6px 14px", borderRadius: 8, fontSize: "0.8rem", fontWeight: 700,
            background: overallColor.bg, color: overallColor.text, border: `1px solid ${overallColor.border}`,
            animation: data?.status === "down" ? "pulse-red 1.5s infinite" : "none",
          }}>
            {loading ? "..." : data?.status.toUpperCase()}
          </span>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              padding: "6px 12px", borderRadius: 8, fontSize: "0.75rem", fontWeight: 600,
              background: autoRefresh ? "rgba(16,185,129,0.08)" : "rgba(107,114,128,0.08)",
              color: autoRefresh ? "#10b981" : "#6b7280",
              border: `1px solid ${autoRefresh ? "rgba(16,185,129,0.2)" : "rgba(107,114,128,0.2)"}`,
              cursor: "pointer",
            }}
          >
            {autoRefresh ? "● LIVE" : "○ Paused"}
          </button>
          <button
            onClick={() => void fetchStatus()}
            style={{
              padding: "6px 12px", borderRadius: 8, fontSize: "0.75rem", fontWeight: 600,
              background: "rgba(99,102,241,0.08)", color: "#6366f1",
              border: "1px solid rgba(99,102,241,0.2)", cursor: "pointer",
            }}
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{ padding: 16, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, marginBottom: 20, color: "#ef4444", fontSize: "0.85rem" }}>
          Error: {error}
        </div>
      )}

      {/* Fail-Red Banner */}
      {isFailRed && data && (
        <div style={{
          padding: 16, borderRadius: 12, marginBottom: 20,
          background: data.status === "down" ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.08)",
          border: `2px solid ${data.status === "down" ? "rgba(239,68,68,0.5)" : "rgba(245,158,11,0.3)"}`,
        }}>
          <div style={{ fontSize: "0.9rem", fontWeight: 700, color: data.status === "down" ? "#ef4444" : "#f59e0b", marginBottom: 4 }}>
            {data.status === "down" ? "SYSTEM DOWN" : "SYSTEM DEGRADED"} — {data.summary.down} down, {data.summary.degraded} degraded
          </div>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>
            No feature work until all services are green. Build constitution enforced.
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          {([
            { label: "Healthy", value: data.summary.healthy, color: "#10b981" },
            { label: "Degraded", value: data.summary.degraded, color: "#f59e0b" },
            { label: "Down", value: data.summary.down, color: "#ef4444" },
            { label: "Unconfigured", value: data.summary.unconfigured, color: "#6b7280" },
          ] as const).map((card) => (
            <div key={card.label} style={{
              padding: 16, borderRadius: 12,
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: card.color }}>{card.value}</div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>{card.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Services Table */}
      {data && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "0.85rem", fontWeight: 700, color: "white" }}>
            Services ({data.services.length})
          </div>
          {data.services.map((svc) => {
            const c = STATUS_COLORS[svc.status] ?? STATUS_COLORS.down;
            return (
              <div key={svc.name} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.03)",
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.text, flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: "0.85rem", fontWeight: 600, color: "white" }}>{svc.name}</div>
                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", fontFamily: "monospace", width: 80, textAlign: "right" }}>
                  {svc.latencyMs !== null ? `${svc.latencyMs}ms` : "—"}
                </div>
                <span style={{
                  padding: "3px 10px", borderRadius: 6, fontSize: "0.7rem", fontWeight: 600,
                  background: c.bg, color: c.text, border: `1px solid ${c.border}`,
                }}>
                  {svc.status}
                </span>
                <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", width: 180, textAlign: "right" }}>{svc.details}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Environment Validation */}
      {data && (
        <div style={{
          padding: 16, borderRadius: 12, marginBottom: 24,
          background: data.env.valid ? "rgba(16,185,129,0.04)" : "rgba(239,68,68,0.04)",
          border: `1px solid ${data.env.valid ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"}`,
        }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: data.env.valid ? "#10b981" : "#ef4444", marginBottom: 4 }}>
            Environment: {data.env.valid ? "Valid" : "INVALID"}
          </div>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>
            {data.env.configuredCount} configured &middot; {data.env.missingCount} missing
          </div>
        </div>
      )}

      {/* Metadata Footer */}
      {data && (
        <div style={{ display: "flex", gap: 24, fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
          <span>v{data.version}</span>
          <span>{data.environment}</span>
          <span>region: {data.region}</span>
          <span>response: {data.responseTimeMs}ms</span>
          <span>last: {lastRefresh?.toLocaleTimeString()}</span>
        </div>
      )}

      <style>{`
        @keyframes pulse-red {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
