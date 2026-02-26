import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: pipelineId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const variableValues = body.variable_values ?? {};

    const serviceClient = createServiceClient();

    // Load pipeline
    const { data: pipeline, error: pErr } = await serviceClient.from('pipelines').select('*').eq('id', pipelineId).single();
    if (pErr || !pipeline) return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });

    // Check workspace credits
    const { data: workspace } = await serviceClient.from('workspaces').select('*').eq('id', pipeline.workspace_id).single();
    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

    // Create pipeline run
    const runId = uuidv4();
    const { error: runErr } = await serviceClient.from('pipeline_runs').insert({
      id: runId,
      pipeline_id: pipelineId,
      workspace_id: pipeline.workspace_id,
      user_id: user.id,
      status: 'running',
      current_step_index: 0,
      variable_values: variableValues,
      total_cost_credits: 0,
    });
    if (runErr) return NextResponse.json({ error: 'Failed to create run', details: runErr.message }, { status: 500 });

    // Execute each step sequentially
    const steps = pipeline.steps ?? [];
    let totalCost = 0;
    let lastStepOutput: Record<string, unknown> = {};

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      // Resolve prompt template variables
      let prompt = step.prompt_template || '';
      for (const [key, val] of Object.entries(variableValues)) {
        prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val as string);
      }
      // Replace step output references
      if (lastStepOutput.text) prompt = prompt.replace(/\{\{prev_output\}\}/g, String(lastStepOutput.text));

      // Create step result record
      const stepResultId = uuidv4();
      await serviceClient.from('pipeline_step_results').insert({
        id: stepResultId, run_id: runId, step_index: i, step_type: step.step_type,
        status: 'ai-generating', cost_credits: 0,
      });

      // Create generation via internal API call
      try {
        const genRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') || '' },
          body: JSON.stringify({
            type: step.step_type === 'export' ? 'image' : step.step_type,
            prompt,
            quality_tiers: [step.provider_tier || 'standard'],
          }),
        });
        const genData = await genRes.json();

        if (!genRes.ok) {
          await serviceClient.from('pipeline_step_results').update({ status: 'failed', error: genData.error || 'Generation failed' }).eq('id', stepResultId);
          await serviceClient.from('pipeline_runs').update({ status: 'failed', current_step_index: i }).eq('id', runId);
          return NextResponse.json({ error: `Step ${i + 1} failed`, details: genData }, { status: 500 });
        }

        const stepCost = genData.total_preview_cost || 0;
        totalCost += stepCost;
        lastStepOutput = { generation_ids: genData.generations?.map((g: { id: string }) => g.id), text: prompt };

        await serviceClient.from('pipeline_step_results').update({
          status: 'completed', cost_credits: stepCost,
          output: { generation_ids: genData.generations?.map((g: { id: string }) => g.id), batch_id: genData.batch_id },
          generation_id: genData.generations?.[0]?.id || null,
        }).eq('id', stepResultId);
      } catch (e) {
        await serviceClient.from('pipeline_step_results').update({ status: 'failed', error: (e as Error).message }).eq('id', stepResultId);
        await serviceClient.from('pipeline_runs').update({ status: 'failed', current_step_index: i }).eq('id', runId);
        return NextResponse.json({ error: `Step ${i + 1} error`, details: (e as Error).message }, { status: 500 });
      }

      await serviceClient.from('pipeline_runs').update({ current_step_index: i + 1, total_cost_credits: totalCost }).eq('id', runId);
    }

    // Mark complete
    await serviceClient.from('pipeline_runs').update({ status: 'completed', total_cost_credits: totalCost, completed_at: new Date().toISOString() }).eq('id', runId);

    return NextResponse.json({ run_id: runId, status: 'completed', total_cost_credits: totalCost, steps_completed: steps.length });
  } catch (e) {
    return NextResponse.json({ error: 'Internal error', details: (e as Error).message }, { status: 500 });
  }
}
