import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server';
import { resolveProvider, resolveProvidersBatch } from '@/lib/providers/registry';
import type {
  ToolType,
  QualityTier,
  BatchMode,
  Generation,
  CreateGenerationResponse,
} from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// ---------------------------------------------------------------------------
// Validation Schema
// ---------------------------------------------------------------------------

const CreateGenerationSchema = z.object({
  type: z.enum(['image', 'video', 'voice', 'script']),
  prompt: z.string().min(1).max(2000),
  negative_prompt: z.string().max(500).optional(),
  quality_tiers: z.array(z.enum(['standard', 'premium', 'ultra'])).min(1).max(3),
  aspect_ratio: z.string().optional(),
  duration: z.number().min(1).max(120).optional(),
  resolution: z.string().optional(),
  style: z.string().optional(),
  voice_id: z.string().optional(),
  language: z.string().optional(),
  batch_mode: z.enum(['single', 'multi_provider', 'bulk', 'multi_both']).optional(),
  prompts: z.array(z.string().min(1).max(2000)).max(10).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// ---------------------------------------------------------------------------
// Concurrency limit per tool type per workspace tier
// ---------------------------------------------------------------------------

const CONCURRENCY_MAP: Record<string, Record<ToolType, number>> = {
  free:       { image: 3,  video: 1,  voice: 2,  script: 5 },
  pro:        { image: 10, video: 5,  voice: 8,  script: 15 },
  enterprise: { image: 30, video: 15, voice: 20, script: 50 },
};

const TOTAL_CONCURRENT_MAP: Record<string, number> = {
  free: 6,
  pro: 30,
  enterprise: 100,
};

// ---------------------------------------------------------------------------
// POST /api/generations
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'You must be logged in to generate content.' },
        { status: 401 },
      );
    }

    // 2. Parse + validate request body
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Invalid JSON body.' },
        { status: 400 },
      );
    }

    const parsed = CreateGenerationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation Error', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const serviceClient = createServiceClient();

    // 3. Get user's workspace
    const { data: workspace, error: wsError } = await serviceClient
      .from('workspaces')
      .select('id, tier, enabled_tools')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (wsError || !workspace) {
      return NextResponse.json(
        { error: 'No Workspace', details: 'No workspace found for this user.' },
        { status: 404 },
      );
    }

    // 4. Check tool is enabled for this workspace
    if (!workspace.enabled_tools.includes(input.type)) {
      return NextResponse.json(
        { error: 'Tool Not Enabled', details: `${input.type} generation is not enabled for your workspace. Upgrade to access this tool.` },
        { status: 403 },
      );
    }

    // 5. Get workspace limits + credits
    const { data: limits, error: limitsError } = await serviceClient
      .from('workspace_limits')
      .select('*')
      .eq('workspace_id', workspace.id)
      .single();

    if (limitsError || !limits) {
      return NextResponse.json(
        { error: 'Limits Error', details: 'Could not load workspace limits.' },
        { status: 500 },
      );
    }

    // 6. Build the list of generations to create
    const generationsToCreate = await buildGenerationsList(input, workspace.id, user.id);

    if (generationsToCreate.length === 0) {
      return NextResponse.json(
        { error: 'No Providers', details: 'No active providers found for the requested quality tiers.' },
        { status: 400 },
      );
    }

    // 7. Calculate total preview cost
    const totalPreviewCost = generationsToCreate.reduce((sum, g) => sum + g.preview_cost_credits, 0);

    // 8. Check credits
    if (limits.credits_balance < totalPreviewCost) {
      return NextResponse.json(
        { error: 'Insufficient Credits', details: `Need ${totalPreviewCost} credits but only ${limits.credits_balance} available.`, needed: totalPreviewCost, available: limits.credits_balance },
        { status: 402 },
      );
    }

    // 9. Check concurrency limits
    const concurrencyCheck = await checkConcurrency(
      serviceClient,
      workspace.id,
      workspace.tier,
      input.type,
      generationsToCreate.length,
    );

    if (!concurrencyCheck.allowed) {
      return NextResponse.json(
        { error: 'Concurrency Limit', details: concurrencyCheck.message, active: concurrencyCheck.active, limit: concurrencyCheck.limit },
        { status: 429 },
      );
    }

    // 10. Create batch record if multi-generation
    let batchId: string | null = null;
    if (generationsToCreate.length > 1) {
      const batchMode: BatchMode = input.batch_mode ?? (
        input.quality_tiers.length > 1 ? 'multi_provider' : 'bulk'
      );

      const { data: batch, error: batchError } = await serviceClient
        .from('generation_batches')
        .insert({
          workspace_id: workspace.id,
          user_id: user.id,
          mode: batchMode,
          prompt: input.prompt,
          prompts: input.prompts ?? null,
          quality_tiers: input.quality_tiers,
          total_generations: generationsToCreate.length,
          status: 'in_progress',
        })
        .select('id')
        .single();

      if (batchError || !batch) {
        return NextResponse.json(
          { error: 'Batch Create Error', details: 'Failed to create generation batch.' },
          { status: 500 },
        );
      }
      batchId = batch.id;
    }

    // 11. Insert all generation records
    const rows = generationsToCreate.map((g) => ({
      ...g,
      batch_id: batchId,
    }));

    const { data: insertedGenerations, error: insertError } = await serviceClient
      .from('generations')
      .insert(rows)
      .select('id, type, quality_tier, status, preview_cost_credits');

    if (insertError || !insertedGenerations) {
      return NextResponse.json(
        { error: 'Insert Error', details: insertError?.message ?? 'Failed to create generation records.' },
        { status: 500 },
      );
    }

    // 12. Deduct preview credits (atomic)
    const { error: deductError } = await serviceClient.rpc('deduct_credits', {
      p_workspace_id: workspace.id,
      p_amount: totalPreviewCost,
      p_generation_id: insertedGenerations[0].id, // idempotency anchor
    });

    if (deductError) {
      // Rollback: delete the generations we just inserted
      await serviceClient
        .from('generations')
        .delete()
        .in('id', insertedGenerations.map((g: { id: string }) => g.id));

      if (batchId) {
        await serviceClient.from('generation_batches').delete().eq('id', batchId);
      }

      return NextResponse.json(
        { error: 'Credit Deduction Failed', details: deductError.message },
        { status: 500 },
      );
    }

    // 13. Enqueue jobs to BullMQ
    // NOTE: In production, this calls the BullMQ queue on DigitalOcean.
    // For now, we enqueue via an internal API call that the worker polls.
    // The generations table IS the queue — workers poll for status='queued'.
    // This is the simplest correct pattern before BullMQ workers are deployed.
    //
    // When BullMQ workers are deployed, this section will push to Redis queues.
    // The generations table still serves as the source of truth.

    // 14. Build response
    const remainingCredits = limits.credits_balance - totalPreviewCost;

    const response: CreateGenerationResponse = {
      batch_id: batchId,
      generations: insertedGenerations.map((g: { id: string; type: ToolType; quality_tier: QualityTier; status: string; preview_cost_credits: number }) => ({
        id: g.id,
        type: g.type as ToolType,
        quality_tier: g.quality_tier as QualityTier,
        status: g.status as Generation['status'],
        preview_cost_credits: g.preview_cost_credits,
        estimated_seconds: estimateGenerationTime(input.type, g.quality_tier as QualityTier),
      })),
      total_preview_cost: totalPreviewCost,
      remaining_credits: remainingCredits,
    };

    return NextResponse.json(response, { status: 201 });

  } catch (err) {
    console.error('[POST /api/generations] Unhandled error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// GET /api/generations — list generations for workspace
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const batchId = searchParams.get('batch_id');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    const serviceClient = createServiceClient();

    // Get workspace
    const { data: workspace } = await serviceClient
      .from('workspaces')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: 'No workspace' }, { status: 404 });
    }

    let query = serviceClient
      .from('generations')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (type) query = query.eq('type', type);
    if (batchId) query = query.eq('batch_id', batchId);

    const { data: generations, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: 'Query Error', details: error.message }, { status: 500 });
    }

    return NextResponse.json({
      generations: generations ?? [],
      total: count ?? 0,
      has_more: (count ?? 0) > offset + limit,
    });

  } catch (err) {
    console.error('[GET /api/generations] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function buildGenerationsList(
  input: z.infer<typeof CreateGenerationSchema>,
  workspaceId: string,
  userId: string,
): Promise<Array<Omit<Generation, 'id' | 'created_at' | 'batch_id'> & { id: string }>> {
  const generations: Array<Omit<Generation, 'created_at' | 'batch_id'> & { id: string }> = [];
  const prompts = input.prompts && input.prompts.length > 0 ? input.prompts : [input.prompt];

  // SINGLE DB query for all tiers (fixes N+1 sequential bottleneck)
  const resolvedProviders = await resolveProvidersBatch(input.type, input.quality_tiers);

  for (const prompt of prompts) {
    for (const tier of input.quality_tiers) {
      const resolved = resolvedProviders.get(tier);
      if (!resolved) continue;

      const { mapping } = resolved;

      generations.push({
        id: uuidv4(),
        workspace_id: workspaceId,
        user_id: userId,
        type: input.type,
        provider: mapping.provider_key,
        quality_tier: tier,
        prompt,
        negative_prompt: input.negative_prompt ?? null,
        aspect_ratio: input.aspect_ratio ?? null,
        duration: input.duration ?? null,
        resolution: input.resolution ?? (mapping.config as Record<string, string>).resolution ?? null,
        style: input.style ?? null,
        voice_id: input.voice_id ?? null,
        language: input.language ?? null,
        status: 'queued',
        progress: 0,
        error_message: null,
        retry_count: 0,
        max_retries: 3,
        preview_url: null,
        final_url: null,
        preview_metadata: null,
        final_metadata: null,
        preview_cost_credits: mapping.preview_cost_credits,
        final_cost_credits: mapping.final_cost_credits,
        cost_cents: 0,
        worker_id: null,
        worker_heartbeat_at: null,
        external_job_id: null,
        started_at: null,
        preview_completed_at: null,
        final_requested_at: null,
        completed_at: null,
        metadata: input.metadata ?? {},
      });
    }
  }

  return generations;
}

interface ConcurrencyCheckResult {
  allowed: boolean;
  message: string;
  active: number;
  limit: number;
}

async function checkConcurrency(
  serviceClient: ReturnType<typeof createServiceClient>,
  workspaceId: string,
  tier: string,
  toolType: ToolType,
  newJobCount: number,
): Promise<ConcurrencyCheckResult> {
  // Get active count for this tool type
  const { data: toolCount } = await serviceClient.rpc('count_active_generations', {
    p_workspace_id: workspaceId,
    p_tool_type: toolType,
  });

  // Get total active count
  const { data: totalCount } = await serviceClient.rpc('count_active_generations', {
    p_workspace_id: workspaceId,
  });

  const activeForTool = (toolCount as number) ?? 0;
  const activeTotal = (totalCount as number) ?? 0;

  const tierLimits = CONCURRENCY_MAP[tier] ?? CONCURRENCY_MAP.free;
  const toolLimit = tierLimits[toolType];
  const totalLimit = TOTAL_CONCURRENT_MAP[tier] ?? TOTAL_CONCURRENT_MAP.free;

  // Check per-tool limit
  if (activeForTool + newJobCount > toolLimit) {
    return {
      allowed: false,
      message: `${toolType} concurrency limit reached. Active: ${activeForTool}, limit: ${toolLimit} for ${tier} tier.`,
      active: activeForTool,
      limit: toolLimit,
    };
  }

  // Check total limit
  if (activeTotal + newJobCount > totalLimit) {
    return {
      allowed: false,
      message: `Total concurrency limit reached. Active: ${activeTotal}, limit: ${totalLimit} for ${tier} tier.`,
      active: activeTotal,
      limit: totalLimit,
    };
  }

  return { allowed: true, message: 'OK', active: activeForTool, limit: toolLimit };
}

function estimateGenerationTime(toolType: ToolType, tier: QualityTier): number {
  const estimates: Record<ToolType, Record<QualityTier, number>> = {
    image:  { standard: 5,  premium: 15, ultra: 20 },
    video:  { standard: 60, premium: 120, ultra: 180 },
    voice:  { standard: 8,  premium: 12, ultra: 15 },
    script: { standard: 3,  premium: 5,  ultra: 8 },
  };
  return estimates[toolType]?.[tier] ?? 30;
}
