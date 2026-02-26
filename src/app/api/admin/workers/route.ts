import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/workers
 * Returns worker health status, active job counts, and queue depth.
 */
export async function GET(): Promise<NextResponse> {
  const supabase = createServiceClient();

  const twoMinutesAgo = new Date(Date.now() - 120_000).toISOString();

  const { data: activeWorkers } = await supabase
    .from('generations')
    .select('worker_id, type, status, worker_heartbeat_at')
    .in('status', ['running_preview', 'running_final'])
    .gt('worker_heartbeat_at', twoMinutesAgo);

  const workerMap = new Map<string, { jobs: number; types: Set<string>; lastHeartbeat: string }>();
  for (const row of activeWorkers ?? []) {
    if (!row.worker_id) continue;
    const existing = workerMap.get(row.worker_id);
    if (existing) {
      existing.jobs++;
      existing.types.add(row.type);
      if (row.worker_heartbeat_at > existing.lastHeartbeat) existing.lastHeartbeat = row.worker_heartbeat_at;
    } else {
      workerMap.set(row.worker_id, { jobs: 1, types: new Set([row.type]), lastHeartbeat: row.worker_heartbeat_at });
    }
  }

  const workers = Array.from(workerMap.entries()).map(([id, info]) => ({
    worker_id: id, active_jobs: info.jobs, tool_types: Array.from(info.types), last_heartbeat: info.lastHeartbeat,
  }));

  const { data: queuedJobs } = await supabase
    .from('generations')
    .select('type, status')
    .in('status', ['queued', 'queued_final']);

  const queueDepth: Record<string, { preview: number; final: number }> = {};
  for (const row of queuedJobs ?? []) {
    if (!queueDepth[row.type]) queueDepth[row.type] = { preview: 0, final: 0 };
    if (row.status === 'queued') queueDepth[row.type].preview++;
    if (row.status === 'queued_final') queueDepth[row.type].final++;
  }

  const { data: staleJobs } = await supabase
    .from('generations')
    .select('id, worker_id, type, status, worker_heartbeat_at')
    .in('status', ['running_preview', 'running_final'])
    .lt('worker_heartbeat_at', twoMinutesAgo);

  const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const { count: recentFailures } = await supabase
    .from('generations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'failed')
    .gt('completed_at', oneHourAgo);

  return NextResponse.json({
    workers,
    queue_depth: queueDepth,
    stale_jobs: (staleJobs ?? []).map((j) => ({ id: j.id, worker_id: j.worker_id, type: j.type, status: j.status, last_heartbeat: j.worker_heartbeat_at })),
    recent_failures: recentFailures ?? 0,
    total_active_workers: workers.length,
    total_queued: (queuedJobs ?? []).length,
    total_running: (activeWorkers ?? []).length,
    timestamp: new Date().toISOString(),
  });
}
