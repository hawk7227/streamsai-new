/**
 * StreamsAI Generation Worker
 *
 * Standalone process that polls the `generations` table for queued jobs,
 * claims them, calls the appropriate provider adapter, uploads results to
 * Supabase Storage, and updates the generation record.
 *
 * Deploy: Run on DigitalOcean droplets — one instance per tool type,
 * or shared instances that process all types.
 *
 * Usage:
 *   TOOL_TYPE=image node --loader tsx workers/generation-worker.ts
 *   TOOL_TYPE=video node --loader tsx workers/generation-worker.ts
 *   (or omit TOOL_TYPE to process all types)
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// ---------------------------------------------------------------------------
// Provider imports — same adapters used by the API
// ---------------------------------------------------------------------------
import { OpenAIGPTImageMiniProvider } from '../src/lib/providers/image/openai-gpt-image-1-mini';
import { OpenAIGPTImage1Provider } from '../src/lib/providers/image/openai-gpt-image-1';
import { OpenAIGPTImage15Provider } from '../src/lib/providers/image/openai-gpt-image-1.5';
import { OpenAISora2Provider } from '../src/lib/providers/video/openai-sora-2';
import { OpenAISora2ProProvider } from '../src/lib/providers/video/openai-sora-2-pro';
import { GoogleVeo31Provider } from '../src/lib/providers/video/google-veo-3.1';
import { OpenAITTSProvider } from '../src/lib/providers/voice/openai-tts';
import { ElevenLabsStandardProvider } from '../src/lib/providers/voice/elevenlabs-standard';
import { ElevenLabsTurboProvider } from '../src/lib/providers/voice/elevenlabs-turbo';
import { AnthropicHaikuProvider } from '../src/lib/providers/script/anthropic-haiku';
import { AnthropicSonnetProvider } from '../src/lib/providers/script/anthropic-sonnet';
import { AnthropicOpusProvider } from '../src/lib/providers/script/anthropic-opus';

import type {
  MediaProvider,
  GenerationParams,
  GenerationResult,
  ToolType,
} from '../src/lib/types';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const WORKER_ID = `worker-${process.env.TOOL_TYPE ?? 'all'}-${uuidv4().slice(0, 8)}`;
const TOOL_TYPE_FILTER = process.env.TOOL_TYPE as ToolType | undefined;
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS ?? '2000', 10);
const HEARTBEAT_INTERVAL_MS = 10_000;
const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT ?? '5', 10);
const VIDEO_POLL_INTERVAL_MS = 15_000;
const VIDEO_POLL_TIMEOUT_MS = 600_000; // 10 minutes

// ---------------------------------------------------------------------------
// Provider Registry (static — no DB lookup needed by workers)
// ---------------------------------------------------------------------------

const ADAPTERS: Record<string, MediaProvider> = {
  'openai-gpt-image-1-mini': new OpenAIGPTImageMiniProvider(),
  'openai-gpt-image-1': new OpenAIGPTImage1Provider(),
  'openai-gpt-image-1.5': new OpenAIGPTImage15Provider(),
  'openai-sora-2': new OpenAISora2Provider(),
  'openai-sora-2-pro': new OpenAISora2ProProvider(),
  'google-veo-3.1': new GoogleVeo31Provider(),
  'openai-tts': new OpenAITTSProvider(),
  'elevenlabs-standard': new ElevenLabsStandardProvider(),
  'elevenlabs-turbo': new ElevenLabsTurboProvider(),
  'anthropic-haiku': new AnthropicHaikuProvider(),
  'anthropic-sonnet': new AnthropicSonnetProvider(),
  'anthropic-opus': new AnthropicOpusProvider(),
};

// ---------------------------------------------------------------------------
// Circuit Breaker (per provider)
// ---------------------------------------------------------------------------

interface CircuitState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}

const circuits: Record<string, CircuitState> = {};
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_RESET_MS = 30_000;

function getCircuit(provider: string): CircuitState {
  if (!circuits[provider]) {
    circuits[provider] = { failures: 0, lastFailure: 0, state: 'closed' };
  }
  return circuits[provider];
}

function isCircuitOpen(provider: string): boolean {
  const circuit = getCircuit(provider);
  if (circuit.state === 'open') {
    if (Date.now() - circuit.lastFailure > CIRCUIT_RESET_MS) {
      circuit.state = 'half-open';
      log(`Circuit half-open for ${provider} — trying one request`);
      return false;
    }
    return true;
  }
  return false;
}

function recordSuccess(provider: string): void {
  const circuit = getCircuit(provider);
  circuit.failures = 0;
  circuit.state = 'closed';
}

function recordFailure(provider: string): void {
  const circuit = getCircuit(provider);
  circuit.failures++;
  circuit.lastFailure = Date.now();
  if (circuit.failures >= CIRCUIT_THRESHOLD) {
    circuit.state = 'open';
    log(`Circuit OPEN for ${provider} — ${CIRCUIT_THRESHOLD} consecutive failures in ${CIRCUIT_RESET_MS / 1000}s`);
  }
}

// ---------------------------------------------------------------------------
// Supabase Client
// ---------------------------------------------------------------------------

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let activeJobs = 0;
let shuttingDown = false;
const activeJobIds = new Set<string>();

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function log(msg: string, data?: Record<string, unknown>): void {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [${WORKER_ID}] ${msg}`, data ? JSON.stringify(data) : '');
}

function logError(msg: string, err: unknown): void {
  const ts = new Date().toISOString();
  console.error(`[${ts}] [${WORKER_ID}] ERROR: ${msg}`, err instanceof Error ? err.message : err);
}

// ---------------------------------------------------------------------------
// Job Claiming — atomic claim via UPDATE ... WHERE status = 'queued'
// ---------------------------------------------------------------------------

interface GenerationRow {
  id: string;
  workspace_id: string;
  user_id: string;
  type: ToolType;
  provider: string;
  quality_tier: string;
  prompt: string;
  negative_prompt: string | null;
  aspect_ratio: string | null;
  duration: number | null;
  resolution: string | null;
  style: string | null;
  voice_id: string | null;
  language: string | null;
  status: string;
  retry_count: number;
  max_retries: number;
  external_job_id: string | null;
  preview_cost_credits: number;
  final_cost_credits: number;
  metadata: Record<string, unknown>;
}

async function claimJob(statusFilter: 'queued' | 'queued_final'): Promise<GenerationRow | null> {
  const runningStatus = statusFilter === 'queued' ? 'running_preview' : 'running_final';

  // Build query — filter by tool type if configured
  let query = supabase
    .from('generations')
    .select('*')
    .eq('status', statusFilter)
    .order('created_at', { ascending: true })
    .limit(1);

  if (TOOL_TYPE_FILTER) {
    query = query.eq('type', TOOL_TYPE_FILTER);
  }

  const { data: candidates, error: fetchError } = await query;

  if (fetchError || !candidates || candidates.length === 0) {
    return null;
  }

  const candidate = candidates[0] as GenerationRow;

  // Skip if circuit is open for this provider
  if (isCircuitOpen(candidate.provider)) {
    log(`Skipping ${candidate.id} — circuit open for ${candidate.provider}`);
    return null;
  }

  // Atomic claim: UPDATE only if status hasn't changed (optimistic lock)
  const { data: claimed, error: claimError } = await supabase
    .from('generations')
    .update({
      status: runningStatus,
      worker_id: WORKER_ID,
      worker_heartbeat_at: new Date().toISOString(),
      started_at: statusFilter === 'queued' ? new Date().toISOString() : undefined,
    })
    .eq('id', candidate.id)
    .eq('status', statusFilter) // Optimistic lock
    .select('*')
    .single();

  if (claimError || !claimed) {
    // Another worker got it — no problem
    return null;
  }

  return claimed as GenerationRow;
}

// ---------------------------------------------------------------------------
// Heartbeat — keeps worker_heartbeat_at fresh so reaper knows we're alive
// ---------------------------------------------------------------------------

async function sendHeartbeat(generationId: string): Promise<void> {
  await supabase
    .from('generations')
    .update({ worker_heartbeat_at: new Date().toISOString() })
    .eq('id', generationId)
    .eq('worker_id', WORKER_ID);

  // File-based heartbeat for Docker HEALTHCHECK
  writeFileHeartbeat();
}

function writeFileHeartbeat(): void {
  try {
    const fs = require('fs');
    fs.writeFileSync('/tmp/worker-heartbeat', String(Math.floor(Date.now() / 1000)));
  } catch {
    // Non-critical — only used by Docker HEALTHCHECK
  }
}

// ---------------------------------------------------------------------------
// Upload Result to Supabase Storage
// ---------------------------------------------------------------------------

async function uploadResult(
  generationId: string,
  data: Buffer | string,
  format: string,
  quality: 'preview' | 'final',
): Promise<string | null> {
  const bucket = 'generations';
  const path = `${quality}/${generationId}.${format}`;

  let buffer: Buffer;
  if (typeof data === 'string') {
    // base64
    buffer = Buffer.from(data, 'base64');
  } else {
    buffer = data;
  }

  const contentType = getContentType(format);

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    logError(`Upload failed for ${generationId}`, error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return urlData.publicUrl;
}

function getContentType(format: string): string {
  const map: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    mp4: 'video/mp4',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    txt: 'text/plain',
    md: 'text/markdown',
  };
  return map[format] ?? 'application/octet-stream';
}

// ---------------------------------------------------------------------------
// Process a Sync Generation (image, voice, script)
// ---------------------------------------------------------------------------

async function processSyncGeneration(
  job: GenerationRow,
  adapter: MediaProvider,
  quality: 'preview' | 'final',
): Promise<void> {
  const params: GenerationParams = {
    generationId: job.id,
    prompt: job.prompt,
    negativePrompt: job.negative_prompt ?? undefined,
    quality,
    aspectRatio: job.aspect_ratio ?? undefined,
    duration: job.duration ?? undefined,
    resolution: job.resolution ?? undefined,
    style: job.style ?? undefined,
    voiceId: job.voice_id ?? undefined,
    language: job.language ?? undefined,
    metadata: job.metadata,
  };

  const result: GenerationResult = await adapter.generate(params);

  if (!result.success) {
    await handleGenerationFailure(job, result, quality);
    return;
  }

  recordSuccess(job.provider);

  // Upload result to storage
  let resultUrl: string | null = null;
  if (result.resultBase64 && result.format) {
    resultUrl = await uploadResult(job.id, result.resultBase64, result.format, quality);
  } else if (result.resultUrl) {
    // Some providers return a URL directly — download and re-upload to our storage
    try {
      const response = await fetch(result.resultUrl, { signal: AbortSignal.timeout(120_000) });
      const buffer = Buffer.from(await response.arrayBuffer());
      resultUrl = await uploadResult(job.id, buffer, result.format ?? 'bin', quality);
    } catch (err) {
      logError(`Download from provider URL failed for ${job.id}`, err);
      resultUrl = result.resultUrl; // Fallback: use provider URL directly
    }
  }

  // For script type — the "result" is text, store in metadata
  if (job.type === 'script' && result.metadata?.text) {
    const urlField = quality === 'preview' ? 'preview_url' : 'final_url';
    const statusField = quality === 'preview' ? 'preview_ready' : 'final_ready';
    const timeField = quality === 'preview' ? 'preview_completed_at' : 'completed_at';

    await supabase
      .from('generations')
      .update({
        status: statusField,
        progress: 100,
        [urlField]: resultUrl,
        cost_cents: result.costCents ?? 0,
        [timeField]: new Date().toISOString(),
        metadata: {
          ...job.metadata,
          script_text: result.metadata.text,
          word_count: result.metadata.wordCount,
          generation_duration_ms: result.durationMs,
        },
      })
      .eq('id', job.id);
  } else {
    const urlField = quality === 'preview' ? 'preview_url' : 'final_url';
    const metaField = quality === 'preview' ? 'preview_metadata' : 'final_metadata';
    const statusField = quality === 'preview' ? 'preview_ready' : 'final_ready';
    const timeField = quality === 'preview' ? 'preview_completed_at' : 'completed_at';

    await supabase
      .from('generations')
      .update({
        status: statusField,
        progress: 100,
        [urlField]: resultUrl,
        [metaField]: {
          format: result.format,
          durationMs: result.durationMs,
          ...(result.metadata ?? {}),
        },
        cost_cents: result.costCents ?? 0,
        [timeField]: new Date().toISOString(),
      })
      .eq('id', job.id);
  }

  log(`Completed ${quality} for ${job.id} (${job.type}/${job.provider})`, {
    durationMs: result.durationMs,
  });
}

// ---------------------------------------------------------------------------
// Process an Async Generation (video — submit + poll)
// ---------------------------------------------------------------------------

async function processAsyncGeneration(
  job: GenerationRow,
  adapter: MediaProvider,
  quality: 'preview' | 'final',
): Promise<void> {
  // If we already have an external_job_id (e.g., reaper reset a stale job),
  // skip submission and go straight to polling
  let externalJobId = job.external_job_id;

  if (!externalJobId) {
    // Submit the generation request
    const params: GenerationParams = {
      generationId: job.id,
      prompt: job.prompt,
      negativePrompt: job.negative_prompt ?? undefined,
      quality,
      aspectRatio: job.aspect_ratio ?? undefined,
      duration: job.duration ?? undefined,
      resolution: job.resolution ?? undefined,
      style: job.style ?? undefined,
      metadata: job.metadata,
    };

    const result = await adapter.generate(params);

    if (!result.success) {
      await handleGenerationFailure(job, result, quality);
      return;
    }

    externalJobId = result.externalJobId ?? null;

    if (!externalJobId) {
      // Provider returned a result synchronously (unexpected for video, but handle it)
      // Treat like a sync generation
      recordSuccess(job.provider);
      let resultUrl = result.resultUrl ?? null;
      if (result.resultBase64 && result.format) {
        resultUrl = await uploadResult(job.id, result.resultBase64, result.format, quality);
      }

      const urlField = quality === 'preview' ? 'preview_url' : 'final_url';
      const statusField = quality === 'preview' ? 'preview_ready' : 'final_ready';
      const timeField = quality === 'preview' ? 'preview_completed_at' : 'completed_at';

      await supabase.from('generations').update({
        status: statusField,
        progress: 100,
        [urlField]: resultUrl,
        cost_cents: result.costCents ?? 0,
        [timeField]: new Date().toISOString(),
        external_job_id: null,
      }).eq('id', job.id);

      log(`Completed ${quality} for ${job.id} (sync video)`);
      return;
    }

    // Save external job ID for polling / webhook
    await supabase
      .from('generations')
      .update({
        external_job_id: externalJobId,
        cost_cents: result.costCents ?? 0,
      })
      .eq('id', job.id);

    recordSuccess(job.provider);
    log(`Video job submitted: ${externalJobId} for ${job.id}`);
  }

  // If the provider supports webhooks, we can rely on the webhook handler.
  // But we also poll as a fallback in case the webhook doesn't arrive.
  if (!adapter.pollStatus) {
    log(`No pollStatus for ${job.provider} — relying on webhook for ${job.id}`);
    return;
  }

  // Poll loop
  const pollStart = Date.now();
  while (!shuttingDown && Date.now() - pollStart < VIDEO_POLL_TIMEOUT_MS) {
    await sleep(VIDEO_POLL_INTERVAL_MS);

    // Heartbeat
    await sendHeartbeat(job.id);

    // Check if status was already updated by webhook
    const { data: current } = await supabase
      .from('generations')
      .select('status')
      .eq('id', job.id)
      .single();

    if (current && (current.status === 'preview_ready' || current.status === 'final_ready' || current.status === 'cancelled')) {
      log(`Job ${job.id} already completed/cancelled (likely via webhook)`);
      return;
    }

    // Poll the provider
    const status = await adapter.pollStatus(externalJobId);

    // Update progress
    if (status.progress !== undefined) {
      await supabase
        .from('generations')
        .update({ progress: status.progress })
        .eq('id', job.id);
    }

    if (status.status === 'completed' && status.resultUrl) {
      // Download and upload to our storage
      let resultUrl: string | null = status.resultUrl;
      try {
        if (adapter.downloadResult) {
          const buffer = await adapter.downloadResult(externalJobId);
          resultUrl = await uploadResult(job.id, buffer, 'mp4', quality);
        } else {
          const response = await fetch(status.resultUrl, { signal: AbortSignal.timeout(300_000) });
          const buffer = Buffer.from(await response.arrayBuffer());
          resultUrl = await uploadResult(job.id, buffer, 'mp4', quality);
        }
      } catch (err) {
        logError(`Video download failed for ${job.id}, using provider URL`, err);
      }

      const urlField = quality === 'preview' ? 'preview_url' : 'final_url';
      const statusField = quality === 'preview' ? 'preview_ready' : 'final_ready';
      const timeField = quality === 'preview' ? 'preview_completed_at' : 'completed_at';

      await supabase.from('generations').update({
        status: statusField,
        progress: 100,
        [urlField]: resultUrl,
        [timeField]: new Date().toISOString(),
      }).eq('id', job.id);

      log(`Video completed for ${job.id}`);
      return;
    }

    if (status.status === 'failed') {
      await handleProviderFailure(job, status.error ?? 'Video generation failed', quality);
      return;
    }
  }

  // Timeout — mark as failed if we got here
  if (!shuttingDown) {
    log(`Video poll timeout for ${job.id} after ${VIDEO_POLL_TIMEOUT_MS / 1000}s`);
    await handleProviderFailure(job, 'Video generation timed out waiting for completion', quality);
  }
}

// ---------------------------------------------------------------------------
// Error Handling
// ---------------------------------------------------------------------------

async function handleGenerationFailure(
  job: GenerationRow,
  result: GenerationResult,
  quality: 'preview' | 'final',
): Promise<void> {
  const errorCode = result.error?.code ?? 'UNKNOWN';
  const errorMessage = result.error?.message ?? 'Unknown error';
  const retryable = result.error?.retryable ?? false;

  recordFailure(job.provider);

  if (retryable && job.retry_count < job.max_retries) {
    // Re-queue with incremented retry count + exponential backoff delay
    const backoffMs = Math.min(1000 * Math.pow(2, job.retry_count), 30_000);
    const requeuStatus = quality === 'preview' ? 'queued' : 'queued_final';

    log(`Retryable error for ${job.id} (${errorCode}). Retry ${job.retry_count + 1}/${job.max_retries} in ${backoffMs}ms`);

    await supabase
      .from('generations')
      .update({
        status: requeuStatus,
        retry_count: job.retry_count + 1,
        worker_id: null,
        worker_heartbeat_at: null,
        error_message: `Retry ${job.retry_count + 1}: ${errorMessage}`,
      })
      .eq('id', job.id);

    // Sleep for backoff before returning (so this job won't be re-claimed immediately)
    await sleep(backoffMs);
  } else {
    // Permanent failure
    await handleProviderFailure(job, `${errorCode}: ${errorMessage}`, quality);
  }
}

async function handleProviderFailure(
  job: GenerationRow,
  errorMessage: string,
  quality: 'preview' | 'final',
): Promise<void> {
  log(`FAILED: ${job.id} — ${errorMessage}`);

  await supabase
    .from('generations')
    .update({
      status: 'failed',
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq('id', job.id);

  // Refund credits
  const refundAmount = quality === 'preview'
    ? job.preview_cost_credits
    : job.final_cost_credits;

  if (refundAmount > 0) {
    await supabase.rpc('refund_credits', {
      p_workspace_id: job.workspace_id,
      p_amount: refundAmount,
      p_generation_id: job.id,
    });
    log(`Refunded ${refundAmount} credits for ${job.id}`);
  }
}

// ---------------------------------------------------------------------------
// Main Processing Loop
// ---------------------------------------------------------------------------

async function processJob(job: GenerationRow, quality: 'preview' | 'final'): Promise<void> {
  const adapter = ADAPTERS[job.provider];
  if (!adapter) {
    logError(`No adapter for provider: ${job.provider}`, null);
    await handleProviderFailure(job, `No adapter for provider: ${job.provider}`, quality);
    return;
  }

  // Heartbeat interval
  const heartbeatTimer = setInterval(() => {
    sendHeartbeat(job.id).catch(() => {});
  }, HEARTBEAT_INTERVAL_MS);

  try {
    // Determine if this is a sync or async provider
    const isAsync = adapter.capabilities.webhooks || adapter.pollStatus !== undefined;
    const isVideo = job.type === 'video';

    if (isAsync && isVideo) {
      await processAsyncGeneration(job, adapter, quality);
    } else {
      await processSyncGeneration(job, adapter, quality);
    }
  } catch (err) {
    logError(`Unhandled error processing ${job.id}`, err);
    await handleProviderFailure(
      job,
      `Worker error: ${err instanceof Error ? err.message : 'Unknown'}`,
      quality,
    );
  } finally {
    clearInterval(heartbeatTimer);
    activeJobs--;
    activeJobIds.delete(job.id);
  }
}

async function pollForJobs(): Promise<void> {
  if (shuttingDown || activeJobs >= MAX_CONCURRENT) return;

  // Priority 1: preview jobs (queued)
  const previewJob = await claimJob('queued');
  if (previewJob) {
    activeJobs++;
    activeJobIds.add(previewJob.id);
    log(`Claimed preview job: ${previewJob.id} (${previewJob.type}/${previewJob.provider})`);
    // Fire and forget — processJob runs in background
    processJob(previewJob, 'preview').catch((err) =>
      logError(`processJob failed for ${previewJob.id}`, err),
    );
    return; // Process one at a time per poll cycle
  }

  // Priority 2: final jobs (queued_final)
  if (activeJobs < MAX_CONCURRENT) {
    const finalJob = await claimJob('queued_final');
    if (finalJob) {
      activeJobs++;
      activeJobIds.add(finalJob.id);
      log(`Claimed final job: ${finalJob.id} (${finalJob.type}/${finalJob.provider})`);
      processJob(finalJob, 'final').catch((err) =>
        logError(`processJob failed for ${finalJob.id}`, err),
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Stale Job Reaper
// ---------------------------------------------------------------------------

const STALE_HEARTBEAT_THRESHOLD_MS = 120_000; // 2 minutes without heartbeat = stale

async function reapStaleJobs(): Promise<void> {
  const threshold = new Date(Date.now() - STALE_HEARTBEAT_THRESHOLD_MS).toISOString();

  // Find jobs where worker_heartbeat_at is older than threshold
  // and status is running_preview or running_final
  const { data: staleJobs, error } = await supabase
    .from('generations')
    .select('id, status, worker_id, retry_count, max_retries')
    .in('status', ['running_preview', 'running_final'])
    .lt('worker_heartbeat_at', threshold)
    .limit(20);

  if (error || !staleJobs || staleJobs.length === 0) return;

  for (const stale of staleJobs) {
    // Don't reap our own jobs
    if (activeJobIds.has(stale.id)) continue;

    const canRetry = stale.retry_count < stale.max_retries;
    const requeueStatus = stale.status === 'running_preview' ? 'queued' : 'queued_final';

    if (canRetry) {
      log(`Reaping stale job ${stale.id} (worker: ${stale.worker_id}) — re-queuing`);
      await supabase
        .from('generations')
        .update({
          status: requeueStatus,
          worker_id: null,
          worker_heartbeat_at: null,
          retry_count: stale.retry_count + 1,
          error_message: `Reaped: worker ${stale.worker_id} went stale. Retry ${stale.retry_count + 1}/${stale.max_retries}`,
        })
        .eq('id', stale.id)
        .in('status', ['running_preview', 'running_final']);
    } else {
      log(`Reaping stale job ${stale.id} — max retries exceeded, marking failed`);
      await supabase
        .from('generations')
        .update({
          status: 'failed',
          error_message: `Worker ${stale.worker_id} went stale. Max retries (${stale.max_retries}) exceeded.`,
          completed_at: new Date().toISOString(),
        })
        .eq('id', stale.id);
    }
  }
}

// ---------------------------------------------------------------------------
// Batch Status Updater
// ---------------------------------------------------------------------------

async function updateBatchStatuses(): Promise<void> {
  // Find in-progress batches and check if all generations are done
  const { data: batches } = await supabase
    .from('generation_batches')
    .select('id, total_generations')
    .eq('status', 'in_progress')
    .limit(20);

  if (!batches || batches.length === 0) return;

  for (const batch of batches) {
    const { data: gens } = await supabase
      .from('generations')
      .select('status')
      .eq('batch_id', batch.id);

    if (!gens) continue;

    const allPreviewReady = gens.every(
      (g: { status: string }) => g.status === 'preview_ready' || g.status === 'final_ready' || g.status === 'failed' || g.status === 'cancelled',
    );

    const allComplete = gens.every(
      (g: { status: string }) => g.status === 'final_ready' || g.status === 'failed' || g.status === 'cancelled',
    );

    const hasFailed = gens.some((g: { status: string }) => g.status === 'failed');

    let newStatus: string | null = null;
    if (allComplete) {
      newStatus = hasFailed ? 'partial_failure' : 'completed';
    } else if (allPreviewReady) {
      newStatus = 'all_previews_ready';
    }

    if (newStatus) {
      await supabase
        .from('generation_batches')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', batch.id);
    }
  }
}

// ---------------------------------------------------------------------------
// Graceful Shutdown
// ---------------------------------------------------------------------------

function setupGracefulShutdown(): void {
  const shutdown = async (signal: string) => {
    log(`Received ${signal} — shutting down gracefully...`);
    shuttingDown = true;

    // Wait for active jobs to finish (max 60s)
    const deadline = Date.now() + 60_000;
    while (activeJobs > 0 && Date.now() < deadline) {
      log(`Waiting for ${activeJobs} active jobs to complete...`);
      await sleep(2000);
    }

    if (activeJobs > 0) {
      log(`Force shutdown with ${activeJobs} jobs still active`);
    } else {
      log('All jobs completed. Shutting down.');
    }

    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  log('Starting generation worker', {
    toolType: TOOL_TYPE_FILTER ?? 'all',
    maxConcurrent: MAX_CONCURRENT,
    pollIntervalMs: POLL_INTERVAL_MS,
  });

  setupGracefulShutdown();

  let reapCounter = 0;

  while (!shuttingDown) {
    try {
      await pollForJobs();
      writeFileHeartbeat(); // Docker HEALTHCHECK — proves process is alive

      // Run stale job reaper every 30 poll cycles
      reapCounter++;
      if (reapCounter >= 30) {
        reapCounter = 0;
        await reapStaleJobs();
        await updateBatchStatuses();
      }
    } catch (err) {
      logError('Poll cycle error', err);
    }

    await sleep(POLL_INTERVAL_MS);
  }
}

main().catch((err) => {
  logError('Fatal worker error', err);
  process.exit(1);
});
