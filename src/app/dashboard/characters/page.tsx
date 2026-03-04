"use client";

const S = {
  bg2: "var(--color-bg-2)", bg3: "var(--color-bg-3)", bg4: "var(--color-bg-4)",
  bdr: "var(--color-bdr)", bdr2: "var(--color-bdr-2)",
  t1: "var(--color-t-1)", t2: "var(--color-t-2)", t3: "var(--color-t-3)",
  acc: "var(--color-acc)", accg: "var(--color-acc-glow)",
};

const CHARACTERS = [
  { initial: "S", name: "Sarah", meta: "3 refs, 12 videos", locked: true },
  { initial: "A", name: "Alex", meta: "5 refs, 8 videos", locked: true },
];

export default function CharactersPage() {
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px", marginBottom: 2 }}>👤 Characters & Brand Kit</h1>
      <p style={{ fontSize: 11.5, color: S.t2, marginBottom: 12 }}>Identity lock across all generations. Upload refs, lock, reuse.</p>

      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <button style={{ padding: "5px 12px", borderRadius: 5, fontSize: 9, fontWeight: 700, background: S.bg4, color: S.t2, border: `1px solid ${S.bdr}`, cursor: "pointer", fontFamily: "inherit" }}>Team</button>
        <button style={{ padding: "5px 12px", borderRadius: 5, fontSize: 9, fontWeight: 700, background: S.acc, color: "#000", border: "none", cursor: "pointer", fontFamily: "inherit" }}>+ Character</button>
      </div>

      {/* Character Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 7, marginBottom: 16 }}>
        {CHARACTERS.map(c => (
          <div key={c.name} style={{ padding: 8, background: S.bg3, border: `1px solid ${c.locked ? S.acc : S.bdr}`, borderRadius: 12 }}>
            <div style={{ height: 50, background: S.bg2, borderRadius: 4, marginBottom: 4, display: "grid", placeItems: "center", fontSize: 16, fontWeight: 700 }}>{c.initial}</div>
            <div style={{ fontSize: 9, fontWeight: 600 }}>{c.name}</div>
            <div style={{ fontSize: 7, color: S.t3 }}>{c.meta}</div>
            {c.locked && (
              <span style={{ padding: "1px 4px", background: S.accg, borderRadius: 3, fontSize: 6.5, color: S.acc }}>Identity Locked</span>
            )}
          </div>
        ))}
        <div style={{
          padding: 8, background: S.bg3, border: `1px dashed ${S.bdr2}`, borderRadius: 12,
          display: "grid", placeItems: "center", minHeight: 80, cursor: "pointer",
        }}>
          <span style={{ fontSize: 8, color: S.t3 }}>+ Add</span>
        </div>
      </div>

      {/* Brand Kit */}
      <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 5 }}>Brand Kit</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
        <div style={{ padding: 6, background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: 5 }}>
          <div style={{ fontSize: 7.5, fontWeight: 600, color: S.t3 }}>LOGO</div>
          <div style={{ fontSize: 9, fontWeight: 800, color: S.acc }}>StreamsAI</div>
        </div>
        <div style={{ padding: 6, background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: 5 }}>
          <div style={{ fontSize: 7.5, fontWeight: 600, color: S.t3 }}>COLORS</div>
          <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: "#00ff88" }} />
            <div style={{ width: 12, height: 12, borderRadius: 2, background: "#0088ff" }} />
            <div style={{ width: 12, height: 12, borderRadius: 2, background: "#07070e", border: `1px solid ${S.bdr}` }} />
          </div>
        </div>
        <div style={{ padding: 6, background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: 5 }}>
          <div style={{ fontSize: 7.5, fontWeight: 600, color: S.t3 }}>TYPE</div>
          <div style={{ fontSize: 10, fontWeight: 800 }}>Outfit</div>
        </div>
        <div style={{ padding: 6, background: S.bg3, border: `1px solid ${S.bdr}`, borderRadius: 5 }}>
          <div style={{ fontSize: 7.5, fontWeight: 600, color: S.t3 }}>MOTION BRUSH</div>
          <div style={{ fontSize: 7, color: S.t3 }}>Paint to animate</div>
        </div>
      </div>
    </div>
  );
}
