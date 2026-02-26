import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export const maxDuration = 60;

interface PipelineStep {
  step_type: string;
  prompt_template?: string;
  provider_tier?: string;
  depends_on?: number[]; // indexes of steps this depends on — enables parallel execution
  config?: Record<string, unknown>;
}

function resolvePrompt(
  template: string,
  variableValues: Record<string, string>,
  stepOutputs: Map<number, Record<string, unknown>>,
  prevIndex: number,
): string {
  let prompt = template;
  // Replace {{variable}} placeholders
  for (const [key, val] of Object.entries(variableValues)) {
    prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val);
  }
  // Replace {{prev_output}} with previous step's output
  const prevOutput = stepOutputs.get(prevIndex);
  if (prevOutput?.text) {
    prompt = prompt.replace(/\{\{prev_output\}\}/g, String(prevOutput.text));
  }
  // Replace {{step_N_output}} with specific step output
  for (const [idx, output] of stepOutputs) {
    if (output?.text) {
      prompt = prompt.replace(new RegExp(`\\{\\{step_${idx}_output\\}\\}`, 'g'), String(output.text));
    }
  }
  return prompt;
}

async function executeStep(
  step: PipelineStep,
  stepIndex: number,
  runId: string,
  variableValues: Record<string, string>,
  stepOutputs: Map<number, Record<string, unknown>>,
  serviceClient: ReturnType<typeof createServiceClient>,
  cookieHeader: string,
): Promise<{ cost: number; output: Record<string, unknown> }> {
  const stepResultId = uuidv4();
  const prompt = resolvePrompt(
    step.prompt_template || '',
    variableValues,
    stepOutputs,
    stepIndex - 1,
  );

  await serviceClient.from('pipeline_step_results').insert({
    id: stepResultId, run_id: runId, step_index: stepIndex,
    step_type: step.step_type, status: 'ai-generating', cost_credits: 0,
  });

  try {
    const genRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify({
        type: step.step_type === 'export' ? 'image' : step.step_type,
        prompt,
        quality_tiers: [step.provider_tier || 'standard'],
        ...(step.config?.reference_image_url ? { reference_image_url: step.config.reference_image_url } : {}),
        ...(step.config?.reference_video_url ? { reference_video_url: step.config.reference_video_url } : {}),
        ...(step.config?.reference_audio_url ? { reference_audio_url: step.config.reference_audio_url } : {}),
      }),
    });

    const genData = await genRes.json();

    if (!genRes.ok) {
      await serviceClient.from('pipeline_step_results').update({
        status: 'failed', error: genData.error || 'Generation failed',
      }).eq('id', stepResultId);
      throw new Error(genData.error || `Step ${stepIndex + 1} generation failed`);
    }

    const stepCost = genData.total_preview_cost || 0;
    const output = {
      generation_ids: genData.generations?.map((g: { id: string }) => g.id),
      batch_id: genData.batch_id,
      text: prompt,
    };

    await serviceClient.from('pipeline_step_results').update({
      status: 'completed', cost_credits: stepCost, output,
      generation_id: genData.generations?.[0]?.id || null,
    }).eq('id', stepResultId);

    return { cost: stepCost, output };

  } catch (e) {
    await serviceClient.from('pipeline_step_results').update({
      status: 'failed', error: (e as Error).message,
    }).eq('id', stepResultId);
    throw e;
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: pipelineId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const variableValues = body.variable_values ?? {};
    const cookieHeader = request.headers.get('cookie') || '';

    const serviceClient = createServiceClient();

    // Load pipeline
    const { data: pipeline, error: pErr } = await serviceClient
      .from('pipelines').select('*').eq('id', pipelineId).single();
    if (pErr || !pipeline) return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });

    // Create pipeline run
    const runId = uuidv4();
    const { error: runErr } = await serviceClient.from('pipeline_runs').insert({
      id: runId, pipeline_id: pipelineId, workspace_id: pipeline.workspace_id,
      user_id: user.id, status: 'running', current_step_index: 0,
      variable_values: variableValues, total_cost_credits: 0,
    });
    if (runErr) return NextResponse.json({ error: 'Failed to create run', details: runErr.message }, { status: 500 });

    const steps: PipelineStep[] = pipeline.steps ?? [];
    const stepOutputs = new Map<number, Record<string, unknown>>();
    let totalCost = 0;
    let stepsCompleted = 0;

    // Build dependency graph — group steps into execution layers
    // Layer 0: steps with no deps or depends_on=[]
    // Layer 1: steps that depend on layer 0 steps
    // etc.
    // Steps in the same layer run in PARALLEL
    const layers: number[][] = [];
    const completed = new Set<number>();

    // Simple topological layering
    const remaining = new Set(steps.map((_, i) => i));
    while (remaining.size > 0) {
      const layer: number[] = [];
      for (const idx of remaining) {
        const deps = steps[idx].depends_on ?? (idx === 0 ? [] : [idx - 1]);
        // If all dependencies are completed, this step can run
        if (deps.every(d => completed.has(d))) {
          layer.push(idx);
        }
      }
      if (layer.length === 0) {
        // Circular dependency or invalid graph — fall back to sequential
        for (const idx of remaining) layer.push(idx);
        remaining.clear();
      }
      for (const idx of layer) {
        remaining.delete(idx);
        completed.add(idx);
      }
      layers.push(layer);
    }

    // Execute layers: parallel within layer, sequential between layers
    for (const layer of layers) {
      const results = await Promise.allSettled(
        layer.map(idx =>
          executeStep(steps[idx], idx, runId, variableValues, stepOutputs, serviceClient, cookieHeader)
        )
      );

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const stepIdx = layer[i];
        if (result.status === 'fulfilled') {
          totalCost += result.value.cost;
          stepOutputs.set(stepIdx, result.value.output);
          stepsCompleted++;
        } else {
          console.error(`[PipelineExec] Step ${stepIdx} failed:`, result.reason);
          // Mark run as partial failure but continue other steps in this layer
        }
      }

      await serviceClient.from('pipeline_runs').update({
        current_step_index: Math.max(...layer) + 1,
        total_cost_credits: totalCost,
      }).eq('id', runId);
    }

    // Final status
    const finalStatus = stepsCompleted === steps.length ? 'completed' : stepsCompleted > 0 ? 'completed' : 'failed';
    await serviceClient.from('pipeline_runs').update({
      status: finalStatus,
      total_cost_credits: totalCost,
      completed_at: new Date().toISOString(),
    }).eq('id', runId);

    return NextResponse.json({
      run_id: runId,
      status: finalStatus,
      total_cost_credits: totalCost,
      steps_completed: stepsCompleted,
      steps_total: steps.length,
    });
  } catch (e) {
    console.error('[PipelineExec] Fatal error:', e);
    return NextResponse.json({ error: 'Internal error', details: (e as Error).message }, { status: 500 });
  }
}
