import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// POST /api/generations/[id]/finalize
//
// Moves a generation from preview_ready → queued_final.
// Charges the final_cost_credits. Only works on status='preview_ready'.
// ---------------------------------------------------------------------------

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Get generation — must be in preview_ready state
    const { data: generation, error: genError } = await serviceClient
      .from('generations')
      .select('id, status, final_cost_credits, workspace_id')
      .eq('id', id)
      .eq('workspace_id', workspace.id)
      .single();

    if (genError || !generation) {
      return NextResponse.json(
        { error: 'Not Found', details: 'Generation not found or access denied.' },
        { status: 404 },
      );
    }

    if (generation.status !== 'preview_ready') {
      return NextResponse.json(
        { error: 'Invalid State', details: `Cannot finalize a generation with status '${generation.status}'. Must be 'preview_ready'.` },
        { status: 409 },
      );
    }

    // Check credits for final render
    const { data: limits } = await serviceClient
      .from('workspace_limits')
      .select('credits_balance')
      .eq('workspace_id', workspace.id)
      .single();

    if (!limits || limits.credits_balance < generation.final_cost_credits) {
      return NextResponse.json(
        {
          error: 'Insufficient Credits',
          details: `Need ${generation.final_cost_credits} credits for final render but only ${limits?.credits_balance ?? 0} available.`,
          needed: generation.final_cost_credits,
          available: limits?.credits_balance ?? 0,
        },
        { status: 402 },
      );
    }

    // Deduct final credits
    const { error: deductError } = await serviceClient.rpc('deduct_credits', {
      p_workspace_id: workspace.id,
      p_amount: generation.final_cost_credits,
      p_generation_id: id,
    });

    if (deductError) {
      return NextResponse.json(
        { error: 'Credit Deduction Failed', details: deductError.message },
        { status: 500 },
      );
    }

    // Transition status: preview_ready → queued_final
    const { data: updated, error: updateError } = await serviceClient
      .from('generations')
      .update({
        status: 'queued_final',
        final_requested_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'preview_ready') // Optimistic lock — only update if still preview_ready
      .select('id, status, final_cost_credits')
      .single();

    if (updateError || !updated) {
      // Refund if update failed (race condition — another request finalized it)
      await serviceClient.rpc('refund_credits', {
        p_workspace_id: workspace.id,
        p_amount: generation.final_cost_credits,
        p_generation_id: id,
      });

      return NextResponse.json(
        { error: 'Finalize Failed', details: 'Could not finalize — generation may have been modified by another request.' },
        { status: 409 },
      );
    }

    // NOTE: In production, this would also enqueue a BullMQ job to the
    // appropriate _final queue. For now, workers poll the generations
    // table for status='queued_final'.

    const remainingCredits = (limits?.credits_balance ?? 0) - generation.final_cost_credits;

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      final_cost_credits: updated.final_cost_credits,
      remaining_credits: remainingCredits,
    });

  } catch (err) {
    console.error('[POST /api/generations/[id]/finalize] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
