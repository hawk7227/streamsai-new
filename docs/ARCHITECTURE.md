# Deep Dive: Enterprise-Grade AI Media Generation System

## Research Date: February 25, 2026

---

## 1. Provider API Landscape (Current State)

### OpenAI Image Generation

**Models available (as of Feb 2026):**

- `gpt-image-1.5` — State-of-the-art, best quality, recommended for production
- `gpt-image-1` — Previous gen, still solid
- `gpt-image-1-mini` — Budget option, 55-78% cheaper than gpt-image-1

**Pricing (per image, gpt-image-1):**

| Quality | 1024×1024 | 1024×1536 / 1536×1024 |
|---------|-----------|----------------------|
| Low     | ~$0.01    | ~$0.01               |
| Medium  | ~$0.04    | ~$0.04               |
| High    | ~$0.17    | ~$0.17               |

Additional token-based costs apply for input prompts and image output tokens. gpt-image-1.5 uses token-based pricing rather than flat per-image pricing.

**Key API details:**
- Endpoint: `POST /v1/images/generations` (Image API) or via Responses API with `tools: [{type: "image_generation"}]`
- `n` parameter supports 1-10 images per request (batch in a single call)
- Supports `b64_json` and `url` response formats
- `b64_json` recommended for production (URLs expire)
- Sizes up to 4096×4096 for gpt-image-1
- Quality tiers: `low`, `medium`, `high`
- Rate limits: RPM/IPM based on usage tier (Tier 1 through Tier 5)
- Image generation is **synchronous** — the API blocks until the image is ready (typically 5-20 seconds for high quality)

**Critical finding for our architecture:** Image generation is synchronous (blocks until done), but relatively fast (5-20s). This means our worker can call the API, wait, and get the result. No polling needed for images. This simplifies the image worker significantly compared to video.

**Preview vs Final strategy for images:**
- Preview: `quality: "low"`, smaller size → ~3-5 seconds, ~$0.01
- Final: `quality: "high"`, full size → ~10-20 seconds, ~$0.17
- Clear cost and speed difference validates our preview-first model

---

### OpenAI Video Generation (Sora 2)

**Models available:**
- `sora-2` — Fast, good quality, suitable for iteration and drafts
- `sora-2-pro` — Higher quality, slower, for production/cinematic output

**Pricing (per second of video):**

| Model | 720p | 1080p | 4K |
|-------|------|-------|-----|
| sora-2 | $0.10/sec | $0.20/sec | $0.50/sec |
| sora-2-pro | ~2× sora-2 rates | ~2× | ~2× |

An 8-second 1080p video with sora-2 costs approximately $1.60.
An 8-second 1080p video with sora-2-pro costs approximately $3.20.

**Key API details:**
- Endpoint: `POST /v1/videos` — creates an async render job
- Returns job ID and initial status immediately
- Poll with `GET /v1/videos/{video_id}` — states: `queued`, `in_progress`, `completed`, `failed`
- **Webhook support**: Register at OpenAI dashboard, events: `video.completed`, `video.failed`
- Download completed video: `GET /v1/videos/{video_id}/content` (streams binary MP4)
- Supports text-to-video and image-to-video (via `input_reference`)
- Duration: configurable `seconds` parameter
- Sizes: `1280x720`, `1920x1080`
- Render time: Several minutes depending on model, resolution, and API load

**Rate limits (API tiers):**

| Tier | sora-2 RPM | sora-2-pro RPM | Requirement |
|------|-----------|----------------|-------------|
| Tier 1 | 25 | 10 | $10+ top-up |
| Tier 2 | 50 | 25 | $50+ spent |
| Tier 3 | 100 | 50 | $100+ spent |
| Tier 4 | 200 | 100 | $250+ spent |
| Tier 5 | 375 | 150 | $1000+ spent |

**Critical finding:** Video is truly async — POST returns immediately, you must poll or use webhooks. OpenAI's webhook system is mostly reliable but has a known issue: moderation-blocked requests sometimes don't fire webhooks at all. Our system MUST implement both webhook receivers AND polling fallback.

