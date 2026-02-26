import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const serviceClient = createServiceClient();
    const { data: workspace } = await serviceClient.from('workspaces').select('id').eq('user_id', user.id).single();
    if (!workspace) return NextResponse.json({ error: 'No workspace' }, { status: 404 });

    const { data: limits } = await serviceClient.from('workspace_limits').select('credits_balance, credits_monthly_allowance, credits_reset_at').eq('workspace_id', workspace.id).single();
    if (!limits) return NextResponse.json({ error: 'No limits' }, { status: 404 });

    return NextResponse.json(limits);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
