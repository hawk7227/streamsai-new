"use client";

export default function CharacterRef({ characterId, onChange }: {
  characterId: string | null;
  onChange: (id: string | null) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
      <div
        onClick={() => onChange(characterId ? null : "placeholder-id")}
        style={{
          width: 28, height: 28, borderRadius: 4, cursor: "pointer",
          background: characterId ? "rgba(16,185,129,0.1)" : "var(--bg-secondary)",
          border: characterId ? "1px solid rgba(16,185,129,0.3)" : "1px dashed var(--border)",
          display: "grid", placeItems: "center", fontSize: "0.75rem",
          color: characterId ? "#10b981" : "var(--text-muted)",
        }}
      >
        {characterId ? "\u2713" : "\u{1F464}"}
      </div>
      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
        {characterId ? "Character identity locked across shots" : "Character ref \u2014 identity lock across shots"}
      </span>
    </div>
  );
}
