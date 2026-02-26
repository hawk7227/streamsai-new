import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// POST /api/webhooks/openai-video
//
// OpenAI fires this when a Sora video job completes or fails.
// Event types: video.completed, video.failed
//
// Payload shape:
// {
//   "id": "evt_abc123",
//   "object": "event",
//   "created_at": 1758941485,
//   "type": "video.completed" | "video.failed",
//   "data": { "id": "video_abc123" }
// }
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // TODO: Verify webhook signature when OpenAI provides one
    // For now, we validate by matching the external_job_id in our DB.

    const body = await request.json().catch(() => null);
    if (!body || !body.type || !body.data?.id) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const eventType = body.type as string;
    const videoJobId = body.data.id as string;

    const serviceClient = createServiceClient();

    // Find the generation by external_job_id
    const { data: generation, error: findError } = await serviceClient
      .from('generations')
      .select('id, status, workspace_id, type, provider')
      .eq('external_job_id', videoJobId)
      .single();

    if (findError || !generation) {
      // Not found — might be from a different system or already processed
      console.warn(`[Webhook] No generation found for external_job_id: ${videoJobId}`);
      return NextResponse.json({ received: true, matched: false });
    }

    if (eventType === 'video.completed') {
      // Determine which status to transition to based on current status
      const isPreview = generation.status === 'running_preview';
      const newStatus = isPreview ? 'preview_ready' : 'final_ready';
      const timestampField = isPreview ? 'preview_completed_at' : 'completed_at';

      // Download URL will be fetched by the worker — for now mark the status
      // The worker will call GET /videos/{video_id}/content to download
      const { error: updateError } = await serviceClient
        .from('generations')
        .update({
          status: newStatus,
          progress: 100,
          [timestampField]: new Date().toISOString(),
          metadata: {
            ...((generation as Record<string, unknown>).metadata as Record<string, unknown> ?? {}),
            webhook_received_at: new Date().toISOString(),
            webhook_event_id: body.id,
          },
        })
        .eq('id', generation.id)
        .in('status', ['running_preview', 'running_final']);

      if (updateError) {
        console.error(`[Webhook] Failed to update generation ${generation.id}:`, updateError);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
      }

      console.log(`[Webhook] Video ${videoJobId} completed → generation ${generation.id} → ${newStatus}`);

    } else if (eventType === 'video.failed') {
      const errorMessage = body.data.error ?? 'Video generation failed (no details from provider)';

      const { error: updateError } = await serviceClient
        .from('generations')
        .update({
          status: 'failed',
          error_message: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage),
          completed_at: new Date().toISOString(),
        })
        .eq('id', generation.id);

      if (updateError) {
        console.error(`[Webhook] Failed to update generation ${generation.id}:`, updateError);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
      }

      // Refund credits on failure

      // Fetch the generation to get cost for refund
      const { data: genForRefund } = await serviceClient
        .from('generations')
        .select('preview_cost_credits, final_cost_credits')
        .eq('id', generation.id)
        .single();

      if (genForRefund) {
        const isPreviewRefund = generation.status === 'running_preview';
        const refundAmount = isPreviewRefund
          ? (genForRefund.preview_cost_credits as number)
          : (genForRefund.final_cost_credits as number);
        if (refundAmount > 0) {
          await serviceClient.rpc('refund_credits', {
            p_workspace_id: generation.workspace_id,
            p_amount: refundAmount,
            p_generation_id: generation.id,
          });
        }
      }

      console.log(`[Webhook] Video ${videoJobId} failed → generation ${generation.id}`);
    }

    return NextResponse.json({ received: true, matched: true });

  } catch (err) {
    console.error('[Webhook /api/webhooks/openai-video] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
