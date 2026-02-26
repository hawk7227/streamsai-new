/**
 * Generation Worker Engine
 * 
 * Processes queued generations in parallel with:
 * - Per-provider concurrency limits
 * - Circuit breaker per provider
 * - Exponential backoff on retries
 * - Heartbeat-based job locking (prevents double-processing)
 * - Poll-based completion for async providers (video)
 */

import { createClient } from '@supabase/supabase-js';
import type { Generation, MediaProvider, GenerationParams, ProviderMapping } from '@/lib/types';

const WORKER_ID = `worker-${process.env.VERCEL_REGION || 'local'}-${Date.now().toString(36)}`;
const LOCK_TTL_MS = 60_000; // 60s lock — must heartbeat within this
const MAX_BATCH_SIZE = 20;   // Max jobs to claim per tick
const POLL_INTERVAL_MS = 3_000; // 3s between poll checks for async jobs

// ---------------------------------------------------------------------------
// Circuit Breaker — per provider
// ---------------------------------------------------------------------------
interface CircuitState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}

const circuits = new Map<string, CircuitState>();
const CIRCUIT_THRESHOLD = 5;      // failures before opening
const CIRCUIT_RESET_MS = 30_000;  // 30s before half-open retry

function getCircuit(providerKey: string): CircuitState {
  if (!circuits.has(providerKey)) {
    circuits.set(providerKey, { failures: 0, lastFailure: 0, state: 'closed' });
  }
  return circuits.get(providerKey)!;
}

function isCircuitOpen(providerKey: string): boolean {
  const c = getCircuit(providerKey);
  if (c.state === 'open') {
    if (Date.now() - c.lastFailure > CIRCUIT_RESET_MS) {
      c.state = 'half-open'; // Allow one probe
      return false;
    }
    return true;
  }
  return false;
}

function recordSuccess(providerKey: string): void {
  const c = getCircuit(providerKey);
  c.failures = 0;
  c.state = 'closed';
}

function recordFailure(providerKey: string): void {
  const c = getCircuit(providerKey);
  c.failures++;
  c.lastFailure = Date.now();
  if (c.failures >= CIRCUIT_THRESHOLD) {
    c.state = 'open';
    console.warn(`[CircuitBreaker] OPEN for ${providerKey} after ${c.failures} failures`);
  }
}

// ---------------------------------------------------------------------------
// Service client
// ---------------------------------------------------------------------------
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ---------------------------------------------------------------------------
// Step 1: Claim queued jobs (atomic lock via UPDATE ... WHERE)
// ---------------------------------------------------------------------------
async function claimJobs(statuses: string[], limit: number): Promise<Generation[]> {
  const db = getServiceClient();
  const staleThreshold = new Date(Date.now() - LOCK_TTL_MS).toISOString();

  // Claim unclaimed OR stale-locked jobs
  const { data, error } = await db.rpc('claim_worker_jobs', {
    p_worker_id: WORKER_ID,
    p_statuses: statuses,
    p_stale_threshold: staleThreshold,
    p_limit: limit,
  });

  if (error) {
    console.error('[Worker] Failed to claim jobs:', error.message);
    // Fallback: manual claim
    return claimJobsFallback(db, statuses, limit, staleThreshold);
  }

  return (data || []) as Generation[];
}

async function claimJobsFallback(
  db: ReturnType<typeof getServiceClient>,
  statuses: string[],
  limit: number,
  staleThreshold: string,
): Promise<Generation[]> {
  // Find claimable jobs
  const { data: candidates } = await db
    .from('generations')
    .select('id')
    .in('status', statuses)
    .or(`worker_id.is.null,worker_heartbeat_at.lt.${staleThreshold}`)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (!candidates?.length) return [];

  const ids = candidates.map((c: { id: string }) => c.id);

  // Atomic claim
  const { data: claimed, error } = await db
    .from('generations')
    .update({
      worker_id: WORKER_ID,
      worker_heartbeat_at: new Date().toISOString(),
    })
    .in('id', ids)
    .or(`worker_id.is.null,worker_heartbeat_at.lt.${staleThreshold}`)
    .select('*');

  if (error) {
    console.error('[Worker] Fallback claim error:', error.message);
    return [];
  }

  return (claimed || []) as Generation[];
}

