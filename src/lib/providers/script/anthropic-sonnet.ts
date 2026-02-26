import type { MediaProvider, ProviderCapabilities, ProviderLimits, GenerationParams, GenerationResult } from '@/lib/types';

export class AnthropicSonnetProvider implements MediaProvider {
  readonly name = 'anthropic-sonnet';
  readonly toolType = 'script' as const;

  readonly capabilities: ProviderCapabilities = {
    preview: true, final: true, batchCount: 1, webhooks: false, streaming: true,
    nativeAudio: false, maxDuration: null, maxResolution: null,
    supportedAspectRatios: [], supportedStyles: [],
  };

  readonly limits: ProviderLimits = { maxConcurrent: 10, requestsPerMinute: 30 };

  async generate(params: GenerationParams): Promise<GenerationResult> {
    const start = Date.now();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return { success: false, error: { code: 'NO_API_KEY', message: 'ANTHROPIC_API_KEY not set', retryable: false } };

    const maxTokens = params.quality === 'preview' ? 1000 : 4000;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: params.prompt }],
        }),
        signal: AbortSignal.timeout(90_000),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({})) as Record<string, unknown>;
        const errMsg = (err.error as Record<string, string>)?.message ?? `HTTP ${response.status}`;
        return { success: false, error: { code: `HTTP_${response.status}`, message: errMsg, retryable: response.status === 429 || response.status >= 500 } };
      }

      const data = await response.json() as { content: Array<{ type: string; text: string }>; usage: { input_tokens: number; output_tokens: number } };
      const text = data.content.filter((c) => c.type === 'text').map((c) => c.text).join('\n');
      const wordCount = text.split(/\s+/).length;
      const costCents = Math.ceil((data.usage.input_tokens * 3 + data.usage.output_tokens * 15) / 1_000_000 * 100);

      return {
        success: true, format: 'txt', durationMs: Date.now() - start, costCents: Math.max(1, costCents),
        metadata: { text, wordCount, model: 'claude-sonnet-4-5-20250929', tokens: data.usage },
      };
    } catch (err) {
      return { success: false, error: { code: 'NETWORK', message: err instanceof Error ? err.message : 'Unknown', retryable: true } };
    }
  }
}
