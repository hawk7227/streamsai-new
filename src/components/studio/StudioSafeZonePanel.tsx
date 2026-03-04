"use client";

import { useState } from "react";
import { SAFE_ZONES, TARGET_PLATFORMS } from "./tool-data";

export default function StudioSafeZonePanel() {
  const [activePlatforms, setActivePlatforms] = useState<Set<string>>(
    new Set(TARGET_PLATFORMS.filter((p) => p.defaultOn).map((p) => p.id))
  );
  const [zoneType, setZoneType] = useState<"organic" | "ads">("organic");

  const togglePlatform = (id: string) => {
    setActivePlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div
      className="mt-3 rounded-r1 overflow-hidden"
      style={{ border: "1px solid var(--color-bdr)" }}
    >
      {/* Header */}
      <div
        className="py-[7px] px-[10px] flex justify-between items-center"
        style={{
          background: "var(--color-bg-3)",
          borderBottom: "1px solid var(--color-bdr)",
        }}
      >
        <div className="text-[10px] font-bold">
          Platform Safe Zones{" "}
          <span className="text-[8px] font-normal" style={{ color: "var(--color-t-3)" }}>
            Auto content placement per platform
          </span>
        </div>
        <div className="flex gap-[3px]">
          <button
            onClick={() => setZoneType("organic")}
            className="py-[2px] px-1.5 rounded-[3px] text-[7px] font-semibold"
            style={{
              background: zoneType === "organic" ? "var(--color-acc)" : "var(--color-bg-2)",
              color: zoneType === "organic" ? "#000" : "var(--color-t-3)",
              border: zoneType === "organic" ? "none" : "1px solid var(--color-bdr)",
            }}
          >
            Organic
          </button>
          <button
            onClick={() => setZoneType("ads")}
            className="py-[2px] px-1.5 rounded-[3px] text-[7px] font-semibold"
            style={{
              background: zoneType === "ads" ? "var(--color-acc)" : "var(--color-bg-2)",
              color: zoneType === "ads" ? "#000" : "var(--color-t-3)",
              border: zoneType === "ads" ? "none" : "1px solid var(--color-bdr)",
            }}
          >
            Ads
          </button>
        </div>
      </div>

      <div className="py-2 px-[10px]">
        {/* Target platforms */}
        <div className="text-[8px] font-semibold mb-[3px]" style={{ color: "var(--color-t-3)" }}>
          TARGET PLATFORMS (select all - generation auto-adjusts)
        </div>
        <div className="flex gap-[3px] flex-wrap mb-[7px]">
          {TARGET_PLATFORMS.map((p) => {
            const isOn = activePlatforms.has(p.id);
            return (
              <button
                key={p.id}
                onClick={() => togglePlatform(p.id)}
                className="py-[2px] px-1.5 rounded-[3px] text-[7px] font-semibold transition-all duration-fast"
                style={{
                  background: isOn ? "var(--color-acc)" : "var(--color-bg-3)",
                  color: isOn ? "#000" : "var(--color-t-2)",
                  border: `1px solid ${isOn ? "var(--color-acc)" : "var(--color-bdr)"}`,
                  cursor: "pointer",
                }}
              >
                {p.label}
              </button>
            );
          })}
          <button
            className="py-[2px] px-1.5 rounded-[3px] text-[7px] transition-all duration-fast"
            style={{
              background: "var(--color-bg-2)",
              color: "var(--color-acc)",
              border: "1px dashed var(--color-acc)",
              cursor: "pointer",
            }}
          >
            Universal Safe
          </button>
        </div>

        {/* Visual preview + table */}
        <div className="flex gap-2">
          {/* Phone preview */}
          <div
            className="relative w-[90px] h-[160px] rounded-[5px] overflow-hidden flex-shrink-0"
            style={{
              background: "#111",
              border: "1px solid var(--color-bdr-2)",
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[6px]" style={{ color: "rgba(255,255,255,0.12)" }}>1080×1920</span>
            </div>
            {/* Top dead zone */}
            <div className="absolute top-0 left-0 right-0" style={{ height: "15%", background: "rgba(255,50,50,0.3)", borderBottom: "1px dashed rgba(255,50,50,0.5)" }} />
            {/* Bottom dead zone */}
            <div className="absolute bottom-0 left-0 right-0" style={{ height: "20%", background: "rgba(255,50,50,0.3)", borderTop: "1px dashed rgba(255,50,50,0.5)" }} />
            {/* Right dead zone */}
            <div className="absolute right-0" style={{ top: "15%", width: "11%", bottom: "20%", background: "rgba(255,50,50,0.15)", borderLeft: "1px dashed rgba(255,50,50,0.4)" }} />
            {/* Safe zone */}
            <div className="absolute" style={{ top: "15%", left: "5%", right: "11%", bottom: "20%", border: "1.5px solid rgba(0,255,136,0.5)", borderRadius: "2px" }} />
            <div className="absolute text-[5px] font-semibold" style={{ top: "16%", left: "7%", color: "rgba(0,255,136,0.7)" }}>SAFE</div>
            <div className="absolute text-[4px]" style={{ top: "3%", left: "4%", color: "rgba(255,100,100,0.8)" }}>username</div>
            <div className="absolute text-[4px]" style={{ bottom: "4%", left: "4%", color: "rgba(255,100,100,0.8)" }}>caption/CTA</div>
            <div className="absolute text-[3.5px]" style={{ top: "40%", right: "1%", color: "rgba(255,100,100,0.7)", writingMode: "vertical-lr" }}>icons</div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-[7px] border-collapse whitespace-nowrap">
              <thead>
                <tr style={{ background: "var(--color-bg-3)" }}>
                  {["Platform", "Canvas", "Ratio", "Safe Zone", "Top", "Bottom", "Left", "Right", "Max Dur"].map((h, i) => (
                    <th
                      key={h}
                      className="py-[2px] px-1 text-left font-semibold"
                      style={{
                        borderBottom: "1px solid var(--color-bdr)",
                        color: i === 3 ? "var(--color-acc)" : undefined,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SAFE_ZONES.map((z) => (
                  <tr
                    key={z.platform}
                    style={z.platform === "Universal" ? { background: "var(--color-bg-3)", fontWeight: 600 } : undefined}
                  >
                    <td className="py-[2px] px-1 font-semibold" style={z.platform === "Universal" ? { color: "var(--color-acc)" } : undefined}>{z.platform}</td>
                    <td className="py-[2px] px-1">{z.canvas}</td>
                    <td className="py-[2px] px-1">{z.ratio}</td>
                    <td className="py-[2px] px-1 font-semibold" style={{ color: "var(--color-acc)" }}>{z.safe}</td>
                    <td className="py-[2px] px-1">{z.top}</td>
                    <td className="py-[2px] px-1">{z.bottom}</td>
                    <td className="py-[2px] px-1">{z.left}</td>
                    <td className="py-[2px] px-1">{z.right}</td>
                    <td className="py-[2px] px-1">{z.maxDur}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Generation behavior */}
        <div
          className="mt-1.5 py-[5px] px-[7px] rounded-[4px] text-[7.5px]"
          style={{ background: "var(--color-bg-3)", color: "var(--color-t-2)" }}
        >
          <div className="font-bold mb-[2px] text-[8px]">Generation Behavior</div>
          <div className="grid grid-cols-2 gap-[3px]">
            {[
              "Captions auto-placed inside safe zone",
              "Logo/watermark pinned to safe corners",
              "CTA text above bottom dead zone",
              "Face detection keeps subjects centered",
              "Multi-platform: 1 render, N safe crops",
              "Red zone overlay preview before gen",
            ].map((text) => (
              <div key={text}>
                <span style={{ color: "var(--color-acc)" }}>OK</span> {text}
              </div>
            ))}
          </div>
        </div>

        {/* Enforce warning */}
        <div
          className="mt-[5px] py-[3px] px-[7px] rounded-[3px] text-[7px]"
          style={{
            background: "rgba(255,50,50,0.06)",
            border: "1px solid rgba(255,50,50,0.12)",
            color: "rgba(255,100,100,0.9)",
          }}
        >
          <strong>ENFORCE:</strong> No text/captions/logos/faces/CTAs in red dead zones. Pipeline validates before encoding. Violations block render.
        </div>
      </div>
    </div>
  );
}
