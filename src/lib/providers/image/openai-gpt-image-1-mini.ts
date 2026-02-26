import type { MediaProvider, ProviderCapabilities, ProviderLimits, GenerationParams, GenerationResult, ProviderStatusResult } from '@/lib/types';

export class OpenAIGPTImageMiniProvider implements MediaProvider {
  readonly name = 'openai-gpt-image-1-mini';
  readonly toolType = 'image' as const;

  readonly capabilities: ProviderCapabilities = {
    preview: true, final: true, batchCount: 4, webhooks: false, streaming: false,
    nativeAudio: false, maxDuration: null, maxResolution: '1024x1024',
    supportedAspectRatios: ['1:1', '16:9', '9:16'],
    supportedStyles: ['natural', 'vivid'],
  };

  readonly limits: ProviderLimits = { maxConcurrent: 10, requestsPerMinute: 30 };

  async generate(params: GenerationParams): Promise<GenerationResult> {
    const start = Date.now();
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return { success: false, error: { code: 'NO_API_KEY', message: 'OPENAI_API_KEY not set', retryable: false } };

    const quality = params.quality === 'preview' ? 'low' : 'medium';
    const size = params.quality === 'preview' ? '1024x1024' : '1024x1024';

    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-image-1-mini',
          prompt: params.prompt,
          n: 1,
          size,
          quality,
          response_format: 'b64_json',
        }),
        signal: AbortSignal.timeout(60_000),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({})) as Record<string, unknown>;
        const errMsg = (err.error as Record<string, string>)?.message ?? `HTTP ${response.status}`;
        const retryable = response.status === 429 || response.status >= 500;
        return { success: false, error: { code: `HTTP_${response.status}`, message: errMsg, retryable } };
      }

      const data = await response.json() as { data: Array<{ b64_json: string }> };
      return {
        success: true, resultBase64: data.data[0].b64_json, format: 'png',
        durationMs: Date.now() - start, costCents: 1,
        metadata: { model: 'gpt-image-1-mini', quality, size },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      const retryable = message.includes('timeout') || message.includes('ECONNRESET');
      return { success: false, error: { code: 'NETWORK', message, retryable } };
    }
  }

  pollStatus?: undefined;
  downloadResult?: undefined;
}
