/**
 * Worker Process Endpoint
 * 
 * Called by Vercel Cron every 5 seconds.
 * Processes queued generations in parallel, recovers stale jobs.
 * 
 * Vercel Cron config (vercel.json):
 * { "crons": [{ "path": "/api/workers/process", "schedule": "*/1 * * * *" }] }
 * 
 * Note: Vercel Cron minimum is 1 minute. For sub-minute polling,
 * the cron triggers once per minute and the endpoint self-loops for ~55s.
 */

import { NextRequest, NextResponse } from 'next/server';
import { processWorkerTick, recoverStaleJobs } from '@/lib/workers/generation-worker';

// Verify cron secret to prevent unauthorized triggers
function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // In development, allow without auth
  if (!cronSecret) return true;
  
  return authHeader === `Bearer ${cronSecret}`;
}

export const maxDuration = 60; // Vercel Pro: 60s max
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Array<{
    tick: number;
    claimed: number;
    processed: number;
    failed: number;
    skipped: number;
    durationMs: number;
  }> = [];

  const startTime = Date.now();
  const MAX_RUNTIME_MS = 55_000; // 55s — leave 5s buffer before Vercel kills us
  const TICK_INTERVAL_MS = 5_000; // 5s between ticks

  let tickCount = 0;

  try {
    // Recover stale jobs first
    const recovered = await recoverStaleJobs();
    if (recovered > 0) {
      console.log(`[WorkerRoute] Recovered ${recovered} stale jobs`);
    }

    // Self-loop: process multiple ticks within one cron invocation
    while (Date.now() - startTime < MAX_RUNTIME_MS) {
      tickCount++;
      const tickResult = await processWorkerTick();
      results.push({ tick: tickCount, ...tickResult });

      // If nothing to do, wait longer between ticks
      const waitMs = tickResult.claimed === 0 ? TICK_INTERVAL_MS * 2 : TICK_INTERVAL_MS;
      
      // Check if we have enough time for another tick
      if (Date.now() - startTime + waitMs > MAX_RUNTIME_MS) break;
      
      await new Promise(r => setTimeout(r, waitMs));
    }

    return NextResponse.json({
      success: true,
      worker_id: `worker-${process.env.VERCEL_REGION || 'local'}`,
      ticks: tickCount,
      recovered,
      results,
      total_processed: results.reduce((sum, r) => sum + r.processed, 0),
      total_failed: results.reduce((sum, r) => sum + r.failed, 0),
      runtime_ms: Date.now() - startTime,
    });

  } catch (e) {
    console.error('[WorkerRoute] Fatal error:', e);
    return NextResponse.json({
      error: 'Worker error',
      details: e instanceof Error ? e.message : 'Unknown',
      ticks_completed: tickCount,
      results,
    }, { status: 500 });
  }
}
