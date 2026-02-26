'use client';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Workspace {
  id: string; name: string; tier: string; enabled_tools: string[]; created_at: string;
}

interface WorkspaceLimits {
  credits_balance: number; credits_monthly_allowance: number; max_concurrent_total: number;
}

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [limits, setLimits] = useState<WorkspaceLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data: ws, error: wsErr } = await supabase.from('workspaces').select('*').eq('user_id', user.id).single();
    if (wsErr) { setError(wsErr.message); setLoading(false); return; }
    setWorkspace(ws);
    const { data: lim } = await supabase.from('workspace_limits').select('*').eq('workspace_id', ws.id).single();
    if (lim) setLimits(lim);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Real-time credit subscription via Supabase Realtime
  useEffect(() => {
    if (!workspace) return;
    const supabase = createClient();
    const channel = supabase.channel('credits-realtime').on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'workspace_limits',
      filter: `workspace_id=eq.${workspace.id}`,
    }, (payload) => {
      const updated = payload.new as WorkspaceLimits;
      setLimits(prev => prev ? { ...prev, ...updated } : updated);
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [workspace]);

  // Also poll every 15s as fallback
  useEffect(() => {
    if (!workspace) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/workspace/credits');
        if (res.ok) {
          const data = await res.json();
          setLimits(prev => prev ? { ...prev, credits_balance: data.credits_balance, credits_monthly_allowance: data.credits_monthly_allowance } : prev);
        }
      } catch (e) { console.error('[useWorkspace] Credit poll failed:', e); }
    }, 15000);
    return () => clearInterval(interval);
  }, [workspace]);

  return { workspace, limits, loading, error, refresh: load };
}