// ---------------------------------------------------------------------------
// Step 2: Heartbeat (keep lock alive during long operations)
// ---------------------------------------------------------------------------
async function heartbeat(generationIds: string[]): Promise<void> {
  if (generationIds.length === 0) return;
  const db = getServiceClient();
  await db
    .from('generations')
    .update({ worker_heartbeat_at: new Date().toISOString() })
    .in('id', generationIds)
    .eq('worker_id', WORKER_ID);
}

// ---------------------------------------------------------------------------
// Step 3: Resolve provider adapter (cached per key for this tick)
// ---------------------------------------------------------------------------
const adapterCache = new Map<string, { adapter: MediaProvider; mapping: ProviderMapping }>();

async function getAdapter(providerKey: string): Promise<{ adapter: MediaProvider; mapping: ProviderMapping } | null> {
  if (adapterCache.has(providerKey)) return adapterCache.get(providerKey)!;

  // Dynamic import to avoid circular deps
  const { getAdapterByKey } = await import('@/lib/providers/registry');
  const result = getAdapterByKey(providerKey);
  if (result) adapterCache.set(providerKey, result);
  return result;
}

// ---------------------------------------------------------------------------
// Step 4: Process a single generation
// ---------------------------------------------------------------------------
async function processGeneration(gen: Generation): Promise<void> {
  const db = getServiceClient();
  const providerKey = gen.provider;

  // Circuit breaker check
  if (isCircuitOpen(providerKey)) {
    console.warn(`[Worker] Circuit OPEN for ${providerKey}, skipping ${gen.id}`);
    // Release lock so another worker can try later
    await db.from('generations').update({ worker_id: null, worker_heartbeat_at: null }).eq('id', gen.id);
    return;
  }

  const resolved = await getAdapter(providerKey);
  if (!resolved) {
    console.error(`[Worker] No adapter for provider: ${providerKey}`);
    await db.from('generations').update({
      status: 'failed',
      error_message: `No adapter found for provider: ${providerKey}`,
    }).eq('id', gen.id);
    return;
  }

  const { adapter } = resolved;
  const isPreview = gen.status === 'queued';
  const isFinal = gen.status === 'queued_final';
  const quality: 'preview' | 'final' = isFinal ? 'final' : 'preview';

  // Mark as running
  const runningStatus = isFinal ? 'running_final' : 'running_preview';
  await db.from('generations').update({
    status: runningStatus,
    started_at: gen.started_at || new Date().toISOString(),
    worker_heartbeat_at: new Date().toISOString(),
  }).eq('id', gen.id);

  try {
    // Build params
    const params: GenerationParams = {
      generationId: gen.id,
      prompt: gen.prompt,
      negativePrompt: gen.negative_prompt || undefined,
      quality,
      aspectRatio: gen.aspect_ratio || undefined,
      duration: gen.duration || undefined,
      resolution: gen.resolution || undefined,
      style: gen.style || undefined,
      voiceId: gen.voice_id || undefined,
      language: gen.language || undefined,
      referenceImageUrl: gen.reference_image_url || undefined,
      referenceVideoUrl: gen.reference_video_url || undefined,
      referenceAudioUrl: gen.reference_audio_url || undefined,
      metadata: gen.metadata || {},
    };

    // Call provider
    const result = await adapter.generate(params);

    if (!result.success) {
      // Retryable?
      if (result.error?.retryable && gen.retry_count < gen.max_retries) {
        const backoffMs = Math.min(1000 * Math.pow(2, gen.retry_count), 30000);
        console.warn(`[Worker] Retryable error for ${gen.id} (attempt ${gen.retry_count + 1}): ${result.error.message}. Backoff: ${backoffMs}ms`);
        await db.from('generations').update({
          status: isPreview ? 'queued' : 'queued_final',
          retry_count: gen.retry_count + 1,
          error_message: result.error.message,
          worker_id: null,
          worker_heartbeat_at: null,
        }).eq('id', gen.id);
        recordFailure(providerKey);
        return;
      }

      // Non-retryable or max retries exceeded
      await db.from('generations').update({
        status: 'failed',
        error_message: result.error?.message || 'Provider returned failure',
        completed_at: new Date().toISOString(),
      }).eq('id', gen.id);
      recordFailure(providerKey);
      return;
    }

    recordSuccess(providerKey);

    // Synchronous result (image, script, voice) — provider returned URL immediately
    if (result.resultUrl) {
      const completedStatus = isFinal ? 'final_ready' : 'preview_ready';
      const urlField = isFinal ? 'final_url' : 'preview_url';
      const completedAtField = isFinal ? 'completed_at' : 'preview_completed_at';

      await db.from('generations').update({
        status: completedStatus,
        [urlField]: result.resultUrl,
        external_job_id: result.externalJobId || gen.external_job_id,
        cost_cents: (gen.cost_cents || 0) + (result.costCents || 0),
        [completedAtField]: new Date().toISOString(),
        progress: 100,
        worker_id: null,
        worker_heartbeat_at: null,
      }).eq('id', gen.id);
      return;
    }

    // Async result (video) — provider returned externalJobId, need to poll
    if (result.externalJobId) {
      await db.from('generations').update({
        external_job_id: result.externalJobId,
        cost_cents: (gen.cost_cents || 0) + (result.costCents || 0),
        progress: 10,
        worker_heartbeat_at: new Date().toISOString(),
      }).eq('id', gen.id);

      // Poll loop for async providers
      if (adapter.pollStatus) {
        await pollUntilComplete(db, gen, adapter, result.externalJobId, isFinal);
      }
      // If no pollStatus, rely on webhooks — release lock
      else {
        await db.from('generations').update({
          worker_id: null,
          worker_heartbeat_at: null,
        }).eq('id', gen.id);
      }
      return;
    }

    // No URL and no job ID — shouldn't happen
    await db.from('generations').update({
      status: 'failed',
      error_message: 'Provider returned no result URL or job ID',
      completed_at: new Date().toISOString(),
    }).eq('id', gen.id);

  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error(`[Worker] Unhandled error processing ${gen.id}:`, message);
    recordFailure(providerKey);

    if (gen.retry_count < gen.max_retries) {
      await db.from('generations').update({
        status: isPreview ? 'queued' : 'queued_final',
        retry_count: gen.retry_count + 1,
        error_message: message,
        worker_id: null,
        worker_heartbeat_at: null,
      }).eq('id', gen.id);
    } else {
      await db.from('generations').update({
        status: 'failed',
        error_message: `Max retries exceeded. Last error: ${message}`,
        completed_at: new Date().toISOString(),
        worker_id: null,
      }).eq('id', gen.id);
    }
  }
}

