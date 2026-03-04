"use client";

const S = {
  bg3: "var(--color-bg-3)", bg4: "var(--color-bg-4)",
  bdr: "var(--color-bdr)", t1: "var(--color-t-1)", t2: "var(--color-t-2)",
  t3: "var(--color-t-3)", t4: "var(--color-t-4)",
  acc: "var(--color-acc)", blu: "var(--color-blu)",
};

const PLATFORMS = [
  { icon: "📸", name: "Instagram", status: "✓ Connected", connected: true },
  { icon: "🎵", name: "TikTok", status: "✓ Connected", connected: true },
  { icon: "▶️", name: "YouTube", status: "✓ Connected", connected: true },
  { icon: "📘", name: "Facebook", status: "Connect", connected: false },
  { icon: "🐦", name: "Twitter/X", status: "Coming soon", connected: false, disabled: true },
];

const POSTS = [
  { content: "Product launch video", platforms: "📸🎵▶️", status: "✓ Sent", statusColor: S.acc, time: "2m ago" },
  { content: "Social batch (50 images)", platforms: "📸🎵", status: "⟳ Sending", statusColor: S.blu, time: "5m ago" },
  { content: "Tutorial intro", platforms: "▶️", status: "✓ Sent", statusColor: S.acc, time: "1h ago" },
];

export default function SocialPage() {
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px", marginBottom: 2 }}>📤 Social Posting</h1>
      <p style={{ fontSize: 11.5, color: S.t2, marginBottom: 16 }}>Post generated content to platforms via Zapier — schedule, customize per platform</p>

      {/* Platform Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 16 }}>
        {PLATFORMS.map(p => (
          <div key={p.name} style={{
            padding: 12, background: S.bg3, border: `1px solid ${p.connected ? S.acc : S.bdr}`,
            borderRadius: 8, textAlign: "center", cursor: "pointer", opacity: p.disabled ? 0.4 : 1,
          }}>
            <div style={{ fontSize: 22 }}>{p.icon}</div>
            <div style={{ fontSize: 10, fontWeight: 600, marginTop: 4 }}>{p.name}</div>
            <div style={{ fontSize: 8, color: p.connected ? S.acc : S.t4 }}>{p.status}</div>
          </div>
        ))}
      </div>

      {/* Recent Posts */}
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Recent Posts</div>
      <div style={{ border: `1px solid ${S.bdr}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px 80px", padding: "6px 12px", background: S.bg3, fontSize: 8.5, fontWeight: 600, color: S.t4 }}>
          <span>Content</span><span>Platforms</span><span>Status</span><span>Time</span>
        </div>
        {POSTS.map((post, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px 80px", padding: "8px 12px", borderTop: `1px solid ${S.bdr}`, fontSize: 10, alignItems: "center" }}>
            <span>{post.content}</span>
            <span>{post.platforms}</span>
            <span style={{ color: post.statusColor, fontSize: 9, fontWeight: 600 }}>{post.status}</span>
            <span style={{ fontSize: 9, color: S.t3 }}>{post.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
