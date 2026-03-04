"use client";

import { useState } from "react";

const S = {
  bg3: "var(--color-bg-3)", bg4: "var(--color-bg-4)",
  bdr: "var(--color-bdr)", t1: "var(--color-t-1)", t2: "var(--color-t-2)", t3: "var(--color-t-3)", t4: "var(--color-t-4)",
  acc: "var(--color-acc)", accg: "var(--color-acc-glow)", red: "#ef4444",
  mono: "'JetBrains Mono', var(--mono), monospace",
};

type Tab = "providers" | "billing" | "team" | "general";

const PROVIDERS = [
  { name: "Runway", icon: "🎬", status: "Active", models: "Gen-4, Gen-4 Turbo", key: "sk-run-••••••3f" },
  { name: "ElevenLabs", icon: "🎙️", status: "Active", models: "Turbo v2.5, Flash", key: "sk-el-••••••8a" },
  { name: "OpenAI", icon: "🤖", status: "Active", models: "DALL-E 3, GPT-4o, TTS", key: "sk-proj-••••••2c" },
  { name: "Stability AI", icon: "🖼️", status: "Active", models: "SDXL, SD3", key: "sk-stab-••••••7d" },
  { name: "Google (Veo)", icon: "▶️", status: "Pending", models: "Veo 3, Imagen 3", key: "—" },
  { name: "Luma AI", icon: "🌀", status: "Not set", models: "Ray2, Dream Machine", key: "—" },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("providers");

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px", marginBottom: 2 }}>⚙️ Settings</h1>
      <p style={{ fontSize: 11.5, color: S.t2, marginBottom: 16 }}>API keys, provider config, billing, team management</p>

      <div style={{ display: "inline-flex", background: S.bg3, borderRadius: 7, padding: 2, gap: 1, marginBottom: 16 }}>
        {(["providers", "billing", "team", "general"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "6px 13px", borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: "pointer",
              color: tab === t ? "#000" : S.t3, background: tab === t ? S.acc : "transparent",
              border: "none", fontFamily: "inherit", textTransform: "capitalize",
            }}
          >{t}</button>
        ))}
      </div>

      {tab === "providers" && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: S.t3, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>API Providers</div>
          <div style={{ border: `1px solid ${S.bdr}`, borderRadius: 8, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "180px 80px 1fr 140px", padding: "5px 10px", background: S.bg3, fontSize: 7.5, fontWeight: 600, color: S.t4 }}>
              <span>Provider</span><span>Status</span><span>Models</span><span>API Key</span>
            </div>
            {PROVIDERS.map(p => (
              <div key={p.name} style={{ display: "grid", gridTemplateColumns: "180px 80px 1fr 140px", padding: "8px 10px", borderTop: `1px solid ${S.bdr}`, fontSize: 9, alignItems: "center" }}>
                <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>{p.icon} {p.name}</span>
                <span style={{ fontSize: 8, fontWeight: 600, color: p.status === "Active" ? S.acc : p.status === "Pending" ? "#f59e0b" : S.t4 }}>{p.status === "Active" ? "✓ " : ""}{p.status}</span>
                <span style={{ fontSize: 8, color: S.t3 }}>{p.models}</span>
                <span style={{ fontFamily: S.mono, fontSize: 8, color: S.t3 }}>{p.key}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "billing" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
            {[
              { label: "Credits Left", value: "1,350" },
              { label: "Plan", value: "Pro" },
              { label: "Spend MTD", value: "$24.80" },
            ].map(s => (
              <div key={s.label} style={{ padding: 12, background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: 8, textAlign: "center" }}>
                <div style={{ fontSize: 8, fontWeight: 600, color: S.t3, textTransform: "uppercase", marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: 10, background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}>Credit Usage (30d)</div>
            <div style={{ height: 6, background: S.bg4, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: "67.5%", background: `linear-gradient(90deg, ${S.acc}, var(--color-blu))`, borderRadius: 3 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: S.t3, marginTop: 4 }}>
              <span>1,350 used</span><span>2,000 limit</span>
            </div>
          </div>
        </div>
      )}

      {tab === "team" && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: S.t3, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>Team Members</div>
          {[
            { name: "Marcus", role: "Owner", initial: "M", color: S.acc },
            { name: "Jordan", role: "Editor", initial: "J", color: "var(--color-blu)" },
            { name: "Sam", role: "Viewer", initial: "S", color: "#8b5cf6" },
          ].map(m => (
            <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: 8, marginBottom: 4 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: m.color, display: "grid", placeItems: "center", fontSize: 10, fontWeight: 700, color: m.color === S.acc ? "#000" : "#fff" }}>{m.initial}</div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600 }}>{m.name}</div>
                <div style={{ fontSize: 8, color: S.t3 }}>{m.role}</div>
              </div>
            </div>
          ))}
          <button style={{ marginTop: 8, padding: "8px 16px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: S.acc, color: "#000", border: "none", cursor: "pointer", fontFamily: "inherit" }}>+ Invite Member</button>
        </div>
      )}

      {tab === "general" && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: S.t3, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>Preferences</div>
          {[
            { label: "Default model route", value: "Auto (best per shot)" },
            { label: "Quality gate threshold", value: "85%" },
            { label: "Auto-post on completion", value: "Enabled" },
            { label: "Notification method", value: "Push + Email" },
            { label: "Theme", value: "Dark" },
            { label: "Timezone", value: "America/Phoenix" },
          ].map(row => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: 8, marginBottom: 4, fontSize: 10 }}>
              <span style={{ fontWeight: 600 }}>{row.label}</span>
              <span style={{ color: S.t3, fontFamily: S.mono, fontSize: 9 }}>{row.value}</span>
            </div>
          ))}
          <div style={{ marginTop: 12, padding: "8px 10px", background: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.12)", borderRadius: 8, fontSize: 9, color: S.red }}>
            <strong>Danger Zone</strong> — Delete account, revoke all API keys, export data
          </div>
        </div>
      )}
    </div>
  );
}
