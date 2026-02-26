import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server';

const SYSTEM_PROMPT = `You are the StreamsAI AI Copilot. You help users create content, manage pipelines, and control their workspace.

You have access to these tools:
1. generate_content - Create images, videos, voice, scripts, image-to-video, video-to-video, avatar, or edit/overlay content
2. check_credits - Show the user's current credit balance and usage
3. run_pipeline - Execute a saved pipeline with variable values
4. list_generations - Show recent generation history

When the user asks to generate content, use the generate_content tool.
When they ask about credits/balance/usage, use check_credits.
When they want to run a pipeline, use run_pipeline.
Be concise and action-oriented. Always confirm what you're doing.`;

const TOOLS = [
  {
    name: 'generate_content',
    description: 'Queue a content generation job. Returns a generation ID that the user can track.',
    input_schema: {
      type: 'object' as const,
      properties: {
        tool_type: { type: 'string', enum: ['image', 'video', 'voice', 'script', 'image_to_video', 'video_to_video', 'avatar', 'edit'], description: 'The type of content to generate' },
        prompt: { type: 'string', description: 'The generation prompt' },
        quality_tier: { type: 'string', enum: ['standard', 'premium', 'ultra'], description: 'Quality level' },
      },
      required: ['tool_type', 'prompt'],
    },
  },
  {
    name: 'check_credits',
    description: 'Get the current workspace credit balance and monthly allowance.',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'run_pipeline',
    description: 'Execute an existing pipeline by ID with optional variable values.',
    input_schema: {
      type: 'object' as const,
      properties: {
        pipeline_id: { type: 'string', description: 'The pipeline UUID to run' },
        variable_values: { type: 'object', description: 'Key-value pairs for pipeline variables' },
      },
      required: ['pipeline_id'],
    },
  },
];

async function executeToolCall(
  toolName: string,
  toolInput: Record<string, unknown>,
  userId: string,
  cookieHeader: string,
): Promise<string> {
  const serviceClient = createServiceClient();
  const { data: workspace } = await serviceClient.from('workspaces').select('id').eq('user_id', userId).single();

  switch (toolName) {
    case 'check_credits': {
      if (!workspace) return JSON.stringify({ error: 'No workspace found' });
      const { data: limits } = await serviceClient.from('workspace_limits')
        .select('credits_balance, credits_monthly_allowance, credits_reset_at')
        .eq('workspace_id', workspace.id).single();
      if (!limits) return JSON.stringify({ error: 'No credit data found' });
      return JSON.stringify(limits);
    }

    case 'generate_content': {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({
          type: toolInput.tool_type,
          prompt: toolInput.prompt,
          quality_tiers: [toolInput.quality_tier || 'standard'],
        }),
      });
      const data = await res.json();
      if (!res.ok) return JSON.stringify({ error: data.error || 'Generation failed' });
      return JSON.stringify({ success: true, batch_id: data.batch_id, generation_count: data.generations?.length, total_preview_cost: data.total_preview_cost });
    }

    case 'run_pipeline': {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/pipelines/${toolInput.pipeline_id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({ variable_values: toolInput.variable_values || {} }),
      });
      const data = await res.json();
      if (!res.ok) return JSON.stringify({ error: data.error || 'Pipeline execution failed' });
      return JSON.stringify(data);
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { messages } = await request.json();
    if (!messages?.length) return NextResponse.json({ error: 'No messages provided' }, { status: 400 });

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 });

    const cookieHeader = request.headers.get('cookie') || '';

    // Call Anthropic Claude API with tools
    const claudeMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role, content: m.content,
    }));

    let claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages: claudeMessages,
      }),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      return NextResponse.json({ error: `Claude API error: ${claudeRes.status}`, details: err }, { status: 502 });
    }

    let claudeData = await claudeRes.json();

    // Handle tool use loop (Claude may call tools then respond)
    const conversationMessages = [...claudeMessages];
    let maxToolRounds = 3;

    while (claudeData.stop_reason === 'tool_use' && maxToolRounds > 0) {
      maxToolRounds--;

      // Add assistant message with tool calls
      conversationMessages.push({ role: 'assistant', content: claudeData.content });

      // Execute each tool call
      const toolResults: { type: string; tool_use_id: string; content: string }[] = [];
      for (const block of claudeData.content) {
        if (block.type === 'tool_use') {
          const result = await executeToolCall(block.name, block.input, user.id, cookieHeader);
          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result });
        }
      }

      // Add tool results and call Claude again
      conversationMessages.push({ role: 'user', content: toolResults });

      claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          tools: TOOLS,
          messages: conversationMessages,
        }),
      });

      if (!claudeRes.ok) break;
      claudeData = await claudeRes.json();
    }

    // Extract text response
    const textBlocks = claudeData.content?.filter((b: { type: string }) => b.type === 'text') || [];
    const responseText = textBlocks.map((b: { text: string }) => b.text).join('\n');

    // Extract tool use info for UI
    const toolUseBlocks = claudeData.content?.filter((b: { type: string }) => b.type === 'tool_use') || [];
    const toolUseInfo = toolUseBlocks.length > 0 ? { name: toolUseBlocks[0].name, input: toolUseBlocks[0].input } : undefined;

    return NextResponse.json({
      content: responseText || 'Done! Check your results.',
      tool_use: toolUseInfo,
    });
  } catch (e) {
    return NextResponse.json({ content: 'Sorry, I encountered an error processing your request.', error: (e as Error).message }, { status: 500 });
  }
}
