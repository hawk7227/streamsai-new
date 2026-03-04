"use client";

import { TOOLS, type ToolCodename } from "./tool-data";

interface ToolGridProps {
  selected: ToolCodename;
  onSelect: (codename: ToolCodename) => void;
}

export default function ToolGrid({ selected, onSelect }: ToolGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-3.5">
      {TOOLS.map((tool) => {
        const isActive = selected === tool.codename;
        return (
          <button
            key={tool.codename}
            onClick={() => onSelect(tool.codename)}
            className="p-3 rounded-r1 text-left transition-all duration-fast"
            style={{
              background: isActive ? "var(--color-acc-glow)" : "var(--color-bg-3)",
              border: `1px solid ${isActive ? "var(--color-acc)" : "var(--color-bdr)"}`,
            }}
          >
            <div className="text-lg mb-1">{tool.icon}</div>
            <div
              className="text-[11px] font-bold mb-0.5"
              style={{ color: isActive ? "var(--color-acc)" : "var(--color-t-1)" }}
            >
              {tool.label}
            </div>
            <div className="text-[9px]" style={{ color: "var(--color-t-3)" }}>
              {tool.description}
            </div>
            <div
              className="text-[9px] font-mono mt-1"
              style={{ color: "var(--color-acc)" }}
            >
              {tool.cost}
            </div>
          </button>
        );
      })}
    </div>
  );
}