**Preview vs Final strategy for video:**
- Preview: `sora-2` at 720p → faster, cheaper (~$0.80 for 8s)
- Final: `sora-2-pro` at 1080p → slower, higher quality (~$3.20 for 8s)
- Clear delineation between preview and final. User reviews 720p draft, then clicks "Render Final" for pro-quality 1080p.

**Webhook implementation:**
```
POST /v1/videos
  → returns { id: "video_abc123", status: "queued" }

Webhook fires to your endpoint:
  { type: "video.completed", data: { id: "video_abc123" } }

GET /v1/videos/video_abc123/content
  → streams MP4 binary
```

---

### Google Veo (Veo 3 / Veo 3.1)

**Models available (via Gemini API and Vertex AI):**
- `veo-3.0-generate-preview` — High-fidelity video with native audio
- `veo-3.1-generate-preview` — Latest, improved audio/character consistency
- `veo-3.1-fast-generate-preview` — Faster, cheaper variant

**Pricing:**
- Veo 3.1: $0.40/second of video
- Veo 3.1 Fast: $0.15/second of video
- Veo 3: $0.75/second (older, being superseded)

An 8-second video with Veo 3.1 costs approximately $3.20.
An 8-second video with Veo 3.1 Fast costs approximately $1.20.

**Key API details:**
- Uses Gemini API: `client.models.generate_videos()`
- Returns a long-running operation (LRO) — poll with `client.operations.get(operation)`
- Google Cloud Vertex AI also available for enterprise (same API, adds IAM/governance)
- Supports text-to-video, image-to-video, video extension
- Up to 3 reference images for character/product consistency
- Resolutions: 720p, 1080p, 4K (Veo 3.1)
- Aspect ratios: 16:9, 9:16 (portrait support)
- Duration: 4, 6, or 8 seconds (Veo 3 models)
- `sampleCount`: 1-4 videos per request (built-in batch)
- Native audio generation (dialogue, SFX, ambient)
- SynthID watermark embedded in all outputs

**Critical finding:** Veo uses a different SDK pattern than OpenAI. Our provider abstraction must handle:
1. OpenAI: REST API with polling/webhooks
2. Google: Python/Node SDK with long-running operations

Veo's `sampleCount` (1-4 videos per request) is useful for bulk — we can request multiple variations in a single API call, reducing overhead.

**Preview vs Final strategy for Veo:**
- Preview: `veo-3.1-fast-generate-preview` at 720p → $1.20 for 8s
- Final: `veo-3.1-generate-preview` at 1080p → $3.20 for 8s

---

## 2. Queue Architecture Deep Dive (BullMQ on DigitalOcean)

### Why BullMQ

BullMQ is the production-standard Node.js job queue built on Redis. Key capabilities confirmed by research:

- **Exactly-once delivery semantics** (at-least-once in worst case)
- **Priority queuing** — priorities 0 to 2^21 (0 = highest, follows Unix nice convention)
- **Concurrency control** — per-worker configurable concurrency
- **Rate limiting** — built-in rate limiter per queue
- **Job lifecycle tracking** — waiting → delayed → active → completed/failed
- **Retry with backoff** — configurable retry count and exponential backoff
- **Stalled job detection** — built-in stall check interval
- **Job events** — completed, failed, progress, stalled events
- **Repeatable jobs** — for cron-like scheduling (useful for stale job reaper)
- **Horizontal scaling** — add more workers to process in parallel
- **BullMQ Pro** — adds per-group concurrency/rate limits (paid, $pricing varies)

**Production requirements from BullMQ docs:**
1. Redis `maxmemory-policy` MUST be set to `noeviction` — BullMQ cannot work if Redis evicts keys
2. Workers should set `maxRetriesPerRequest: null` on IORedis — wait indefinitely for reconnection
3. Queue instances should fail fast on disconnection (for the API side on Vercel)
4. Handle unhandled exceptions globally in the worker process
5. Implement graceful shutdown — call `worker.close()` on SIGTERM to minimize stalled jobs

