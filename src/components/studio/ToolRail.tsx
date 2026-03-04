"use client";

import { useState, useRef, useEffect } from "react";
import { TOOLS, type ToolCodename } from "./tool-data";

interface ToolRailProps {
  selected: ToolCodename;
  onSelect: (codename: ToolCodename) => void;
}

export default function ToolRail({ selected, onSelect }: ToolRailProps) {
  const [expandedTool, setExpandedTool] = useState<ToolCodename | null>(null);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  const handleToolClick = (codename: ToolCodename) => {
    onSelect(codename);
    setExpandedTool(expandedTool === codename ? null : codename);
  };

  // Close flyout on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        flyoutRef.current && !flyoutRef.current.contains(target) &&
        railRef.current && !railRef.current.contains(target)
      ) {
        setExpandedTool(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const expandedDef = expandedTool
    ? TOOLS.find((t) => t.codename === expandedTool)
    : null;

  // Collapsed: thin 16px strip with expand arrow
  if (railCollapsed) {
    return (
      <div className="relative flex-shrink-0" style={{ width: 16 }}>
        <div
          className="sticky top-0 flex items-start justify-center pt-2"
          style={{
            width: 16,
            height: "100%",
            borderRight: "1px solid var(--color-bdr)",
          }}
        >
          <button
            onClick={() => setRailCollapsed(false)}
            title="Expand tools"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-t-3)",
              fontSize: 10,
              padding: 0,
              lineHeight: 1,
            }}
          >
            ›
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-shrink-0" style={{ width: 44 }}>
      {/* Icon rail */}
      <div
        ref={railRef}
        className="sticky top-0 flex flex-col gap-[1px] py-1"
        style={{
          width: 44,
          background: "var(--color-bg-1)",
          borderRight: "1px solid var(--color-bdr)",
          borderRadius: "0 8px 8px 0",
        }}
      >
        {/* Collapse button */}
        <button
          onClick={() => { setRailCollapsed(true); setExpandedTool(null); }}
          title="Collapse tools"
          className="flex items-center justify-center mb-0.5"
          style={{
            width: 42,
            height: 20,
            borderRadius: 4,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--color-t-3)",
            fontSize: 10,
          }}
        >
          ‹
        </button>

        {TOOLS.map((tool) => {
          const isActive = selected === tool.codename;
          return (
            <button
              key={tool.codename}
              onClick={() => handleToolClick(tool.codename)}
              title={`${tool.label} — ${tool.description} (${tool.cost})`}
              className="relative flex items-center justify-center"
              style={{
                width: 42,
                height: 34,
                borderRadius: 6,
                background: isActive ? "var(--color-acc-glow)" : "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: 15,
                transition: "all 150ms",
              }}
            >
              {tool.icon}
              {isActive && (
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 2.5,
                    height: 16,
                    borderRadius: 2,
                    background: "var(--color-acc)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Flyout panel */}
      {expandedDef && (
        <div
          ref={flyoutRef}
          className="absolute top-0 z-40"
          style={{
            left: 46,
            width: 220,
            background: "var(--color-bg-2)",
            border: "1px solid var(--color-bdr-2)",
            borderRadius: 10,
            padding: 12,
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            animation: "fadeIn 120ms ease-out",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[18px]">{expandedDef.icon}</span>
            <div>
              <div className="text-[12px] font-bold" style={{ color: "var(--color-t-1)" }}>
                {expandedDef.label}
              </div>
              <div className="text-[9px]" style={{ color: "var(--color-t-3)" }}>
                {expandedDef.description}
              </div>
            </div>
          </div>
          <div
            className="text-[10px] font-mono font-semibold mb-2"
            style={{ color: "var(--color-acc)" }}
          >
            {expandedDef.cost}
          </div>
          <div className="text-[8px] uppercase font-semibold tracking-wider mb-1.5" style={{ color: "var(--color-t-4)" }}>
            Category
          </div>
          <div
            className="text-[10px] py-1 px-2 rounded inline-block mb-2"
            style={{
              background: "var(--color-bg-3)",
              color: "var(--color-t-2)",
              border: "1px solid var(--color-bdr)",
            }}
          >
            {expandedDef.category}
          </div>
          <button
            onClick={() => setExpandedTool(null)}
            className="w-full py-1.5 rounded text-[10px] font-semibold mt-1"
            style={{
              background: "var(--color-acc)",
              color: "#000",
              border: "none",
              cursor: "pointer",
            }}
          >
            Select {expandedDef.label}
          </button>
        </div>
      )}
    </div>
  );
}
