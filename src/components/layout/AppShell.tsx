'use client';

import { useState, useCallback } from 'react';
import Sidebar from './Sidebar';
import CopilotOverlay from '../copilot/CopilotOverlay';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [copilotOpen, setCopilotOpen] = useState(false);
  const toggleCopilot = useCallback(() => setCopilotOpen(p => !p), []);

  // Left sidebar 82px + Right tools 76px = 158px offset
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar onCopilotToggle={toggleCopilot} />
      <main style={{
        flex: 1, marginLeft: 158, padding: '32px 40px',
        minHeight: '100vh', maxWidth: 'calc(100vw - 158px)',
        transition: 'margin-left 0.2s ease',
      }}>
        {children}
      </main>
      <CopilotOverlay open={copilotOpen} onClose={() => setCopilotOpen(false)} />
    </div>
  );
}
