import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// GET /api/generations/[id] — get single generation
// ---------------------------------------------------------------------------

export async function GET(
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

    // Get workspace for user
    const { data: workspace } = await serviceClient
      .from('workspaces')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: 'No workspace' }, { status: 404 });
    }

    // Get generation — scoped to workspace (access control)
    const { data: generation, error } = await serviceClient
      .from('generations')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', workspace.id)
      .single();

    if (error || !generation) {
      return NextResponse.json(
        { error: 'Not Found', details: 'Generation not found or access denied.' },
        { status: 404 },
      );
    }

    return NextResponse.json(generation);
  } catch (err) {
    console.error('[GET /api/generations/[id]] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
