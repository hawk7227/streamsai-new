'use client';

import { useState, useEffect, useCallback } from 'react';

type TriggerType = 'schedule' | 'webhook' | 'credit_balance' | 'pipeline_complete';

interface AutomationItem {
  id: string; name: string; description: string | null; is_active: boolean;
  trigger_type: TriggerType; trigger_config: Record<string, unknown>;
  action_config: Record<string, unknown>;
  last_run_at: string | null; run_count: number; total_cost_credits: number;
}

interface AutomationRunItem {
  id: string; automation_id: string; status: string;
  trigger_event: string; generations_created: number;
  cost_credits: number; error: string | null;
  started_at: string; completed_at: string | null;
  automation_name?: string;
}

const triggerColors: Record<TriggerType, string> = {
  schedule: '#3b82f6', webhook: '#8b5cf6', credit_balance: '#f59e0b', pipeline_complete: '#10b981',
};
const triggerIcons: Record<TriggerType, string> = {
  schedule: '⏰', webhook: '🔗', credit_balance: '💰', pipeline_complete: '✓',
};
const statusColors: Record<string, string> = {
  completed: '#10b981', failed: '#ef4444', running: '#3b82f6', partial: '#f59e0b',
};

function formatTrigger(a: AutomationItem): string {
  if (a.trigger_type === 'schedule' && a.trigger_config.cron) return `Cron: ${a.trigger_config.cron}`;
  if (a.trigger_type === 'webhook') return `Webhook: /api/automations/webhook/${a.id.slice(0, 8)}`;
  if (a.trigger_type === 'credit_balance' && a.trigger_config.threshold) return `Balance < ${a.trigger_config.threshold} credits`;
  if (a.trigger_type === 'pipeline_complete') return `Quality threshold: ≥${a.trigger_config.quality_score_min ?? 85}%`;
  return a.trigger_type;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
  return `${Math.floor(diff / 86400000)} days ago`;
}

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<AutomationItem[]>([]);
  const [runs, setRuns] = useState<AutomationRunItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTrigger, setNewTrigger] = useState<TriggerType>('schedule');
  const [newCron, setNewCron] = useState('0 9 * * 1');
  const [newThreshold, setNewThreshold] = useState('100');
  const [newQualityMin, setNewQualityMin] = useState('85');
  const [newTool, setNewTool] = useState('image');
  const [newTier, setNewTier] = useState('standard');
  const [newPrompt, setNewPrompt] = useState('');
  const [newAutoFinalize, setNewAutoFinalize] = useState(false);

  // Load automations + recent runs from API
  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [autoRes, runsRes] = await Promise.all([
        fetch('/api/automations'),
        fetch('/api/automations/runs'),
      ]);
      if (!autoRes.ok) throw new Error(`Failed to load automations: ${autoRes.status}`);
      const autoData = await autoRes.json();
      setAutomations(autoData.automations || []);

      if (runsRes.ok) {
        const runsData = await runsRes.json();
        setRuns(runsData.runs || []);
      }
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleActive = useCallback(async (id: string) => {
    const auto = automations.find(a => a.id === id);
    if (!auto) return;
    // Optimistic update
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, is_active: !a.is_active } : a));
    try {
      const res = await fetch(`/api/automations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !auto.is_active }),
      });
      if (!res.ok) {
        // Revert on failure
        setAutomations(prev => prev.map(a => a.id === id ? { ...a, is_active: auto.is_active } : a));
        setError('Failed to toggle automation');
      }
    } catch {
      setAutomations(prev => prev.map(a => a.id === id ? { ...a, is_active: auto.is_active } : a));
      setError('Network error toggling automation');
    }
  }, [automations]);

  const deleteAutomation = useCallback(async (id: string) => {
    if (!confirm('Delete this automation? This cannot be undone.')) return;
    setAutomations(prev => prev.filter(a => a.id !== id));
    try {
      const res = await fetch(`/api/automations/${id}`, { method: 'DELETE' });
      if (!res.ok) { loadData(); setError('Failed to delete'); }
    } catch { loadData(); }
  }, [loadData]);

  const createAutomation = useCallback(async () => {
    if (!newName.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError(null);
    const triggerConfig: Record<string, unknown> = {};
    if (newTrigger === 'schedule') triggerConfig.cron = newCron;
    if (newTrigger === 'credit_balance') triggerConfig.threshold = parseInt(newThreshold);
    if (newTrigger === 'pipeline_complete') triggerConfig.quality_score_min = parseInt(newQualityMin);

    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          description: newDescription || null,
          trigger_type: newTrigger,
          trigger_config: triggerConfig,
          action_config: {
            tool_type: newTool,
            quality_tier: newTier,
            prompt_template: newPrompt || null,
            auto_finalize: newAutoFinalize,
          },
          is_active: false,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create automation');
      }
      const created = await res.json();
      setAutomations(prev => [created, ...prev]);
      setShowCreate(false);
      setNewName(''); setNewDescription(''); setNewPrompt('');
    } catch (e) {
      setError((e as Error).message);
    }
    setSaving(false);
  }, [newName, newDescription, newTrigger, newCron, newThreshold, newQualityMin, newTool, newTier, newPrompt, newAutoFinalize]);

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading automations...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 4 }}>Automations</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Set up triggers that run content generation automatically</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} style={{
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white',
          padding: '10px 20px', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600, border: 'none', cursor: 'pointer',
        }}>+ New Automation</button>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem' }}>✕</button>
        </div>
      )}

      {/* Create Form */}
      {showCreate && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16 }}>Create Automation</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Name *</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Weekly Product Images" style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Trigger Type</label>
              <select value={newTrigger} onChange={e => setNewTrigger(e.target.value as TriggerType)} style={{ width: '100%' }}>
                <option value="schedule">Schedule (Cron)</option>
                <option value="webhook">Webhook</option>
                <option value="credit_balance">Credit Balance Threshold</option>
                <option value="pipeline_complete">Pipeline Complete / Quality</option>
              </select>
            </div>
            {newTrigger === 'schedule' && (
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Cron Schedule</label>
                <input value={newCron} onChange={e => setNewCron(e.target.value)} placeholder="0 9 * * 1" style={{ width: '100%', fontFamily: "'JetBrains Mono',monospace" }} />
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>min hour day month weekday (e.g. "0 9 * * 1" = Mon 9am)</div>
              </div>
            )}
            {newTrigger === 'credit_balance' && (
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Credit Threshold</label>
                <input type="number" value={newThreshold} onChange={e => setNewThreshold(e.target.value)} style={{ width: '100%' }} />
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>Triggers when balance drops below this number</div>
              </div>
            )}
            {newTrigger === 'pipeline_complete' && (
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Min Quality Score (%)</label>
                <input type="number" value={newQualityMin} onChange={e => setNewQualityMin(e.target.value)} min="0" max="100" style={{ width: '100%' }} />
              </div>
            )}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Tool</label>
              <select value={newTool} onChange={e => setNewTool(e.target.value)} style={{ width: '100%' }}>
                <option value="image">Image</option><option value="video">Video</option>
                <option value="voice">Voice</option><option value="script">Script</option>
                <option value="image_to_video">Image→Video</option><option value="video_to_video">Video→Video</option>
                <option value="avatar">Avatar</option><option value="edit">Edit/Overlay</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Quality Tier</label>
              <select value={newTier} onChange={e => setNewTier(e.target.value)} style={{ width: '100%' }}>
                <option value="standard">Standard</option><option value="premium">Premium</option><option value="ultra">Ultra</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Description</label>
            <input value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="What this automation does..." style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Prompt Template</label>
            <textarea value={newPrompt} onChange={e => setNewPrompt(e.target.value)} rows={3} placeholder={'Generate a product image for {{product_name}}...'} style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={newAutoFinalize} onChange={e => setNewAutoFinalize(e.target.checked)} />
              Auto-finalize results above quality threshold
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={createAutomation} disabled={saving || !newName.trim()} style={{
              background: saving || !newName.trim() ? 'var(--bg-tertiary)' : 'var(--accent)',
              color: saving || !newName.trim() ? 'var(--text-muted)' : 'white',
              padding: '8px 20px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, border: 'none',
              cursor: saving || !newName.trim() ? 'not-allowed' : 'pointer',
            }}>{saving ? 'Creating...' : 'Create'}</button>
            <button onClick={() => setShowCreate(false)} style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', padding: '8px 20px', borderRadius: 8, fontSize: '0.8rem', border: 'none', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Automation Cards */}
      {automations.length === 0 && !showCreate ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180, border: '2px dashed var(--border)', borderRadius: 12, color: 'var(--text-muted)', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
          <div style={{ fontSize: '1.5rem' }}>⚡</div>
          <div style={{ fontSize: '0.85rem' }}>No automations yet. Create your first one above.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12, marginBottom: 32 }}>
          {automations.map(a => (
            <div key={a.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Toggle */}
              <button onClick={() => toggleActive(a.id)} style={{
                width: 44, height: 24, borderRadius: 12, cursor: 'pointer', border: 'none', position: 'relative',
                background: a.is_active ? 'var(--success)' : 'var(--bg-tertiary)', transition: 'background 0.2s', flexShrink: 0,
              }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: a.is_active ? 23 : 3, transition: 'left 0.2s' }} />
              </button>
              {/* Icon */}
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${triggerColors[a.trigger_type]}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                {triggerIcons[a.trigger_type]}
              </div>
              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 2 }}>{a.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.description || 'No description'}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4, fontFamily: "'JetBrains Mono',monospace" }}>{formatTrigger(a)}</div>
              </div>
              {/* Stats */}
              <div style={{ display: 'flex', gap: 20, fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0, alignItems: 'center' }}>
                <span>{a.run_count} runs</span>
                <span>{a.total_cost_credits} cr</span>
                <span>Last: {timeAgo(a.last_run_at)}</span>
                <button onClick={() => deleteAutomation(a.id)} title="Delete" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', padding: '4px' }}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Runs */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12 }}>Recent Auto Runs</h2>
      {runs.length === 0 ? (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          No automation runs yet. Enable an automation to start generating.
        </div>
      ) : (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Automation</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Timestamp</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Generations</th>
                <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Cost</th>
              </tr>
            </thead>
            <tbody>
              {runs.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 500 }}>{r.automation_name || automations.find(a => a.id === r.automation_id)?.name || 'Unknown'}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>{new Date(r.started_at).toLocaleString()}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 500, padding: '3px 8px', borderRadius: 4, background: `${statusColors[r.status] || '#6b6b7b'}15`, color: statusColors[r.status] || '#6b6b7b', textTransform: 'capitalize' }}>{r.status}</span>
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'right' }}>{r.generations_created}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right' }}>{r.cost_credits > 0 ? `${r.cost_credits} cr` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
