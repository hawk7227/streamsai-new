import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const serviceClient = createServiceClient();

    // Verify ownership
    const { data: existing } = await serviceClient.from('automations').select('user_id').eq('id', id).single();
    if (!existing || existing.user_id !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updateFields: Record<string, unknown> = {};
    if (body.is_active !== undefined) updateFields.is_active = body.is_active;
    if (body.name !== undefined) updateFields.name = body.name;
    if (body.description !== undefined) updateFields.description = body.description;
    if (body.trigger_config !== undefined) updateFields.trigger_config = body.trigger_config;
    if (body.action_config !== undefined) updateFields.action_config = body.action_config;
    updateFields.updated_at = new Date().toISOString();

    const { data: updated, error } = await serviceClient.from('automations').update(updateFields).eq('id', id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const serviceClient = createServiceClient();
    const { data: existing } = await serviceClient.from('automations').select('user_id').eq('id', id).single();
    if (!existing || existing.user_id !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { error } = await serviceClient.from('automations').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
