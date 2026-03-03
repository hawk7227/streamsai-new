"use client";

import { useState } from "react";

interface Character {
  id: string;
  name: string;
  refs: number;
  consistency: number;
  usedIn: number;
}

const MOCK_CHARACTERS: Character[] = [
  { id: "c1", name: "Alex \u2014 Spokesperson", refs: 4, consistency: 94, usedIn: 12 },
  { id: "c2", name: "Maya \u2014 Tutorial Host", refs: 3, consistency: 87, usedIn: 8 },
  { id: "c3", name: "Brand Mascot", refs: 5, consistency: 96, usedIn: 23 },
];

interface BrandColor {
  name: string;
  hex: string;
}

const BRAND_COLORS: BrandColor[] = [
  { name: "Primary", hex: "#6366f1" },
  { name: "Accent", hex: "#10b981" },
  { name: "Warning", hex: "#f59e0b" },
  { name: "Background", hex: "#07070e" },
];

export default function CharactersPage() {
  const [characters] = useState(MOCK_CHARACTERS);
  const [tab, setTab] = useState<"characters" | "brand">("characters");

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 4 }}>{"\u{1F464}"} Characters & Brand Kit</h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Identity lock across shots, brand consistency</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ padding: "8px 16px", borderRadius: 8, fontSize: "0.8rem", fontWeight: 600, background: "var(--bg-tertiary)", color: "var(--text-secondary)", border: "1px solid var(--border)", cursor: "pointer" }}>Team</button>
          <button style={{ padding: "8px 16px", borderRadius: 8, fontSize: "0.8rem", fontWeight: 600, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", border: "none", cursor: "pointer" }}>+ Character</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, padding: 3, background: "var(--bg-secondary)", borderRadius: 8, width: "fit-content" }}>
        <button onClick={() => setTab("characters")} style={{ padding: "6px 16px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", border: "none", fontFamily: "inherit", background: tab === "characters" ? "rgba(99,102,241,0.1)" : "transparent", color: tab === "characters" ? "#6366f1" : "var(--text-muted)" }}>
          Characters
        </button>
        <button onClick={() => setTab("brand")} style={{ padding: "6px 16px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", border: "none", fontFamily: "inherit", background: tab === "brand" ? "rgba(99,102,241,0.1)" : "transparent", color: tab === "brand" ? "#6366f1" : "var(--text-muted)" }}>
          Brand Kit
        </button>
      </div>

      {tab === "characters" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {characters.map((char) => (
            <div key={char.id} style={{ padding: 20, background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 12 }}>
              {/* Avatar placeholder */}
              <div style={{ width: 64, height: 64, borderRadius: 16, background: "var(--bg-tertiary)", display: "grid", placeItems: "center", fontSize: "1.5rem", opacity: 0.3, marginBottom: 12 }}>
                {"\u{1F464}"}
              </div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 4 }}>{char.name}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 12 }}>
                {char.refs} refs &middot; Used in {char.usedIn} renders
              </div>

              {/* Consistency meter */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", marginBottom: 4 }}>
                  <span style={{ color: "var(--text-muted)" }}>Consistency</span>
                  <span style={{ color: char.consistency >= 90 ? "#10b981" : "#f59e0b", fontWeight: 600 }}>{char.consistency}%</span>
                </div>
                <div style={{ height: 4, background: "var(--bg-tertiary)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${char.consistency}%`, background: char.consistency >= 90 ? "#10b981" : "#f59e0b", borderRadius: 2 }} />
                </div>
              </div>

              <div style={{ display: "flex", gap: 6 }}>
                <button style={{ flex: 1, padding: "6px 0", borderRadius: 6, fontSize: "0.7rem", fontWeight: 600, background: "var(--bg-tertiary)", color: "var(--text-secondary)", border: "1px solid var(--border)", cursor: "pointer" }}>Edit</button>
                <button style={{ flex: 1, padding: "6px 0", borderRadius: 6, fontSize: "0.7rem", fontWeight: 600, background: "rgba(99,102,241,0.08)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.2)", cursor: "pointer" }}>Use</button>
              </div>
            </div>
          ))}

          {/* Add Character Card */}
          <div style={{
            padding: 20, background: "var(--bg-secondary)", border: "1px dashed var(--border)",
            borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            cursor: "pointer", minHeight: 200,
          }}>
            <div style={{ fontSize: "2rem", opacity: 0.2, marginBottom: 8 }}>+</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Add Character</div>
            <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)" }}>Upload 2-5 reference images</div>
          </div>
        </div>
      )}

      {tab === "brand" && (
        <div>
          {/* Brand Colors */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: 12 }}>Brand Colors</div>
            <div style={{ display: "flex", gap: 12 }}>
              {BRAND_COLORS.map((c) => (
                <div key={c.name} style={{ textAlign: "center" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: c.hex, marginBottom: 4, border: "2px solid var(--border)" }} />
                  <div style={{ fontSize: "0.7rem", fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontFamily: "monospace" }}>{c.hex}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Voice Profiles */}
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: 12 }}>Voice Profiles</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { name: "Brand Voice \u2014 Male", provider: "ElevenLabs", tone: "Confident, warm" },
                { name: "Tutorial Voice \u2014 Female", provider: "ElevenLabs", tone: "Clear, friendly" },
                { name: "Narrator", provider: "OpenAI TTS", tone: "Professional, neutral" },
              ].map((vp) => (
                <div key={vp.name} style={{ padding: 14, background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 10 }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: 4 }}>{vp.name}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{vp.provider} &middot; {vp.tone}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
