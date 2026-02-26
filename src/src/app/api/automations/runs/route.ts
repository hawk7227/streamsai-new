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

    const { data: runs } = await serviceClient
      .from('automation_runs')
      .select('*, automations(name)')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false })
      .limit(50);

    const formatted = (runs || []).map(r => ({
      ...r,
      automation_name: r.automations?.name || null,
      automations: undefined,
    }));

    return NextResponse.json({ runs: formatted });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
