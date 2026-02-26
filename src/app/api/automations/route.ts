import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const serviceClient = createServiceClient();
    const { data: workspace } = await serviceClient.from('workspaces').select('id').eq('user_id', user.id).single();
    if (!workspace) return NextResponse.json({ error: 'No workspace' }, { status: 404 });

    const { data: automations } = await serviceClient.from('automations').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false });

    return NextResponse.json({ automations: automations ?? [] });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const serviceClient = createServiceClient();
    const { data: workspace } = await serviceClient.from('workspaces').select('id').eq('user_id', user.id).single();
    if (!workspace) return NextResponse.json({ error: 'No workspace' }, { status: 404 });

    const { data: automation, error } = await serviceClient.from('automations').insert({
      workspace_id: workspace.id,
      user_id: user.id,
      name: body.name,
      description: body.description || null,
      is_active: body.is_active ?? false,
      trigger_type: body.trigger_type,
      trigger_config: body.trigger_config ?? {},
      action_config: body.action_config ?? {},
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(automation, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
