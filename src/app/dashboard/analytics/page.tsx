"use client";

const S = {
  bg2: "var(--color-bg-2)", bg3: "var(--color-bg-3)", bg4: "var(--color-bg-4)",
  bdr: "var(--color-bdr)", t1: "var(--color-t-1)", t2: "var(--color-t-2)", t3: "var(--color-t-3)", t4: "var(--color-t-4)",
  acc: "var(--color-acc)", accg: "var(--color-acc-glow)", blu: "var(--color-blu)", pur: "#8b5cf6", amb: "#f59e0b",
  mono: "'JetBrains Mono', var(--mono), monospace",
};

export default function AnalyticsPage() {
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px", marginBottom: 2 }}>📊 Analytics</h1>
      <p style={{ fontSize: 11.5, color: S.t2, marginBottom: 16 }}>Post-publish performance, A/B tests, version history, team collaboration</p>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Views", value: "124.8K", delta: "+23%", color: S.acc },
          { label: "Engage", value: "4.7%", delta: "+0.8%", color: S.acc },
          { label: "Complete", value: "68%", delta: "stable", color: S.amb },
          { label: "Published", value: "47", delta: "month", color: S.t3 },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: 8, textAlign: "center" }}>
            <div style={{ fontSize: 8, fontWeight: 600, color: S.t3, textTransform: "uppercase", marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{s.value}</div>
            <div style={{ fontSize: 8, color: s.color }}>{s.delta}</div>
          </div>
        ))}
      </div>

      {/* Top Videos Table */}
      <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 5 }}>Top Videos</div>
      <div style={{ border: `1px solid ${S.bdr}`, borderRadius: 6, overflow: "hidden", marginBottom: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 55px 55px 55px 55px 45px", padding: "4px 8px", background: S.bg3, fontSize: 7, fontWeight: 600, color: S.t4 }}>
          <span>Video</span><span>Views</span><span>Eng</span><span>Done</span><span>Click</span><span>AB</span>
        </div>
        {[
          { name: "Product launch", views: "34K", eng: "6.1%", done: "72%", click: "1.2K", ab: "A wins", abColor: S.acc },
          { name: "Tutorial", views: "28K", eng: "5.3%", done: "81%", click: "890", ab: "-", abColor: S.t3 },
          { name: "Social batch", views: "19K", eng: "4.2%", done: "65%", click: "420", ab: "Test", abColor: S.blu },
        ].map(row => (
          <div key={row.name} style={{ display: "grid", gridTemplateColumns: "2fr 55px 55px 55px 55px 45px", padding: "5px 8px", borderTop: `1px solid ${S.bdr}`, fontSize: 8 }}>
            <span style={{ fontWeight: 600 }}>{row.name}</span>
            <span>{row.views}</span><span>{row.eng}</span><span>{row.done}</span><span>{row.click}</span>
            <span style={{ color: row.abColor, fontSize: 7 }}>{row.ab}</span>
          </div>
        ))}
      </div>

      {/* Platforms + A/B Test */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}>Platforms</div>
          <div style={{ padding: 6, background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: 5, fontSize: 8, lineHeight: 1.6 }}>
            Instagram 48K 5.1%<br />TikTok 52K 4.9%<br />YouTube 25K 3.8%
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}>A/B Test</div>
          <div style={{ padding: 6, background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: 5 }}>
            <div style={{ fontSize: 8.5, fontWeight: 600, marginBottom: 2 }}>Hook Test</div>
            <div style={{ display: "flex", gap: 4, marginBottom: 2 }}>
              <div style={{ flex: 1, padding: "2px 4px", background: S.accg, borderRadius: 3, fontSize: 7 }}><b style={{ color: S.acc }}>A Question</b> 6.1%</div>
              <div style={{ flex: 1, padding: "2px 4px", background: S.bg2, borderRadius: 3, fontSize: 7 }}><b>B Stat</b> 4.8%</div>
            </div>
            <div style={{ fontSize: 7, color: S.acc }}>A wins +27%</div>
          </div>
        </div>
      </div>

      {/* Version History */}
      <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}>Version History</div>
      <div style={{ padding: 6, background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: 5, fontSize: 8, color: S.t2, lineHeight: 1.7, marginBottom: 12 }}>
        <span style={{ fontFamily: S.mono, color: S.t3 }}>v3</span> CTA card (2h ago)<br />
        <span style={{ fontFamily: S.mono, color: S.t3 }}>v2</span> Hook swap (yesterday)<br />
        <span style={{ fontFamily: S.mono, color: S.t3 }}>v1</span> Initial (2d ago)
      </div>

      {/* Team */}
      <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}>Team</div>
      <div style={{ display: "flex", gap: 5, padding: 6, background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: 5, alignItems: "center" }}>
        {[
          { initial: "M", bg: S.acc, color: "#000" },
          { initial: "J", bg: S.blu, color: "#fff" },
          { initial: "S", bg: S.pur, color: "#fff" },
        ].map(m => (
          <div key={m.initial} style={{ width: 18, height: 18, borderRadius: "50%", background: m.bg, display: "grid", placeItems: "center", fontSize: 8, fontWeight: 700, color: m.color }}>{m.initial}</div>
        ))}
        <span style={{ fontSize: 7.5, color: S.t3 }}>3 members, shared, live sync</span>
        <button style={{ marginLeft: "auto", padding: "3px 8px", borderRadius: 4, fontSize: 8, fontWeight: 600, background: S.bg4, color: S.t2, border: `1px solid ${S.bdr}`, cursor: "pointer", fontFamily: "inherit" }}>Invite</button>
      </div>
    </div>
  );
}
