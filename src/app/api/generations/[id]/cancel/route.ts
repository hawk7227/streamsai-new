import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// POST /api/generations/[id]/cancel
//
// Cancels a generation. Refunds credits if still queued (not yet started).
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

    // Get generation
    const { data: generation, error: genError } = await serviceClient
      .from('generations')
      .select('id, status, preview_cost_credits, final_cost_credits, workspace_id')
      .eq('id', id)
      .eq('workspace_id', workspace.id)
      .single();

    if (genError || !generation) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    // Can't cancel already completed or cancelled
    const terminalStatuses = ['final_ready', 'cancelled'];
    if (terminalStatuses.includes(generation.status)) {
      return NextResponse.json(
        { error: 'Invalid State', details: `Cannot cancel a generation with status '${generation.status}'.` },
        { status: 409 },
      );
    }

    // Determine refund amount
    let refundAmount = 0;
    if (generation.status === 'queued') {
      // Not yet started — full preview refund
      refundAmount = generation.preview_cost_credits;
    } else if (generation.status === 'queued_final') {
      // Final was queued but not started — refund final credits
      refundAmount = generation.final_cost_credits;
    }
    // If running_preview or running_final — no refund (work already in progress)

    // Update status
    const { data: updated, error: updateError } = await serviceClient
      .from('generations')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .not('status', 'in', '("final_ready","cancelled")')
      .select('id, status')
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: 'Cancel Failed', details: 'Could not cancel — status may have changed.' },
        { status: 409 },
      );
    }

    // Refund if applicable
    if (refundAmount > 0) {
      await serviceClient.rpc('refund_credits', {
        p_workspace_id: workspace.id,
        p_amount: refundAmount,
        p_generation_id: id,
      });
    }

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      refunded_credits: refundAmount,
    });

  } catch (err) {
    console.error('[POST /api/generations/[id]/cancel] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
