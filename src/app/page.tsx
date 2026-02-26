export default function Home() {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', background: '#0a0a0f', color: '#f5f5f7' }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        StreamsAI
      </h1>
      <p style={{ color: '#a0a0b0', marginTop: '0.5rem', fontSize: '1.1rem' }}>
        Enterprise AI Content Generation Platform
      </p>
      <p style={{ color: '#6b6b7b', marginTop: '2rem', fontSize: '0.85rem' }}>
        API ready at /api/generations
      </p>
    </main>
  );
}