// ---------------------------------------------------------------------------
// Step 5: Poll loop for async providers (video generation)
// ---------------------------------------------------------------------------
async function pollUntilComplete(
  db: ReturnType<typeof getServiceClient>,
  gen: Generation,
  adapter: MediaProvider,
  externalJobId: string,
  isFinal: boolean,
): Promise<void> {
  const maxPollTime = 5 * 60 * 1000; // 5 min max poll (Vercel function limit consideration)
  const startTime = Date.now();

  while (Date.now() - startTime < maxPollTime) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));

    // Heartbeat to keep lock
    await heartbeat([gen.id]);

    try {
      const status = await adapter.pollStatus!(externalJobId);

      if (status.status === 'completed' && status.resultUrl) {
        const completedStatus = isFinal ? 'final_ready' : 'preview_ready';
        const urlField = isFinal ? 'final_url' : 'preview_url';
        const completedAtField = isFinal ? 'completed_at' : 'preview_completed_at';

        await db.from('generations').update({
          status: completedStatus,
          [urlField]: status.resultUrl,
          progress: 100,
          [completedAtField]: new Date().toISOString(),
          worker_id: null,
          worker_heartbeat_at: null,
        }).eq('id', gen.id);

        recordSuccess(gen.provider);
        return;
      }

      if (status.status === 'failed') {
        if (gen.retry_count < gen.max_retries) {
          await db.from('generations').update({
            status: isFinal ? 'queued_final' : 'queued',
            retry_count: gen.retry_count + 1,
            error_message: status.error || 'Provider poll returned failed',
            worker_id: null,
            worker_heartbeat_at: null,
          }).eq('id', gen.id);
        } else {
          await db.from('generations').update({
            status: 'failed',
            error_message: status.error || 'Provider generation failed',
            completed_at: new Date().toISOString(),
            worker_id: null,
          }).eq('id', gen.id);
        }
        recordFailure(gen.provider);
        return;
      }

      // Still processing — update progress
      if (status.progress) {
        await db.from('generations').update({ progress: status.progress }).eq('id', gen.id);
      }

    } catch (e) {
      console.error(`[Worker] Poll error for ${gen.id}:`, e);
      // Don't fail on poll error — just continue polling
    }
  }

  // Timed out polling — release lock, job stays in running state
  // Next worker tick will reclaim it (stale heartbeat)
  console.warn(`[Worker] Poll timeout for ${gen.id}, releasing lock for next tick`);
  await db.from('generations').update({
    worker_id: null,
    worker_heartbeat_at: null,
  }).eq('id', gen.id);
}