**BullMQ at scale considerations:**
- Millions of jobs/day is achievable with proper Redis sizing
- Use separate Redis instances for separate queue groups if throughput is critical
- Job data should be minimal — store references (generation IDs), not full payloads
- Clean completed/failed jobs regularly to prevent Redis memory bloat
- Use `removeOnComplete` and `removeOnFail` with a count limit

### Four-Queue Architecture

```
Queue: image_preview
  Priority: 1 (highest)
  Concurrency: 10 per worker
  Rate limit: 30/min (matches OpenAI tier limits)

Queue: video_preview
  Priority: 1 (highest)
  Concurrency: 5 per worker
  Rate limit: 10/min (conservative for video API limits)

Queue: image_final
  Priority: 2
  Concurrency: 5 per worker
  Rate limit: 20/min

Queue: video_final
  Priority: 2
  Concurrency: 3 per worker
  Rate limit: 5/min
```

**Queue selection logic:**
```
User clicks "Generate Image"
  → type=image, phase=preview → image_preview queue

User clicks "Generate Video"
  → type=video, phase=preview → video_preview queue

User clicks "Render Final" on image preview
  → type=image, phase=final → image_final queue

User clicks "Render Final" on video preview
  → type=video, phase=final → video_final queue
```

### Worker Deployment on DigitalOcean

**Option A: DO App Platform (recommended for start)**
- Deploy workers as "Worker" components (no HTTP, just background processing)
- Auto-restart on crash
- Horizontal scaling via instance count
- $12/mo per worker instance (Basic) or $24/mo (Professional)
- Connects to DO Managed Redis ($15/mo for 1GB)

**Option B: DO Droplets (better for scale)**
- More control, SSH access, custom Docker
- $24-48/mo per droplet
- Run multiple worker processes per droplet
- Use PM2 or systemd for process management
- Better cost efficiency at higher scale (run 5 workers on one $48 droplet)

**Recommended starting config:**
- 1× DO Managed Redis (1GB, $15/mo)
- 2× Image worker instances (handle image_preview + image_final)
- 1× Video worker instance (handle video_preview + video_final)
- 1× Reaper instance (stale job recovery, runs on a cron)
- Total infra: ~$75-100/mo before API costs

### Vercel → Redis Connection

Vercel serverless functions connect to DO Managed Redis via public TLS endpoint. The function only does `queue.add()` — enqueues and returns. Connection is lightweight and within Vercel's timeout limits (~50ms per enqueue operation).

**Important:** Use connection pooling or a lightweight Redis client in Vercel functions. IORedis with `lazyConnect: true` and `maxRetriesPerRequest: 1` prevents Vercel functions from hanging if Redis is temporarily unreachable.

---

## 3. Supabase Realtime Scaling Considerations

### How Postgres Changes Works

Supabase Realtime listens to Postgres WAL (Write-Ahead Log) via logical replication. When a row in the `generations` table is updated, the change is broadcast to all subscribed clients that pass RLS checks.

### Key Scaling Facts from Supabase Docs

1. **Single-threaded processing**: Database changes are processed on a single thread to maintain order. Compute upgrades don't significantly help Postgres Changes throughput.

2. **Authorization overhead**: Every change event is checked against RLS for each subscriber. 100 users subscribed + 1 insert = 100 RLS checks ("reads"). This can bottleneck the database.

3. **Recommendation for scale**: Use a separate "public" table without RLS for high-throughput realtime. Apply authorization at the application level instead.

### Implications for Our System

Our `generations` table will have frequent updates (status changes, progress updates, heartbeats). With multiple users per workspace watching the generations panel:

**Potential bottleneck scenario:**
- 10 workspaces × 3 users each = 30 subscribers
- Worker updating progress every 5 seconds across 20 active jobs = 4 updates/second
- 30 subscribers × 4 updates/sec = 120 RLS checks/second

