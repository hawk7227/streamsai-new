"use client";

import { useState } from "react";
import { PLATFORM_SAFE_ZONES, PLATFORM_IDS } from "@/lib/safe-zones";

export default function SafeZonePanel() {
  const [adMode, setAdMode] = useState(false);

  return (
    <div style={{ marginBottom: 20, padding: 16, background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)" }}>
          Platform Safe Zones{" "}
          <span style={{ fontSize: "0.7rem", fontWeight: 400, color: "var(--text-muted)" }}>Auto content placement per platform</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => setAdMode(false)}
            style={{
              padding: "3px 8px", borderRadius: 4, fontSize: "0.65rem", fontWeight: 600, cursor: "pointer",
              background: !adMode ? "rgba(16,185,129,0.1)" : "transparent",
              color: !adMode ? "#10b981" : "var(--text-muted)",
              border: `1px solid ${!adMode ? "rgba(16,185,129,0.2)" : "var(--border)"}`,
            }}
          >Organic</button>
          <button
            onClick={() => setAdMode(true)}
            style={{
              padding: "3px 8px", borderRadius: 4, fontSize: "0.65rem", fontWeight: 600, cursor: "pointer",
              background: adMode ? "rgba(239,68,68,0.1)" : "transparent",
              color: adMode ? "#ef4444" : "var(--text-muted)",
              border: `1px solid ${adMode ? "rgba(239,68,68,0.2)" : "var(--border)"}`,
            }}
          >Ads</button>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", fontSize: "0.7rem", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th style={{ textAlign: "left", padding: "4px 6px", fontWeight: 600, color: "#10b981" }}>Platform</th>
              <th style={{ textAlign: "left", padding: "4px 6px", fontWeight: 600, color: "var(--text-muted)" }}>Canvas</th>
              <th style={{ textAlign: "left", padding: "4px 6px", fontWeight: 600, color: "#10b981" }}>Safe Zone</th>
              <th style={{ textAlign: "left", padding: "4px 6px", fontWeight: 600, color: "var(--text-muted)" }}>Ratio</th>
              <th style={{ textAlign: "left", padding: "4px 6px", fontWeight: 600, color: "var(--text-muted)" }}>Max</th>
              <th style={{ textAlign: "left", padding: "4px 6px", fontWeight: 600, color: "var(--text-muted)" }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {PLATFORM_IDS.map((id) => {
              const p = PLATFORM_SAFE_ZONES[id];
              if (!p) return null;
              const margins = adMode ? p.ads : p.organic;
              return (
                <tr key={id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "4px 6px", fontWeight: 600, color: "var(--text-primary)" }}>{p.name}</td>
                  <td style={{ padding: "4px 6px", fontFamily: "monospace", color: "var(--text-muted)" }}>{p.canvas.width}x{p.canvas.height}</td>
                  <td style={{ padding: "4px 6px", fontFamily: "monospace", color: "#10b981" }}>{p.safeZone.width}x{p.safeZone.height}</td>
                  <td style={{ padding: "4px 6px", color: "var(--text-muted)" }}>{p.ratio}</td>
                  <td style={{ padding: "4px 6px", color: "var(--text-muted)" }}>{p.maxDuration}</td>
                  <td style={{ padding: "4px 6px", color: "var(--text-muted)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.notes}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 8, padding: "6px 10px", background: "rgba(16,185,129,0.04)", borderRadius: 6, fontSize: "0.7rem", color: "var(--text-muted)" }}>
        <span style={{ color: "#10b981" }}>OK</span> Captions auto-placed inside safe zone &middot; Universal safe zone: 900&times;1160px (works on all vertical platforms)
      </div>
    </div>
  );
}
