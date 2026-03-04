"use client";

const S = {
  bg3: "var(--color-bg-3)", bg4: "var(--color-bg-4)",
  bdr: "var(--color-bdr)", t1: "var(--color-t-1)", t2: "var(--color-t-2)", t3: "var(--color-t-3)",
  acc: "var(--color-acc)", amb: "#f59e0b",
  mono: "'JetBrains Mono', var(--mono), monospace",
};

const PROVIDERS = [
  { icon: "🎬", name: "Runway (PHOENIX)", endpoint: "api.runwayml.com", status: "Healthy", p95: "12.4s", breaker: "Closed", statusColor: S.acc },
  { icon: "🖼️", name: "OpenAI DALL-E (PRISM)", endpoint: "api.openai.com", status: "Healthy", p95: "3.2s", breaker: null, statusColor: S.acc },
  { icon: "🎙️", name: "ElevenLabs (ORACLE)", endpoint: "api.elevenlabs.io", status: "Degraded", p95: "8.1s", breaker: "Half-Open", statusColor: S.amb },
];

const WEBHOOKS = [
  { icon: "📸", name: "Post to Instagram", url: "hooks.zapier.com/...8a1" },
  { icon: "🎵", name: "Post to TikTok", url: "hooks.zapier.com/...c3e" },
  { icon: "▶️", name: "Upload to YouTube", url: "hooks.zapier.com/...d91" },
];

const PAYLOAD = `{"event":"generation.completed","data":{"id":"gen_a8f3k","type":"video","pipeline":"ai","media_url":"https://cdn.streamsai.com/...final.mp4","caption":"...","quality_score":92,"cost_cents":50}}`;

export default function IntegrationsPage() {
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px", marginBottom: 2 }}>🔌 Integrations</h1>
      <p style={{ fontSize: 11.5, color: S.t2, marginBottom: 16 }}>Provider connections + Zapier webhooks — auto-post generated content</p>

      {/* AI Providers */}
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>AI Providers</div>
      {PROVIDERS.map(p => (
        <div key={p.name} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px",
          background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: 8, marginBottom: 4,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>{p.icon}</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: 9, color: S.t3, fontFamily: S.mono }}>{p.endpoint}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 9, fontWeight: 600, padding: "3px 7px", borderRadius: 5, background: `${p.statusColor}11`, color: p.statusColor }}>
              {p.status === "Healthy" ? "●" : "⚠"} {p.status}
            </span>
            <span style={{ fontSize: 8, color: S.t3, fontFamily: S.mono }}>p95: {p.p95}</span>
            {p.breaker && (
              <span style={{ fontSize: 7.5, padding: "2px 5px", background: `${p.statusColor}0a`, borderRadius: 3, color: p.statusColor }}>
                Breaker: {p.breaker}
              </span>
            )}
            <button style={{ padding: "3px 8px", borderRadius: 4, fontSize: 8, fontWeight: 600, background: S.bg4, color: S.t2, border: `1px solid ${S.bdr}`, cursor: "pointer", fontFamily: "inherit" }}>Probe</button>
          </div>
        </div>
      ))}

      {/* Zapier Webhooks */}
      <div style={{ fontSize: 12, fontWeight: 700, margin: "16px 0 8px" }}>Zapier Webhooks</div>
      {WEBHOOKS.map(w => (
        <div key={w.name} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px",
          background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: 8, marginBottom: 4,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>{w.icon}</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600 }}>{w.name}</div>
              <div style={{ fontSize: 9, color: S.t3, fontFamily: S.mono }}>{w.url}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 9, fontWeight: 600, padding: "3px 7px", borderRadius: 5, background: "rgba(0,255,136,.08)", color: S.acc }}>● Active</span>
            <button style={{ padding: "3px 8px", borderRadius: 4, fontSize: 8, fontWeight: 600, background: S.bg4, color: S.t2, border: `1px solid ${S.bdr}`, cursor: "pointer", fontFamily: "inherit" }}>Test</button>
          </div>
        </div>
      ))}
      <button style={{ marginTop: 8, padding: "8px 16px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: S.bg4, color: S.t2, border: `1px solid ${S.bdr}`, cursor: "pointer", fontFamily: "inherit" }}>+ Add Webhook</button>

      {/* Payload */}
      <div style={{ fontSize: 12, fontWeight: 700, margin: "16px 0 6px" }}>Webhook Payload</div>
      <pre style={{ padding: 10, background: "var(--color-bg-1)", borderRadius: 7, fontFamily: S.mono, fontSize: 9, color: S.t2, lineHeight: 1.8, overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{PAYLOAD}</pre>
    </div>
  );
}