// ---------------------------------------------------------------------------
// MAIN: Process one tick
// ---------------------------------------------------------------------------
export async function processWorkerTick(): Promise<{
  claimed: number;
  processed: number;
  failed: number;
  skipped: number;
  durationMs: number;
}> {
  const tickStart = Date.now();
  let processed = 0;
  let failed = 0;
  let skipped = 0;

  // Claim queued preview + queued final jobs
  const jobs = await claimJobs(['queued', 'queued_final'], MAX_BATCH_SIZE);

  if (jobs.length === 0) {
    return { claimed: 0, processed: 0, failed: 0, skipped: 0, durationMs: Date.now() - tickStart };
  }

  console.log(`[Worker] Claimed ${jobs.length} jobs: ${jobs.map(j => `${j.id.slice(0,8)}(${j.type}/${j.status})`).join(', ')}`);

  // Group by provider for concurrency control
  const byProvider = new Map<string, Generation[]>();
  for (const job of jobs) {
    const key = job.provider;
    if (!byProvider.has(key)) byProvider.set(key, []);
    byProvider.get(key)!.push(job);
  }

  // Process each provider group in parallel, jobs within provider respect concurrency
  const providerPromises = Array.from(byProvider.entries()).map(async ([providerKey, providerJobs]) => {
    if (isCircuitOpen(providerKey)) {
      console.warn(`[Worker] Circuit OPEN for ${providerKey}, skipping ${providerJobs.length} jobs`);
      skipped += providerJobs.length;
      // Release locks
      const db = getServiceClient();
      await db.from('generations').update({ worker_id: null, worker_heartbeat_at: null })
        .in('id', providerJobs.map(j => j.id));
      return;
    }

    // Process jobs for this provider with controlled concurrency
    // Use Promise.allSettled with concurrency limit
    const concurrencyLimit = 3; // Max parallel calls per provider per tick
    for (let i = 0; i < providerJobs.length; i += concurrencyLimit) {
      const batch = providerJobs.slice(i, i + concurrencyLimit);
      const results = await Promise.allSettled(
        batch.map(job => processGeneration(job))
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          processed++;
        } else {
          failed++;
          console.error('[Worker] Job processing rejected:', result.reason);
        }
      }

      // Heartbeat all remaining jobs in this provider group
      const remaining = providerJobs.slice(i + concurrencyLimit);
      if (remaining.length > 0) {
        await heartbeat(remaining.map(j => j.id));
      }
    }
  });

  await Promise.allSettled(providerPromises);

  // Clear adapter cache for next tick
  adapterCache.clear();

  const durationMs = Date.now() - tickStart;
  console.log(`[Worker] Tick complete: claimed=${jobs.length}, processed=${processed}, failed=${failed}, skipped=${skipped}, duration=${durationMs}ms`);

  return { claimed: jobs.length, processed, failed, skipped, durationMs };
}

// ---------------------------------------------------------------------------
// Also claim and process stale running jobs (recovery)
// ---------------------------------------------------------------------------
export async function recoverStaleJobs(): Promise<number> {
  const db = getServiceClient();
  const staleThreshold = new Date(Date.now() - LOCK_TTL_MS * 2).toISOString();

  // Find jobs stuck in running state with stale heartbeats
  const { data: stale } = await db
    .from('generations')
    .select('id, status, retry_count, max_retries')
    .in('status', ['running_preview', 'running_final'])
    .lt('worker_heartbeat_at', staleThreshold)
    .limit(20);

  if (!stale?.length) return 0;

  console.warn(`[Worker] Recovering ${stale.length} stale jobs`);

  for (const job of stale) {
    const requeueStatus = job.status === 'running_final' ? 'queued_final' : 'queued';
    if (job.retry_count < job.max_retries) {
      await db.from('generations').update({
        status: requeueStatus,
        retry_count: job.retry_count + 1,
        error_message: 'Recovered from stale worker',
        worker_id: null,
        worker_heartbeat_at: null,
      }).eq('id', job.id);
    } else {
      await db.from('generations').update({
        status: 'failed',
        error_message: 'Max retries exceeded (stale recovery)',
        completed_at: new Date().toISOString(),
        worker_id: null,
      }).eq('id', job.id);
    }
  }

  return stale.length;
}