This is manageable on a Supabase Pro plan. But at enterprise scale (100+ concurrent subscribers), it could become a problem.

**Mitigation strategies:**

1. **Filter at subscription level**: Subscribe with `filter: workspace_id=eq.{id}` so each client only receives their workspace's updates. This reduces the fan-out significantly.

2. **Throttle progress updates**: Workers should update progress at most every 10-15 seconds for video, not every 5 seconds. Status transitions (queued → running → complete) happen immediately.

3. **Consider Supabase Broadcast for progress**: Use Postgres Changes only for status transitions (these are low-frequency). Use Supabase Broadcast (which doesn't hit the database) for high-frequency progress updates. Workers push progress to a Broadcast channel, clients subscribe to both.

4. **Disable RLS on generations table for Realtime**: If we filter by workspace_id in the subscription AND enforce workspace_id at the API insert level, we can safely disable RLS on the Realtime subscription and rely on API-level authorization. This dramatically reduces the auth overhead.

5. **Separate progress from status**: Consider a lightweight `generation_progress` table or just use Broadcast for live progress, and only persist final status transitions to the `generations` table.

### Supabase Plan Requirements

- **Pro plan ($25/mo)**: 500 concurrent Realtime connections, sufficient for early scale
- **Team plan ($599/mo)**: Higher limits, SOC2, priority support
- **Enterprise**: Custom limits, HIPAA-eligible

For our system, Pro plan handles up to ~200-300 concurrent users comfortably. Beyond that, Team or Enterprise.

---

## 4. Provider Abstraction Layer (Enterprise Pattern)

### Interface Design

Each provider must implement a consistent interface so the queue workers don't need provider-specific logic. The abstraction handles three fundamental differences between providers:

1. **Sync vs Async generation**: OpenAI images are sync (block until done), video is async (poll/webhook)
2. **Different SDKs**: OpenAI uses REST/Node SDK, Google uses Gemini SDK
3. **Different status polling**: OpenAI has `/videos/{id}`, Google has `operations.get()`
4. **Different result formats**: OpenAI returns b64/URL, Google returns GCS URI or bytes

```typescript
interface MediaProvider {
  name: string;

  // Capabilities
  supports: {
    image: boolean;
    video: boolean;
    imageToVideo: boolean;
    batchCount: number;      // max items per single API call (Veo supports 1-4)
    webhooks: boolean;
    nativeAudio: boolean;
  };

  // Rate limits for our concurrency controller
  limits: {
    maxConcurrentImages: number;
    maxConcurrentVideos: number;
    imagesPerMinute: number;
    videosPerMinute: number;
  };

  // Cost per operation (for credit deduction)
  costs: {
    imagePreview: number;    // credits
    imageFinal: number;
    videoPreviewPerSecond: number;
    videoFinalPerSecond: number;
  };

  // Generation methods
  generateImage(params: ImageGenParams): Promise<ImageResult>;
  generateVideo(params: VideoGenParams): Promise<VideoJobResult>;
  
  // For async video — check status
  pollVideoStatus(externalJobId: string): Promise<VideoStatusResult>;
  
  // Download completed video to buffer
  downloadVideo(externalJobId: string): Promise<Buffer>;
}
```

### Provider-Specific Behaviors

**OpenAI Image Provider:**
- `generateImage()` is synchronous — resolves when image is ready
- Returns base64 data directly
- Worker: call API → decode base64 → upload to Supabase Storage → done
- No polling needed

**OpenAI Video Provider:**
- `generateVideo()` returns immediately with job ID
- Worker must poll `pollVideoStatus()` every 10-20 seconds
- OR register webhook and have a separate webhook receiver service
- Once complete, `downloadVideo()` streams the MP4
- Worker: call API → enter poll loop → download MP4 → upload to storage → done

**Google Veo Provider:**
- `generateVideo()` returns a long-running operation name
- Worker polls `pollVideoStatus()` using the operation name
- Veo supports `sampleCount: 1-4` — for bulk, generate multiple in one call
- Once complete, download from GCS URI or get bytes
- Worker: call API → enter poll loop → download video → upload to storage → done

### Webhook vs Polling Decision

**Use webhooks when:**
- OpenAI video (they support `video.completed` / `video.failed` webhooks)
- Saves worker compute — no polling loop burning cycles

**Use polling when:**
- Google Veo (no webhook support, uses LRO pattern)
- OpenAI video as fallback (webhook might not fire for moderation blocks)

**Hybrid approach (recommended):**
- Register OpenAI webhooks for primary notification
- Worker also runs a polling fallback: if no webhook received within expected time + 60s buffer, start polling
- This handles the known OpenAI bug where moderation-blocked requests silently fail without webhook

### Webhook Receiver Architecture

Since our API is on Vercel, the webhook receiver is a Vercel API route:

```
POST /api/webhooks/openai/video
  → Verify webhook signature
  → Look up generation by external job ID (stored in metadata)
  → If video.completed:
      → Push to appropriate _final queue or mark preview_ready
  → If video.failed:
      → Update generation status to failed with error message
```

The webhook receiver does NOT download the video. It simply updates the generation status and/or enqueues the next step. The worker handles the actual download and upload.

---

## 5. Multi-Provider Parallel + Bulk Batch Architecture

### Batch Modes (Confirmed from Previous Discussion)

| Mode | Prompts | Providers | Total Jobs | UI Layout |
|------|---------|-----------|------------|-----------|
| single | 1 | 1 | 1 | Single card |
| multi_provider | 1 | N | N | Side-by-side |
| bulk | N | 1 | N | Gallery grid |
| multi_both | N | N | N×N | Rows=prompts, Cols=providers |

### Concurrent Execution Model

When a batch of 6 jobs is created (3 prompts × 2 providers), all 6 jobs are enqueued simultaneously. The queue's concurrency controls determine how many actually execute in parallel:

```
User submits: 3 prompts × [openai, veo] = 6 jobs
  ↓
All 6 added to video_preview queue
  ↓
Queue concurrency: 5
Provider concurrency: openai=3, veo=2
  ↓
Execution: 3 OpenAI jobs + 2 Veo jobs start immediately
  ↓
6th job (Veo) waits for a Veo slot to free up
```

**Per-provider concurrency** is critical for batches. Without it, a bulk of 10 OpenAI jobs could hit rate limits immediately. BullMQ Pro has built-in group concurrency. If using open-source BullMQ, implement a semaphore per provider in the worker:

```typescript
// Simple semaphore for per-provider concurrency
const providerSemaphores = {
  openai: { current: 0, max: 5 },
  veo: { current: 0, max: 3 },
};
```

### Veo's Native Batch Advantage

Veo supports `sampleCount: 1-4`, generating multiple video variations in a single API call. For bulk mode with Veo, instead of 4 separate API calls, we can make 1 call with `sampleCount: 4`. This:
- Reduces API overhead
- May be faster (single render job vs 4)
- Counts as 1 RPM hit instead of 4

Our Veo provider should detect bulk same-prompt batches and consolidate into single `sampleCount` calls when possible.

### Cost Implications of Batch

A 3×2 batch (3 prompts, OpenAI + Veo, 8s video previews):
- OpenAI: 3 × 8s × $0.10/s = $2.40
- Veo: 3 × 8s × $0.15/s (fast) = $3.60
- Total preview cost: $6.00

If user finalizes 2 of the 6:
- 1 OpenAI final: 8s × $0.40/s (sora-2-pro 1080p) = $3.20
- 1 Veo final: 8s × $0.40/s (veo-3.1 1080p) = $3.20
- Total final cost: $6.40

**Total for this batch: $12.40 in API costs**

This validates why user-triggered finals are essential. If we auto-finalized all 6, the total would be $25.20. User-triggered saves ~50%.

---

## 6. Error Handling & Resilience (Enterprise Grade)

### Failure Modes and Handling

| Failure | Detection | Response |
|---------|-----------|----------|
| API rate limit (429) | HTTP response code | Exponential backoff, re-enqueue with delay |
| API timeout | No response within threshold | Retry with backoff, max 3 attempts |
| Content moderation block | API returns 400/failed status | Mark failed, store error, no retry |
| Worker crash mid-generation | Stale heartbeat detection | Reaper resets to queued, retry |
| Redis connection lost | IORedis error event | Worker waits for reconnect (infinite retry) |
| Supabase unavailable | Upload/update fails | Retry with backoff, buffer results locally |
| OpenAI webhook not received | Timeout after expected duration + buffer | Fall back to polling |
| Provider API deprecation | Changed response format | Provider adapter handles versioning |
| Insufficient credits | Pre-flight check before enqueue | Return 402 to user, don't enqueue |

### Idempotency

Every worker operation must be idempotent. If a job is processed twice (crash + retry):
- Upload uses deterministic key: `{workspace_id}/{generation_id}/preview.{ext}`
- Supabase Storage overwrites same key → no duplicate files
- DB update sets same status → no state corruption
- Credit deduction uses a transaction with idempotency key

### Circuit Breaker Per Provider

If a provider fails repeatedly, stop sending jobs to it:

```
Provider has 5 consecutive failures in 60 seconds
  → Circuit breaker OPEN
  → Jobs for this provider get delayed (not failed)
  → After 30 seconds, try one job (half-open)
  → If succeeds, close circuit
  → If fails, stay open, increase delay
```

This prevents burning credits on a broken provider while not permanently failing user jobs.

---

## 7. Storage Architecture

### Supabase Storage (Starting Point)

**Bucket structure:**
```
generations/
  {workspace_id}/
    {generation_id}/
      preview.png          (image preview)
      preview.mp4          (video preview)
      final.png            (image final)
      final.mp4            (video final)
      thumbnail.jpg        (auto-generated thumbnail for video)
```

**Access control:** Public bucket with signed URLs for download, or RLS-protected bucket with workspace_id checks. For speed, use a public bucket and generate signed URLs with expiration.

**Upload from worker:**
- Worker downloads result from provider API
- Buffers in memory (images are small, videos can be large)
- Uploads to Supabase Storage using service role key
- Updates `preview_url` or `final_url` in generations table

**Size considerations:**
- Image preview (low quality, 1024×1024): ~100-500KB
- Image final (high quality, 1536×1536): ~500KB-2MB
- Video preview (720p, 8s): ~5-15MB
- Video final (1080p, 8s): ~15-50MB

At scale (1000 generations/day), daily storage growth: ~5-50GB depending on mix.

**Migration path to Cloudflare R2:**
- R2 is S3-compatible, so swap is straightforward
- R2 includes free CDN (no egress fees) — significant cost savings at scale
- Supabase Storage charges for egress beyond plan limits
- Migration trigger: when storage egress costs exceed ~$50/mo

---

## 8. Monitoring & Observability

### What to Monitor

**Queue health:**
- Queue depth per queue (image_preview, video_preview, etc.)
- Job processing time (p50, p95, p99)
- Failed job rate per provider
- Stale job count (should always be 0)
- Worker utilization (active jobs / max concurrency)

**Provider health:**
- API response time per provider
- Error rate per provider
- Rate limit hits per provider
- Credit/cost per generation

**User experience:**
- Time from "Generate" click to preview_ready
- Time from "Render Final" to final_ready
- Batch completion time

### BullMQ Dashboard

Use `bull-board` for a web UI to monitor queues:
- See all queues, active/waiting/completed/failed counts
- Inspect individual jobs
- Retry failed jobs manually
- Deploy on the same DO instance as workers

---

## 9. Pricing Model Recommendations

### Credit Cost Matrix

| Provider | Type | Phase | Credits | Approx USD Cost |
|----------|------|-------|---------|-----------------|
| OpenAI | Image | Preview (low) | 1 | $0.01 |
| OpenAI | Image | Final (high) | 10 | $0.17 |
| OpenAI | Video 8s | Preview (sora-2, 720p) | 50 | $0.80 |
| OpenAI | Video 8s | Final (sora-2-pro, 1080p) | 200 | $3.20 |
| Veo | Video 8s | Preview (fast, 720p) | 75 | $1.20 |
| Veo | Video 8s | Final (3.1, 1080p) | 200 | $3.20 |

Set credits at ~1.5-2× raw API cost to cover infrastructure overhead and margin.

### Tier Limits

| Tier | Monthly Price | Credits | Max Concurrent Image | Max Concurrent Video |
|------|--------------|---------|---------------------|---------------------|
| Free | $0 | 50 | 2 | 0 |
| Starter | $29 | 500 | 3 | 1 |
| Pro | $79 | 2000 | 10 | 5 |
| Enterprise | Custom | Custom | 30 | 15 |

---

## 10. Build Order (Steel Thread)

### Phase 1: Single Image Preview (End-to-End)

This is the steel thread. Prove the entire pipeline works with the simplest possible case.

1. `generations` table migration (full schema with batch support baked in)
2. `generation_batches` table migration
3. `workspace_billing` + `credit_costs` tables
4. Redis + BullMQ queue setup on DigitalOcean
5. `POST /api/generations` — single image, single provider, creates row + enqueues
6. Image preview worker — pulls from queue, calls OpenAI, uploads to Supabase Storage, updates row
7. Supabase Realtime subscription on frontend
8. Generations panel UI — shows cards with status states, progress
9. End-to-end test: click Generate → see card appear → status transitions → preview image renders

### Phase 2: User-Triggered Finals + Credits

10. `POST /api/generations/[id]/finalize` route
11. Image final worker (same worker, different queue)
12. "Render Final" button in UI
13. Credit check before enqueue (both preview and final)
14. Credit deduction on job start, refund on failure

### Phase 3: Video Support

15. Video preview worker (OpenAI Sora) — async with polling + webhook fallback
16. `POST /api/webhooks/openai/video` — webhook receiver
17. Video final worker
18. UI: video player in generation cards, progress bar during generation

### Phase 4: Multi-Provider + Batch

19. Veo provider implementation
20. Provider abstraction layer (swap/add providers)
21. Multi-provider parallel (same prompt, N providers)
22. Batch UI: side-by-side comparison, gallery grid, prompt×provider matrix
23. Batch finalize routes
24. Per-provider concurrency limits in BullMQ

### Phase 5: Enterprise Hardening

25. Stale job reaper (cron on DO)
26. Circuit breaker per provider
27. bull-board monitoring dashboard
28. Workspace throttling enforcement
29. Alerting (queue depth, error rates, credit depletion)
30. Load testing with realistic batch scenarios

---

## 11. Key Technical Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Image API | gpt-image-1 (upgrade to 1.5 when ready) | Best quality, reasonable cost |
| Image preview model | `quality: "low"` | 3-5s, $0.01, good enough for review |
| Video preview model | sora-2 at 720p | Fast, cheap, good for iteration |
| Video final model | sora-2-pro at 1080p | Production quality |
| Veo preview model | veo-3.1-fast at 720p | Cheapest video option |
| Veo final model | veo-3.1 at 1080p | Highest quality from Google |
| Queue system | BullMQ (open source) | Battle-tested, fits Node.js stack |
| Queue hosting | DO Managed Redis | Simple, managed, $15/mo |
| Worker hosting | DO App Platform (start) → Droplets (scale) | Right balance of simplicity and control |
| Realtime updates | Supabase Postgres Changes + Broadcast hybrid | Changes for status, Broadcast for progress |
| Video status tracking | Webhook primary + polling fallback | Handles OpenAI's webhook gaps |
| Storage | Supabase Storage → Cloudflare R2 (later) | Start simple, migrate when egress costs matter |
| Batch handling | Separate rows per generation, linked by batch_id | Clean DB model, simple worker logic |

---

*This document is the source of truth for the media generation system architecture. All implementation decisions trace back to the research and decisions documented here.*
